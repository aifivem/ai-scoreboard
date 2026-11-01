import {
  onCharacter,
  onClientCallback,
  online,
} from "@aicore-fivem/lib/server";
import { EVENTS, type Counts } from "common/board";
import { panel, settings } from "./content";
import { Roster } from "./roster";

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
