import en from "../../../locales/en.json";

/** Browser preview only (`bun run webdev`): `?names=1` shows character names next to the ids. */
const names = new URLSearchParams(window.location.search).get("names") !== null;
const NAMES = [
  "Jordan Hale",
  "Mia Torres",
  "Dex Hollow",
  "Ricky Vance",
  "Ava Stone",
  "Leo Park",
  "Nina Cruz",
  "Sam Reyes",
];
export const MOCK_OPEN = {
  texts: en,
  board: {
    online: 34,
    max: 64,
    jobs: [
      { label: "Police", count: 4 },
      { label: "EMS", count: 2 },
      { label: "Mechanics", count: 0 },
      { label: "Taxi", count: 1 },
    ],
    players: Array.from({ length: 34 }, (_, i) => ({
      id: i + 1,
      name: names ? (NAMES[i % NAMES.length] ?? "") : "",
    })),
  },
};
