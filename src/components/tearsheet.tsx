"use client";

import { useEffect, useState } from "react";
import { THEME } from "@/data/theme";
import { label, heldLabel, tearsheet } from "@/data/career";

/**
 * The headline block, shaped like a fund factsheet rather than a CV.
 *
 * It replaced "200+ APIs integrated / 13+ insurers connected", which are
 * activity metrics — the equivalent of quoting how many trades you placed.
 *
 * The drawdown row is the point. Every number here is derived from the same
 * career data the blotter uses, including the ten months with no position,
 * and showing that beside the good numbers is what makes the good numbers
 * worth reading.
 */
export function Tearsheet() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const s = tearsheet(now);

  const rows: { k: string; v: string; tone?: "up" | "down" }[] = [
    { k: "Since", v: label(s.inception) },
    { k: "Time in market", v: heldLabel(s.totalMonths) },
    {
      k: "Current position",
      v: s.open ? `${s.open.symbol} · ${heldLabel(s.openMonths)}` : "—",
      tone: "up",
    },
    { k: "Largest holding", v: `${s.longest.symbol} · ${heldLabel(s.longestMonths)}` },
    { k: "Max drawdown", v: `${s.flatMonths} mo flat`, tone: "down" },
    { k: "Sectors", v: String(s.sectors) },
  ];

  return (
    <div className="border-y border-gray-100 dark:border-zinc-800 py-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600 mb-3">
        Tearsheet
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
        {rows.map((r) => (
          <div key={r.k}>
            <dd
              className="font-mono text-[13px] tabular-nums leading-tight"
              style={{
                color:
                  r.tone === "up" ? THEME.up : r.tone === "down" ? THEME.down : undefined,
              }}
            >
              {r.v}
            </dd>
            <dt className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wide mt-0.5">
              {r.k}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
