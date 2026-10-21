"use client";

import { useEffect, useState } from "react";
import { getMarketStatus, STATE_LABEL, type MarketStatus } from "@/lib/market";
import { THEME } from "@/data/theme";

/**
 * Live NSE session state in IST, ticking once a second.
 *
 * Rendered only after mount: the server has no idea what second it is on the
 * client, so painting a clock during SSR guarantees a hydration mismatch.
 * The reserved-width placeholder keeps the header from reflowing when it lands.
 */
export function MarketStatusPill({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    const update = () => setStatus(getMarketStatus(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!status) {
    return (
      <div
        aria-hidden
        className="inline-flex items-center gap-2 h-[26px] w-[190px] rounded-full border border-gray-200 dark:border-zinc-800"
      />
    );
  }

  const live = status.state === "OPEN";
  const pre = status.state === "PRE_OPEN";
  const dot = live ? THEME.up : pre ? THEME.accent : "#8b95a3";

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm"
      title={`NSE ${STATE_LABEL[status.state]} — ${status.nextLabel} (IST)`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {live && (
          <span
            className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: dot }} />
      </span>

      <span className="font-mono text-[10px] tracking-wide text-gray-600 dark:text-gray-300">
        NSE {STATE_LABEL[status.state].toUpperCase()}
      </span>

      <span className="h-2.5 w-px bg-gray-200 dark:bg-zinc-700" aria-hidden />

      <span className="font-mono text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
        {status.istTime} IST
      </span>

      {!compact && (
        <>
          <span className="h-2.5 w-px bg-gray-200 dark:bg-zinc-700" aria-hidden />
          <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {status.nextLabel}
          </span>
        </>
      )}
    </div>
  );
}
