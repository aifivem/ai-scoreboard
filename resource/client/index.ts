import {
  AdminWorld,
  Keybind,
  loadLocaleTexts,
  onServerEvent,
  triggerServerCallback,
} from "@aicore-fivem/lib/client";
import { readId, record } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import {
  EVENTS,
  readSettings,
  toRow,
  type Counts,
  type NuiMessage,
  type Row,
} from "common/board";

const world = new AdminWorld(["settings"]);
const settings = world.view("settings", readSettings);

const texts = loadLocaleTexts();
const send = (m: NuiMessage): void => SendNUIMessage(m);

function toCounts(v: unknown): Counts | null {
  const b = record(v);
  if (
    typeof b.online !== "number" ||
    typeof b.max !== "number" ||
    !Array.isArray(b.jobs)
  )
    return null;
  return {
    online: b.online,
    max: b.max,
    jobs: b.jobs.flatMap((j) => {
      const r = record(j);
      return typeof r.label === "string" && typeof r.count === "number"
        ? [{ label: r.label, count: r.count }]
        : [];
    }),
  };
}

type Delta = { seq: number; row: Row } | { seq: number; key: number };

/**
 * The player list kept on this client: asked once (first open), then the server's `put` / `remove` deltas. Deltas
 * that arrive before the (latent) snapshot wait and are applied after it when they are newer.
 */
class Roster {
  private rows: Map<number, Row> | null = null;
  private waiting: Delta[] = [];
  private asked = false;

  ensure(): void {
    if (this.rows || this.asked) return;
    this.asked = true;
    triggerServerCallback(EVENTS.subscribe).catch(() => {
      this.asked = false;
    });
  }

  snapshot(seq: number, rows: Row[]): void {
    this.rows = new Map(rows.map((r) => [r.key, r]));
    for (const delta of this.waiting) if (delta.seq > seq) this.apply(delta);
    this.waiting = [];
  }

  delta(delta: Delta): void {
    if (this.rows) this.apply(delta);
    else if (this.asked) this.waiting.push(delta);
  }

  private apply(delta: Delta): void {
    if ("row" in delta) this.rows?.set(delta.row.key, delta.row);
    else this.rows?.delete(delta.key);
  }

  /** Forgets the list (a settings change ended the server's subscription). */
  drop(): void {
    this.rows = null;
    this.waiting = [];
    this.asked = false;
  }

  players(): Array<{ id: number; name: string }> {
    return this.rows
      ? [...this.rows.values()].map((r) => ({ id: r.id, name: r.name }))
      : [];
  }
}

const roster = new Roster();

onServerEvent(
  EVENTS.roster,
  {
    args: ([seq, rows]): [number, Row[]] | null =>
      Number.isInteger(seq) && Array.isArray(rows)
        ? [seq as number, rows.flatMap((r) => toRow(r) ?? [])]
        : null,
  },
  (seq, rows) => {
    roster.snapshot(seq, rows);
    if (open) refresh();
  },
);
onServerEvent(
  EVENTS.put,
  {
    args: ([seq, raw]): [number, Row] | null => {
      const row = toRow(raw);
      return Number.isInteger(seq) && row ? [seq as number, row] : null;
    },
  },
  (seq, row) => roster.delta({ seq, row }),
);
onServerEvent(
  EVENTS.remove,
  {
    args: ([seq, key]): [number, number] | null => {
      const k = readId(key);
      return Number.isInteger(seq) && k !== null ? [seq as number, k] : null;
    },
  },
  (seq, key) => roster.delta({ seq, key }),
);

/** Whether the board is open (or asked for); a press asks the counts once and shows them with the list. No focus. */
let open = false;
let counts: Counts | null = null;

function refresh(): void {
  if (counts)
    send({
      action: "open",
      data: { texts, board: { ...counts, players: roster.players() } },
    });
}

function show(): void {
  open = true;
  roster.ensure();
  void triggerServerCallback(EVENTS.board)
    .then((raw) => {
      counts = toCounts(raw);
      if (open) refresh();
    })
    .catch(() => undefined);
}

function close(): void {
  if (!open) return;
  open = false;
  send({ action: "close", data: null });
}

world.onChange("settings", () => {
  roster.drop();
  close();
});

// The key is set in ai-core's Keybinds tab; the panel's key mode decides hold or press to open and close.
new Keybind({
  name: "scoreboard_open",
  description: Locale("KEYBIND_OPEN"),
  defaultKey: "HOME",
  onPressed: () => {
    if (settings.value.keyMode === "toggle" && open) close();
    else show();
  },
  onReleased: () => {
    if (settings.value.keyMode === "hold") close();
  },
});
