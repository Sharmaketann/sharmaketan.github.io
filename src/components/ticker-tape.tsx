"use client";

import { useEffect, useRef, useState } from "react";
import { THEME } from "@/data/theme";
import { INSTRUMENTS } from "@/data/instruments";

/**
 * Ticker tape across the top of the page.
 *
 * These are real delayed quotes from /api/v1/quotes, not a random walk. Which
 * means the component has to handle the things real data does and fake data
 * never did: the first paint happens before any fetch resolves, the request
 * can fail, and the payload can be stale.
 *
 * It renders symbol names immediately with no price, fills them in on arrival,
 * and labels the state honestly in the corner — "live", "stale" or "offline".
 * It does not fall back to invented numbers.
 */

interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number | null;
  changePercent: number | null;
}

type Feed = "loading" | "live" | "stale" | "offline";

const REFRESH_MS = 60_000;

function fmt(n: number, currency: string) {
  const dp = n < 10 ? 2 : n < 1000 ? 1 : 0;
  return n.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function Row({ q, prev }: { q: Quote; prev?: number }) {
  const up = (q.changePercent ?? 0) >= 0;
  const colour = up ? THEME.up : THEME.down;
  const moved = prev !== undefined && prev !== q.price;

  return (
    <span
      className="inline-flex items-baseline gap-1.5 px-4 whitespace-nowrap"
      title={`${q.name} · ${q.exchange} · ${q.currency}`}
    >
      <span className="font-mono text-[10.5px] tracking-wide text-gray-700 dark:text-gray-300">
        {q.symbol}
      </span>
      <span
        className="font-mono text-[10.5px] tabular-nums transition-colors duration-500"
        style={{ color: moved ? colour : undefined }}
      >
        {fmt(q.price, q.currency)}
      </span>
      {q.changePercent !== null && (
        <span className="font-mono text-[10px] tabular-nums" style={{ color: colour }}>
          {up ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
        </span>
      )}
    </span>
  );
}

/** Symbols only, shown until the first payload lands. */
function Skeleton() {
  return (
    <>
      {INSTRUMENTS.map((i) => (
        <span key={i.symbol} className="inline-flex items-baseline gap-1.5 px-4 whitespace-nowrap">
          <span className="font-mono text-[10.5px] tracking-wide text-gray-400 dark:text-gray-600">
            {i.symbol}
          </span>
          <span className="font-mono text-[10.5px] text-gray-300 dark:text-zinc-700">----</span>
        </span>
      ))}
    </>
  );
}

export function TickerTape() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [feed, setFeed] = useState<Feed>("loading");
  const [paused, setPaused] = useState(false);
  const prices = useRef<Record<string, number>>({});

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/v1/quotes", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        if (!alive || !Array.isArray(body.data) || body.data.length === 0) return;

        setQuotes((old) => {
          if (old) for (const q of old) prices.current[q.symbol] = q.price;
          return body.data as Quote[];
        });
        setFeed(body.meta?.stale ? "stale" : "live");
      } catch {
        if (alive) setFeed((f) => (f === "loading" ? "offline" : f));
      }
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const badge =
    feed === "live"
      ? { text: "live", colour: THEME.up }
      : feed === "stale"
        ? { text: "stale", colour: THEME.accent }
        : feed === "offline"
          ? { text: "offline", colour: THEME.down }
          : { text: "···", colour: "#8b95a3" };

  return (
    <div
      className="relative w-full overflow-hidden border-y border-gray-100 dark:border-zinc-800/80 bg-gray-50/60 dark:bg-zinc-900/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Delayed market quotes"
    >
      <div
        className="flex py-1.5 w-max motion-safe:animate-[tape_60s_linear_infinite]"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {quotes
              ? quotes.map((q) => (
                  <Row key={`${copy}-${q.symbol}`} q={q} prev={prices.current[q.symbol]} />
                ))
              : <Skeleton />}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent" />

      <a
        href="/api/v1/quotes"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] hover:opacity-70 transition-opacity"
        style={{ color: badge.colour }}
        title="Delayed quotes from my own API — click to see the raw JSON"
      >
        <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: badge.colour }} />
        {badge.text}
      </a>
    </div>
  );
}
