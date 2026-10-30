import type { PanelSchema } from "@aicore-fivem/shared";

/** ai-scoreboard's panel: how the key opens the board, what players may see about each other and which job counts show. */
export const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "users",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        showNames: { type: "bool" },
        showIds: { type: "bool" },
        keyMode: { type: "enum", values: ["hold", "toggle"] },
        jobs: {
          type: "list",
          max: 12,
          of: {
            type: "object",
            fields: {
              job: {
                type: "text",
                min: 2,
                max: 32,
                pattern: "^[a-z0-9_]{2,32}$",
              },
              label: { type: "text", min: 1, max: 32 },
            },
          },
        },
      },
      defaults: { keyMode: "hold" },
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
          icon: "keyboard",
          title: "ADMIN_C_KEY",
          desc: "ADMIN_C_KEY_DESC",
          fields: [
            {
              widget: "select",
              path: "keyMode",
              label: "ADMIN_F_KEY_MODE",
              hint: "ADMIN_H_KEY_MODE",
              options: [
                { value: "hold", label: "ADMIN_O_HOLD" },
                { value: "toggle", label: "ADMIN_O_TOGGLE" },
              ],
            },
          ],
        },
        {
          icon: "users",
          title: "ADMIN_C_PLAYERS",
          desc: "ADMIN_C_PLAYERS_DESC",
          fields: [
            {
              widget: "switch",
              path: "showIds",
              label: "ADMIN_F_IDS",
              hint: "ADMIN_H_IDS",
            },
            {
              widget: "switch",
              path: "showNames",
              label: "ADMIN_F_NAMES",
              hint: "ADMIN_H_NAMES",
            },
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
                {
                  widget: "text",
                  path: "job",
                  label: "ADMIN_F_JOB",
                  placeholder: "ADMIN_P_JOB",
                },
                {
                  widget: "text",
                  path: "label",
                  label: "ADMIN_F_JOB_LABEL",
                  placeholder: "ADMIN_P_JOB_LABEL",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
