import {
  AdminPanel,
  onCharacter,
  onClientCallback,
  online,
  PlayerMap,
} from "@aicore-fivem/lib/server";
import type { CharacterInfo } from "@aicore-fivem/shared";
import { EVENTS, readSettings, type Counts, type Row } from "common/board";
import { schema } from "./schema";

const panel = new AdminPanel(schema);
const settings = panel.view("settings", readSettings);

/**
 * The player list as snapshot + deltas: a client subscribes once (its first open), gets the whole list as a latent
 * event, then a `put` / `remove` per character load / unload. `seq` orders deltas against the snapshot. A settings
 * change (ids or names shown) ends every subscription; clients drop their list on the same change and ask again.
 */
class Roster {
  private readonly rows = new Map<number, Row>();
  private readonly watchers = new PlayerMap<true>();
  private nextKey = 0;
  private seq = 0;

  private row(source: number, character: CharacterInfo | null): Row {
    const s = settings.value;
    this.nextKey = this.nextKey >= 2_147_483_647 ? 1 : this.nextKey + 1;
    return {
      key: this.nextKey,
      id: s.showIds ? source : 0,
      name:
        s.showNames && character
          ? `${character.firstname} ${character.lastname}`
          : "",
    };
  }

  /** Builds every row again (start, settings change) and ends every subscription. */
  reset(): void {
    this.watchers.clear();
    this.rows.clear();
    for (const source of online.sources())
      this.rows.set(source, this.row(source, online.character(source)));
  }

  subscribe(source: number): void {
    this.watchers.set(source, true);
    const s = settings.value;
    const rows = s.showIds || s.showNames ? [...this.rows.values()] : [];
    TriggerLatentClientEvent(EVENTS.roster, source, 50_000, this.seq, rows);
  }

  put(source: number, character: CharacterInfo): void {
    this.remove(source);
    const row = this.row(source, character);
    this.rows.set(source, row);
    this.send(EVENTS.put, row);
  }

  remove(source: number): void {
    const row = this.rows.get(source);
    if (!row) return;
    this.rows.delete(source);
    this.send(EVENTS.remove, row.key);
  }

  private send(event: string, payload: unknown): void {
    const s = settings.value;
    if (!s.showIds && !s.showNames) return;
    this.seq++;
    for (const watcher of this.watchers.keys())
      emitNet(event, watcher, this.seq, payload);
  }
}

const roster = new Roster();
roster.reset();
panel.onChange("settings", () => roster.reset());
onCharacter({
  loaded: (source, character) => roster.put(source, character),
  unloaded: (source) => roster.remove(source),
});

onClientCallback(
  EVENTS.board,
  (): Counts => ({
    online: GetNumPlayerIndices(),
    max: GetConvarInt("sv_maxclients", 48),
    jobs: settings.value.jobs.map((j) => ({
      label: j.label,
      count: online.onDutyFor(j.job).size,
    })),
  }),
  { rate: { count: 2, windowMs: 2000 } },
);

onClientCallback(
  EVENTS.subscribe,
  (source) => {
    roster.subscribe(source);
    return { ok: true };
  },
  { rate: { count: 1, windowMs: 5000 } },
);
