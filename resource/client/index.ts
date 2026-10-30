import {
  AdminWorld,
  Keybind,
  loadLocaleTexts,
  triggerServerCallback,
} from "@aicore-fivem/lib/client";
import { record } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import {
  EVENTS,
  readSettings,
  type Board,
  type NuiMessage,
} from "common/board";

const world = new AdminWorld(["settings"]);
let settings = readSettings(world.get("settings"));
world.onChange("settings", () => {
  settings = readSettings(world.get("settings"));
  close();
});

const texts = loadLocaleTexts();
const send = (m: NuiMessage): void => SendNUIMessage(m);

function toBoard(v: unknown): Board | null {
  const b = record(v);
  if (
    typeof b.online !== "number" ||
    typeof b.max !== "number" ||
    !Array.isArray(b.jobs) ||
    !Array.isArray(b.players)
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
    players: b.players.flatMap((p) => {
      const r = record(p);
      return typeof r.id === "number" && typeof r.name === "string"
        ? [{ id: r.id, name: r.name }]
        : [];
    }),
  };
}

/** Whether the board is open (or asked for); a press asks the server once and shows it. No focus. */
let open = false;

function show(): void {
  open = true;
  void triggerServerCallback(EVENTS.board)
    .then((raw) => {
      const board = toBoard(raw);
      if (board && open) send({ action: "open", data: { texts, board } });
    })
    .catch(() => undefined);
}

function close(): void {
  if (!open) return;
  open = false;
  send({ action: "close", data: null });
}

// The key is set in ai-core's Keybinds tab; the panel's key mode decides hold or press to open and close.
new Keybind({
  name: "scoreboard_open",
  description: Locale("KEYBIND_OPEN"),
  defaultKey: "HOME",
  onPressed: () => {
    if (settings.keyMode === "toggle" && open) close();
    else show();
  },
  onReleased: () => {
    if (settings.keyMode === "hold") close();
  },
});
