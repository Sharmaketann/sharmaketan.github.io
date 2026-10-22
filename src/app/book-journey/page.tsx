"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { THEME } from "@/data/theme";
import {
  POSITIONS,
  FLAT,
  FLAT_MONTHS,
  EDUCATION,
  label,
  heldMonths,
  heldLabel,
  tearsheet,
  type Position,
} from "@/data/career";

/**
 * The career as a trade blotter.
 *
 * A blotter is the record of positions taken: what, when in, when out, how
 * long held, how it went. That maps onto a CV almost exactly, and it encodes
 * something a plain timeline does not — tenure as a *held position*, and the
 * eleven months between the internship and Sapio as genuinely flat rather
 * than as a silent jump in the dates.
 *
 * Every date lives once, as [year, monthIndex], and the labels and holding
 * periods are derived from it. The previous version drifted ("Sept" here,
 * "Sep" on the resume) precisely because the strings were hand-written.
 */

// ─────────────────────────────────────────────────────────────────────────────

function Row({ p, now, index }: { p: Position; now: Date | null; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const live = p.end === null;
  const months = heldMonths(p.start, p.end, now);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="border-b border-gray-100 dark:border-zinc-800/80 last:border-b-0"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left py-3 px-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        {/* Desktop: blotter columns. Mobile: stacked. */}
        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[88px_1fr_78px_78px_62px_84px] gap-x-3 gap-y-1 items-baseline">
          <span
            className="font-mono text-[11px] font-medium tracking-wide"
            style={{ color: live ? THEME.accent : undefined }}
          >
            {p.symbol}
          </span>

          <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
            {p.role}
            <span className="hidden md:inline font-normal text-gray-400 dark:text-gray-500">
              {" · "}{p.org}
            </span>
          </span>

          {/* Mobile-only meta line */}
          <span className="md:hidden col-span-2 font-mono text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
            {p.org} · {label(p.start)} → {p.end ? label(p.end) : "open"} · {heldLabel(months)}
          </span>

          <span className="hidden md:block font-mono text-[10.5px] tabular-nums text-gray-500 dark:text-gray-400">
            {label(p.start)}
          </span>
          <span className="hidden md:block font-mono text-[10.5px] tabular-nums text-gray-500 dark:text-gray-400">
            {p.end ? label(p.end) : "—"}
          </span>
          <span className="hidden md:block font-mono text-[10.5px] tabular-nums text-gray-500 dark:text-gray-400">
            {heldLabel(months)}
          </span>

          <span className="hidden md:flex items-center gap-1.5 justify-self-end">
            {live && (
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: THEME.up }}
                />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: THEME.up }} />
              </span>
            )}
            <span
              className="font-mono text-[9.5px] px-1.5 py-0.5 rounded border"
              style={
                live
                  ? { color: THEME.up, borderColor: THEME.up, backgroundColor: THEME.upWash }
                  : { color: "#8b95a3", borderColor: "transparent" }
              }
            >
              {live ? "OPEN" : "CLOSED"}
            </span>
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9.5px] text-gray-400 dark:text-gray-600">{p.sector}</span>
          {p.result && (
            <span className="font-mono text-[9.5px]" style={{ color: THEME.up }}>
              {p.result}
            </span>
          )}
          <span className="font-mono text-[9.5px] text-gray-300 dark:text-zinc-700 ml-auto">
            {open ? "collapse ▲" : "expand ▼"}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-0 md:pl-[100px] pr-2">
              <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400 max-w-prose mb-3">
                {p.note}
              </p>
              <ul className="space-y-1.5 mb-3">
                {p.marks.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="mt-[6px] h-1 w-1 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9.5px] px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BookJourney() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const sheet = tearsheet(now);
  const totalMonths = sheet.totalMonths;
  const longest = sheet.longest;
  const flatMonths = FLAT_MONTHS;

  return (
    <section>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: THEME.accent }} />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Blotter
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
          Positions held
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-5">
          The career as a trade blotter — every position taken, when it opened,
          when it closed, and how long it was held. One row is still open.
        </p>
        <a
          href="/Sharma_Ketan_Resume.pdf"
          download="Sharma_Ketan_Resume.pdf"
          className="inline-flex items-center gap-2 font-mono text-[11px] px-3.5 py-2 rounded-md border transition-colors hover:opacity-80"
          style={{ color: THEME.accent, borderColor: THEME.accent }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download the one-pager
        </a>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800">
        {[
          ["Positions", String(POSITIONS.length)],
          ["Time in market", heldLabel(totalMonths)],
          ["Longest hold", longest ? `${longest.symbol} · ${heldLabel(heldMonths(longest.start, longest.end, now))}` : "—"],
          ["Sectors", String(new Set(POSITIONS.map((p) => p.sector)).size)],
        ].map(([k, v]) => (
          <div key={k} className="bg-white dark:bg-zinc-950 px-3 py-2.5">
            <div className="font-mono text-[13px] tabular-nums text-gray-900 dark:text-gray-100 truncate">{v}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 mt-0.5">{k}</div>
          </div>
        ))}
      </div>

      {/* ── Column headers (desktop) ── */}
      <div className="hidden md:grid grid-cols-[88px_1fr_78px_78px_62px_84px] gap-x-3 pb-2 mb-1 border-b border-gray-200 dark:border-zinc-700">
        {["Symbol", "Position", "Entry", "Exit", "Held", ""].map((h, i) => (
          <span
            key={h || i}
            className={`font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 ${i === 5 ? "justify-self-end" : ""}`}
          >
            {h}
          </span>
        ))}
      </div>

      {/* ── Rows ── */}
      <div>
        {POSITIONS.map((p, i) => (
          <Row key={p.symbol} p={p} now={now} index={i} />
        ))}
      </div>

      {/* ── The flat period ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 flex items-center gap-3 px-2 py-2.5 rounded-md border border-dashed border-gray-200 dark:border-zinc-800"
      >
        <span className="font-mono text-[11px] text-gray-400 dark:text-gray-600">FLAT</span>
        <span className="font-mono text-[10.5px] tabular-nums text-gray-400 dark:text-gray-600">
          {label(FLAT.start)} → {label(FLAT.end)}
        </span>
        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600 ml-auto">
          {flatMonths} mo · no position
        </span>
      </motion.div>

      {/* ── Education ── */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-zinc-800">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 mb-3">
          Pre-listing
        </p>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{EDUCATION.qual}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{EDUCATION.org}</p>
            <p className="font-mono text-[10px] text-gray-400 dark:text-gray-600 mt-1">{EDUCATION.detail}</p>
          </div>
          <span className="font-mono text-[10.5px] tabular-nums text-gray-500 dark:text-gray-400">
            {label(EDUCATION.start)} → {label(EDUCATION.end)}
          </span>
        </div>
      </div>
    </section>
  );
}
