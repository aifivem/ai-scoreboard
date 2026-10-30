import { bool, record, str } from "@aicore-fivem/lib/shared";

/** ai-scoreboard's contracts and panel content. No natives. */

export const EVENTS = {
  /** Callback: () -> Board, what the scoreboard shows right now (asked when the key is pressed). */
  board: "ai-scoreboard:board",
} as const;

export interface Settings {
  /** Show character names (otherwise only ids). */
  showNames: boolean;
  showIds: boolean;
  /** "hold": shown while the key is held; "toggle": one press opens, the next closes. */
  keyMode: "hold" | "toggle";
  /** Jobs whose on-duty counts show at the top. */
  jobs: Array<{ job: string; label: string }>;
}

export interface Board {
  online: number;
  max: number;
  jobs: Array<{ label: string; count: number }>;
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
