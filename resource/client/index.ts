import { Keybind, loadLocaleTexts, triggerServerCallback } from "@aicore-fivem/lib/client";
import { record } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { EVENTS, type Board, type NuiMessage } from "common/board";

const texts = loadLocaleTexts();
const send = (m: NuiMessage): void => SendNUIMessage(m);

function toBoard(v: unknown): Board | null {
  const b = record(v);
  if (typeof b.online !== "number" || typeof b.max !== "number" || !Array.isArray(b.jobs) || !Array.isArray(b.players)) return null;
  return {
    online: b.online,
    max: b.max,
    jobs: b.jobs.flatMap((j) => {
      const r = record(j);
      return typeof r.label === "string" && typeof r.count === "number" ? [{ label: r.label, count: r.count }] : [];
    }),
    players: b.players.flatMap((p) => {
      const r = record(p);
      return typeof r.id === "number" && typeof r.name === "string" ? [{ id: r.id, name: r.name }] : [];
    }),
  };
}

/** Held key: asks the server once per press and shows the board until the key is released. No focus. */
let held = false;
new Keybind({
  name: "scoreboard_open_HOME",
  description: Locale("KEYBIND_OPEN"),
  defaultKey: "HOME",
  onPressed: () => {
    held = true;
    void triggerServerCallback(EVENTS.board)
      .then((raw) => {
        const board = toBoard(raw);
        if (board && held) send({ action: "open", data: { texts, board } });
      })
      .catch(() => undefined);
  },
  onReleased: () => {
    held = false;
    send({ action: "close", data: null });
  },
});
