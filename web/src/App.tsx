import { useState } from "react";
import { useNuiEvent } from "fivem-nui-react";
import type { NuiMessage } from "../../resource/common/board";
import { VirtualList } from "./components/VirtualList";
import { MOCK_OPEN } from "./dev/mock";
import { setTexts, useLang } from "./lib/lang";

type OpenData = Extract<NuiMessage, { action: "open" }>["data"];
const OPEN_MOCK = { mockData: MOCK_OPEN, mockDelay: 100 };

/** While the key is held: online count, on-duty job counts and (when the server allows) the player list. */
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
  if (!data) return null;
  const { board } = data;
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
      <section className="flex w-[44vh] animate-rise flex-col gap-[1.6vh] rounded-[1.2vh] border border-line bg-[rgba(var(--panel-rgb),0.95)] p-[2vh]">
        <header className="flex items-baseline justify-between">
          <span className="text-[1.2vh] uppercase tracking-[0.24em] text-text-3">{t("UI_PLAYERS")}</span>
          <span className="text-[2.2vh] font-semibold tabular-nums">
            {board.online}
            <span className="text-[1.4vh] text-text-3"> / {board.max}</span>
          </span>
        </header>
        {board.jobs.length > 0 && (
          <div className="grid grid-cols-2 gap-[0.8vh]">
            {board.jobs.map((j) => (
              <div key={j.label} className="flex items-center justify-between rounded-[0.8vh] border border-line bg-bg px-[1.2vh] py-[1vh]">
                <span className="text-[1.3vh] text-text-2">{j.label}</span>
                <span className={`text-[1.5vh] font-semibold tabular-nums ${j.count > 0 ? "text-accent" : "text-text-3"}`}>{j.count}</span>
              </div>
            ))}
          </div>
        )}
        {board.players.length > 0 && (
          <VirtualList
            className="max-h-[46vh]"
            items={board.players}
            estimateSize={3.4}
            gap={0.3}
            getItemKey={(p, i) => `${p.id}-${i}`}
            renderItem={(p) => (
              <div className="flex h-[3.4vh] items-center gap-[1.2vh] rounded-[0.6vh] bg-bg px-[1.2vh]">
                {p.id > 0 && <span className="w-[4vh] text-[1.25vh] tabular-nums text-text-3">{p.id}</span>}
                <span className="truncate text-[1.35vh] text-text">{p.name || t("UI_CITIZEN")}</span>
              </div>
            )}
          />
        )}
      </section>
    </div>
  );
}
