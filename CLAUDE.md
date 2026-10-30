# ai-scoreboard

HOME (hold, or press to open and close: panel "Key works by"): players online / max, on-duty counts of the panel's jobs, and the player list (ids and / or names when the panel allows). Depends on ai-core (characters, duty counts).

## Decisions

- The board is a snapshot asked on each key press (callback, rate limited); nothing is pushed or kept open, so a hold-to-view overlay costs nothing between presses.
- Names are off by default (roleplay servers hide them); ids on.
- The overlay takes no NUI focus: in hold mode the key's release closes it, in toggle mode the next press (a panel change closes an open board).
- The key is a lib `Keybind` (`scoreboard_open`), so the owner sets it in ai-core's Keybinds tab, not in this panel; the Key card says so. No code fault was found in the mapping path (the panel's key gets its own `+scoreboard_open_<KEY>` mapping at once); if a set key still does nothing in game, check the Keybinds record's key and the player's own binding in GTA Settings > Key Bindings > FiveM.

## Contracts

- Callback: `resource/common/board.ts`.

## Entry points

- Server and panel schema `resource/server/index.ts`; client key `resource/client/index.ts`; NUI `web/src/App.tsx` (tgiann-esc look; preview `bun run webdev`, `?names=1`).
