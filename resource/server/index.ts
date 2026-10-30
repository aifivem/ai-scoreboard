import { AdminPanel, onClientCallback, online, resourceExport } from "@aicore-fivem/lib/server";
import type { PanelSchema } from "@aicore-fivem/shared";
import { EVENTS, readSettings, type Board } from "common/board";

const core = resourceExport("ai-core");

/** ai-scoreboard's panel: what players may see about each other and which job counts show. */
const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "users",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        showNames: { type: "bool" },
        showIds: { type: "bool" },
        jobs: { type: "list", max: 12, of: { type: "object", fields: { job: { type: "text", min: 2, max: 32, pattern: "^[a-z0-9_]{2,32}$" }, label: { type: "text", min: 1, max: 32 } } } },
      },
    },
  },
  tabs: [
    {
      id: "settings",
      file: "settings",
      icon: "users",
      label: "ADMIN_TAB_SETTINGS",
      desc: "ADMIN_TAB_SETTINGS_DESC",
      cards: [
        {
          icon: "users",
          title: "ADMIN_C_PLAYERS",
          desc: "ADMIN_C_PLAYERS_DESC",
          fields: [
            { widget: "switch", path: "showIds", label: "ADMIN_F_IDS", hint: "ADMIN_H_IDS" },
            { widget: "switch", path: "showNames", label: "ADMIN_F_NAMES", hint: "ADMIN_H_NAMES" },
          ],
        },
        {
          icon: "briefcase",
          title: "ADMIN_C_JOBS",
          desc: "ADMIN_C_JOBS_DESC",
          fields: [
            {
              widget: "list",
              path: "jobs",
              label: "ADMIN_F_JOBS",
              addLabel: "ADMIN_ADD_JOB",
              max: 12,
              newRow: { job: "police", label: "Police" },
              rows: [
                { widget: "text", path: "job", label: "ADMIN_F_JOB", placeholder: "ADMIN_P_JOB" },
                { widget: "text", path: "label", label: "ADMIN_F_JOB_LABEL", placeholder: "ADMIN_P_JOB_LABEL" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const panel = new AdminPanel(schema);
/** Panel settings, parsed again after every change. */
const content = { settings: readSettings(panel.get("settings")) };
panel.onChange("settings", () => (content.settings = readSettings(panel.get("settings"))));

onClientCallback(
  EVENTS.board,
  (): Board => {
    const s = content.settings;
    const players = s.showIds || s.showNames
      ? [...online.sources()].map((id) => {
          const c = s.showNames ? online.character(id) : null;
          return { id: s.showIds ? id : 0, name: c ? `${c.firstname} ${c.lastname}` : "" };
        })
      : [];
    return { online: GetNumPlayerIndices(), max: GetConvarInt("sv_maxclients", 48), jobs: s.jobs.map((j) => ({ label: j.label, count: core.GetOnDutyCount(j.job) })), players };
  },
  { rate: { count: 2, windowMs: 2000 } },
);
