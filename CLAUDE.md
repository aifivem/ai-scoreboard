# ai-scoreboard

HOME (hold, or press to open and close: panel "Key works by"): players online / max, on-duty counts of the panel's jobs, and the player list (ids and / or names when the panel allows). Depends on ai-core (characters, duty counts).

## Decisions

- The counts (online / max, on-duty per job from lib `online.onDutyFor`) are a small callback on each key press (rate limited). The player list is snapshot + delta: the first open subscribes, the server sends the whole list once as a latent event, then `put` / `remove` per character load / unload (`onCharacter`); each delta carries a `seq` so deltas that overtake the latent snapshot are applied only when newer. The client keeps the list for the session and builds the NUI's rows from it on each open, so a hold-to-view overlay sends nothing big between presses.
- Rows have their own `key` (a counter), so hidden ids never decide what a removal deletes. A settings change (ids / names shown) ends every subscription on the server and drops the list on every client; the next open subscribes again.
- Names are off by default (roleplay servers hide them); ids on.
- The overlay takes no NUI focus: in hold mode the key's release closes it, in toggle mode the next press (a panel change closes an open board).
- The key is a lib `Keybind` (`scoreboard_open`), so the owner sets it in ai-core's Keybinds tab, not in this panel; the Key card says so. No code fault was found in the mapping path (the panel's key gets its own `+scoreboard_open_<KEY>` mapping at once); if a set key still does nothing in game, check the Keybinds record's key and the player's own binding in GTA Settings > Key Bindings > FiveM.

## Contracts

- Callbacks and events: `resource/common/board.ts`; panel schema `resource/server/schema.ts`.

## Entry points

- Server (counts, roster) `resource/server/index.ts`; client key `resource/client/index.ts`; NUI `web/src/App.tsx` (tgiann-esc look; preview `bun run webdev`, `?names=1`).
