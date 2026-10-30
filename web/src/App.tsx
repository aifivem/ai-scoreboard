import { useMemo, useState } from "react";
import { useNuiEvent } from "fivem-nui-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import type { Board, NuiMessage } from "../../resource/common/board";
import { VirtualList } from "./components/VirtualList";
import { MOCK_OPEN } from "./dev/mock";
import { setTexts, useLang } from "./lib/lang";
import { cn } from "./lib/utils";

type OpenData = Extract<NuiMessage, { action: "open" }>["data"];
const OPEN_MOCK = { mockData: MOCK_OPEN, mockDelay: 100 };
/** Player cells per list row. */
const COLUMNS = 6;

const toRows = (players: Board["players"]) => {
  const rows: Board["players"][] = [];
  for (let i = 0; i < players.length; i += COLUMNS) rows.push(players.slice(i, i + COLUMNS));
  return rows;
};

/** While the key is held (tgiann-esc look): title and online count, on-duty job cards, the player grid when the server allows it. */
export function App() {
  const t = useLang();
  const [data, setData] = useState<OpenData | null>(null);
  useNuiEvent<OpenData>(
    "open",
    (d) => {
      setTexts(d.texts);
      setData(d);
    },
    OPEN_MOCK,
  );
  useNuiEvent("close", () => setData(null));
  const rows = useMemo(() => toRows(data?.board.players ?? []), [data]);
  if (!data) return null;
  const { board } = data;
  return (
    <div className="pointer-events-none fixed inset-0 animate-fade">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.45)_30%,rgba(0,0,0,0.88))]" />
      <div className="relative flex h-full flex-col gap-[3vh] p-[2vh]">
        <header className="flex items-start justify-between gap-[2vh]">
          <h1 className="font-display text-[4.4vh] leading-none font-extrabold tracking-[-0.01em] uppercase">{t("UI_PLAYERS")}</h1>
          <span className="flex items-baseline gap-[0.8vh] font-display leading-none font-extrabold tabular-nums">
            <span className="text-[4.4vh] text-tgi-green">{board.online}</span>
            <span className="text-[2.4vh] text-text-3">/ {board.max}</span>
          </span>
        </header>
        {board.jobs.length > 0 && (
          <div className="grid animate-rise grid-cols-[repeat(auto-fit,minmax(24vh,1fr))] gap-[1.6vh]">
            {board.jobs.map((j) => (
              <div key={j.label} className="relative flex h-[13vh] flex-col justify-end gap-[0.4vh] rounded-[1.4vh] border border-white/10 bg-white/5 p-[1.4vh]">
                <span className="absolute top-[1.2vh] left-[1.2vh] flex size-[4vh] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[1.5vh] text-tgi-green">
                  <FontAwesomeIcon icon={faBriefcase} />
                </span>
                <span className={cn("font-display text-[3.4vh] leading-none font-extrabold tabular-nums", j.count > 0 ? "text-white" : "text-text-3")}>{j.count}</span>
                <span className="truncate text-[1.4vh] leading-[1.3] text-text-2">{j.label}</span>
              </div>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <VirtualList
            className="min-h-0 flex-1 animate-rise"
            items={rows}
            estimateSize={4.4}
            gap={0.6}
            getItemKey={(row) => `${row[0]?.id ?? 0}-${row.length}`}
            renderItem={(row) => (
              <div className="grid grid-cols-6 gap-[0.6vh]">
                {row.map((p, i) => (
                  <div key={`${p.id}-${i}`} className="flex h-[4.4vh] min-w-0 items-center gap-[1vh] rounded-[0.8vh] border border-white/8 bg-white/3 px-[1vh]">
                    {p.id > 0 && (
                      <span className="min-w-[3.4vh] shrink-0 rounded-[0.4vh] bg-tgi-green-10 px-[0.6vh] py-[0.3vh] text-center text-[1.2vh] font-bold text-tgi-green tabular-nums">{p.id}</span>
                    )}
                    <span className="truncate text-[1.4vh] leading-[1.3] text-white">{p.name || t("UI_CITIZEN")}</span>
                  </div>
                ))}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
