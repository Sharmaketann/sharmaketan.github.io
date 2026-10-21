"use client";

import { useState } from "react";
import { FooterGame } from "./footer-game";
import { CallTheClose } from "./game-call-the-close";
import { THEME } from "@/data/theme";

type Tab = "close" | "match";

const TABS: Array<{ id: Tab; label: string; blurb: string }> = [
  { id: "close", label: "Call the Close", blurb: "read the tape, call the candle" },
  { id: "match", label: "Pit Match",      blurb: "match the pairs, fewest moves wins" },
];

export function Arcade() {
  const [tab, setTab] = useState<Tab>("close");

  return (
    <section className="w-full py-12 px-5 md:px-6 mt-10 rounded-2xl border border-gray-100 dark:border-zinc-800/70 bg-gray-50/50 dark:bg-zinc-900/30">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-6">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1.5"
            style={{ color: THEME.accent }}
          >
            After hours
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            The pit is closed. Play something.
          </h2>
        </header>

        <div
          role="tablist"
          aria-label="Games"
          className="flex items-center justify-center gap-1.5 mb-5"
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className="px-3 py-1.5 rounded-lg font-mono text-[10.5px] border transition-colors"
                style={
                  on
                    ? { color: THEME.accent, borderColor: THEME.accent, backgroundColor: THEME.accentWash }
                    : { color: "#8b95a3", borderColor: "transparent" }
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <p className="text-center font-mono text-[9.5px] text-gray-400 dark:text-gray-600 mb-4">
          {TABS.find((t) => t.id === tab)!.blurb}
        </p>

        <div id="panel-close" role="tabpanel" hidden={tab !== "close"}>
          {tab === "close" && <CallTheClose />}
        </div>
        <div id="panel-match" role="tabpanel" hidden={tab !== "match"}>
          {tab === "match" && <FooterGame embedded />}
        </div>
      </div>
    </section>
  );
}
