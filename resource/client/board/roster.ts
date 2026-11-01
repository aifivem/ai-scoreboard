import { triggerServerCallback } from "@aicore-fivem/lib/client";
import { EVENTS, type Row } from "common/board";

export type Delta = { seq: number; puts: Row[]; removes: number[] };

/**
 * The player list kept on this client: asked once (first open), then the server's `put` / `remove` deltas. Deltas
 * that arrive before the (latent) snapshot wait and are applied after it when they are newer.
 */
export class Roster {
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
    for (const key of delta.removes) this.rows?.delete(key);
    for (const row of delta.puts) this.rows?.set(row.key, row);
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
