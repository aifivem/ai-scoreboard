import {
  AdminWorld,
  Keybind,
  loadLocaleTexts,
  onServerEvent,
  triggerServerCallback,
} from "@aicore-fivem/lib/client";
import { readId } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import {
  EVENTS,
  readSettings,
  toRow,
  type Counts,
  type NuiMessage,
  type Row,
} from "common/board";
import { NUI_LAYER } from "@aicore-fivem/shared";
import { toCounts } from "./parse";
import { Roster } from "./roster";

// Stacking among NUI pages (`NUI_LAYER`): set at start, not left to load order.
SetNuiZindex(NUI_LAYER.screen);

const world = new AdminWorld(["settings"]);
const settings = world.view("settings", readSettings);

const texts = loadLocaleTexts();
const send = (m: NuiMessage): void => SendNUIMessage(m);

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
  EVENTS.changes,
  {
    args: ([seq, puts, removes]): [number, Row[], number[]] | null =>
      Number.isInteger(seq) && Array.isArray(puts) && Array.isArray(removes)
        ? [
            seq as number,
            puts.flatMap((r) => toRow(r) ?? []),
            removes.flatMap((k) => readId(k) ?? []),
          ]
        : null,
  },
  (seq, puts, removes) => roster.delta({ seq, puts, removes }),
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
