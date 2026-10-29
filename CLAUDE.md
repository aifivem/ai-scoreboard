# ai-scoreboard

Hold HOME: players online / max, on-duty counts of the panel's jobs, and the player list (ids and / or names when the panel allows). Depends on ai-core (characters, duty counts). Research: `docs/research/ai-scoreboard.md`.

## Decisions

- The board is a snapshot asked on each key press (callback, rate limited); nothing is pushed or kept open, so a hold-to-view overlay costs nothing between presses.
- Names are off by default (roleplay servers hide them); ids on.
- The overlay takes no NUI focus (the key's release closes it).

## Contracts

- Callback: `resource/common/board.ts`.

## Entry points

- Server and panel schema `resource/server/index.ts`; client key `resource/client/index.ts`; NUI `web/src/App.tsx`.
