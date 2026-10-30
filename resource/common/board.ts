import { bool, record, str } from "@aicore-fivem/lib/shared";

/** ai-scoreboard's contracts and panel content. No natives. */

export const EVENTS = {
  /** Callback: () -> Counts, the numbers the scoreboard shows right now (asked when the key is pressed). */
  board: "ai-scoreboard:board",
  /** Callback: () -> { ok } subscribes to the player list: a `roster` snapshot follows (latent), then `changes`. */
  subscribe: "ai-scoreboard:subscribe",
  /** Server -> subscriber (latent): (seq, rows: Row[]) the whole player list as of delta `seq`. */
  roster: "ai-scoreboard:client:roster",
  /** Server -> subscribers, at most once a second: (seq, puts: Row[], removes: key[]) players who joined / left. */
  changes: "ai-scoreboard:client:changes",
} as const;

/** One player row: `key` identifies the row, `id` is the shown server id (0 when ids are hidden). */
export interface Row {
  key: number;
  id: number;
  name: string;
}

export function toRow(v: unknown): Row | null {
  const r = record(v);
  return Number.isInteger(r.key) &&
    Number.isInteger(r.id) &&
    typeof r.name === "string"
    ? { key: r.key as number, id: r.id as number, name: r.name }
    : null;
}

export interface Settings {
  /** Show character names (otherwise only ids). */
  showNames: boolean;
  showIds: boolean;
  /** "hold": shown while the key is held; "toggle": one press opens, the next closes. */
  keyMode: "hold" | "toggle";
  /** Jobs whose on-duty counts show at the top. */
  jobs: Array<{ job: string; label: string }>;
}

/** The numbers asked on each open (small; the player list comes as a snapshot plus deltas). */
export interface Counts {
  online: number;
  max: number;
  jobs: Array<{ label: string; count: number }>;
}

export interface Board extends Counts {
  players: Array<{ id: number; name: string }>;
}

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const jobs = Array.isArray(s.jobs)
    ? s.jobs.flatMap((row) => {
        const r = record(row);
        const job = str(r.job, "", 32);
        return job ? [{ job, label: str(r.label, job, 32) }] : [];
      })
    : [];
  return {
    showNames: bool(s.showNames, false),
    showIds: bool(s.showIds, true),
    keyMode: s.keyMode === "toggle" ? "toggle" : "hold",
    jobs,
  };
}

/** Client -> NUI messages. */
export type NuiMessage =
  | { action: "open"; data: { texts: Record<string, string>; board: Board } }
  | { action: "close"; data: null };
