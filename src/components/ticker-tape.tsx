"use client";

import { useEffect, useRef, useState } from "react";
import { INSTRUMENTS, THEME, type Instrument } from "@/data/theme";

/**
 * Ticker tape across the top of the page.
 *
 * The prices are a seeded random walk generated in the browser, NOT a market
 * feed — and the tape says so, because a portfolio quoting numbers that look
 * live but aren't is just a lie with extra steps. The seeds give each
 * instrument a plausible level and tick size so the tape reads as real
 * *shaped* data without claiming to be real data.
 */

interface Quote {
  inst: Instrument;
  price: number;
  prevPrice: number;
  change: number;
  pct: number;
}

function seedQuotes(): Quote[] {
  // Deterministic first paint so server and client agree before ticking starts.
  return INSTRUMENTS.map((inst, i) => {
    const drift = ((i % 5) - 2) * inst.tick;
    const price = inst.seed + drift;
    return {
      inst,
      price,
      prevPrice: price,
      change: drift,
      pct: (drift / inst.seed) * 100,
    };
  });
}

function fmt(n: number, tick: number) {
  const dp = tick < 1 ? 2 : tick < 10 ? 1 : 0;
  return n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function Row({ q }: { q: Quote }) {
  const up = q.change >= 0;
  const colour = up ? THEME.up : THEME.down;
  const moved = q.price !== q.prevPrice;

  return (
    <span className="inline-flex items-baseline gap-1.5 px-4 whitespace-nowrap">
      <span className="font-mono text-[10.5px] tracking-wide text-gray-700 dark:text-gray-300">
        {q.inst.symbol}
      </span>
      <span
        className="font-mono text-[10.5px] tabular-nums transition-colors duration-300"
        style={{ color: moved ? colour : undefined }}
      >
        {fmt(q.price, q.inst.tick)}
      </span>
      <span className="font-mono text-[10px] tabular-nums" style={{ color: colour }}>
        {up ? "▲" : "▼"} {Math.abs(q.pct).toFixed(2)}%
      </span>
    </span>
  );
}

export function TickerTape() {
  const [quotes, setQuotes] = useState<Quote[]>(seedQuotes);
  const [paused, setPaused] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = setInterval(() => {
      frame.current += 1;
      setQuotes((prev) =>
        prev.map((q) => {
          // Move one instrument per frame so the tape breathes instead of
          // every number flickering at once.
          if ((frame.current + q.inst.symbol.length) % 4 !== 0) return q;
          const step = (Math.random() - 0.48) * q.inst.tick;
          const price = Math.max(q.inst.tick, q.price + step);
          const change = price - q.inst.seed;
          return { ...q, prevPrice: q.price, price, change, pct: (change / q.inst.seed) * 100 };
        }),
      );
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden border-y border-gray-100 dark:border-zinc-800/80 bg-gray-50/60 dark:bg-zinc-900/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Simulated market ticker"
    >
      <div
        className="flex py-1.5 w-max motion-safe:animate-[tape_60s_linear_infinite]"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {/* Duplicated so the marquee wraps seamlessly at -50%. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {quotes.map((q) => (
              <Row key={`${copy}-${q.inst.symbol}`} q={q} />
            ))}
          </div>
        ))}
      </div>

      {/* Edge fades so rows enter and leave instead of being chopped off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent" />

      <span
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600"
        title="Prices are generated in your browser, not a live feed"
      >
        sim
      </span>
    </div>
  );
}
