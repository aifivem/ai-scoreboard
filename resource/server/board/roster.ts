import { every, online, PlayerMap } from "@aicore-fivem/lib/server";
import type { CharacterInfo } from "@aicore-fivem/shared";
import { EVENTS, type Row } from "common/board";
import { settings } from "./content";

/**
 * The player list as snapshot + deltas: a client subscribes once (its first open), gets the whole list as a latent
 * event, then a `put` / `remove` per character load / unload. `seq` orders deltas against the snapshot. A settings
 * change (ids or names shown) ends every subscription; clients drop their list on the same change and ask again.
 */
export class Roster {
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
    this.puts.set(row.key, row);
    this.flushJob.set(true);
  }

  remove(source: number): void {
    const row = this.rows.get(source);
    if (!row) return;
    this.rows.delete(source);
    // A row that came and went inside one window never reaches anyone.
    if (!this.puts.delete(row.key)) this.removes.add(row.key);
    this.flushJob.set(true);
  }

  /** Joins and leaves of the last second go to every subscriber as one event (a refill is not N x N events). */
  private readonly puts = new Map<number, Row>();
  private readonly removes = new Set<number>();
  private readonly flushJob = every(1000, () => this.flush(), {
    active: false,
    name: "roster flush",
  });

  private flush(): void {
    this.flushJob.set(false);
    const puts = [...this.puts.values()];
    const removes = [...this.removes];
    this.puts.clear();
    this.removes.clear();
    const s = settings.value;
    if (!s.showIds && !s.showNames) return;
    if (!puts.length && !removes.length) return;
    this.seq++;
    for (const watcher of this.watchers.keys())
      emitNet(EVENTS.changes, watcher, this.seq, puts, removes);
  }
}
