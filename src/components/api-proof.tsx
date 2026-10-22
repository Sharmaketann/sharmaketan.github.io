"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { THEME } from "@/data/theme";

/**
 * A live call to this site's own API, in the hero.
 *
 * The page says "I build the backend for systems that move money". This is
 * the line that stops that being a claim: a real request, with the real
 * status code, the real latency and the real row count, measured in the
 * visitor's browser.
 *
 * It reports failure just as plainly. A proof strip that can only show
 * success is decoration, and the one time it matters is the time it is red.
 */

interface Probe {
  status: number;
  ms: number;
  count: number | null;
  stale: boolean;
}

export function ApiProof() {
  const [probe, setProbe] = useState<Probe | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/v1/quotes", { cache: "no-store" });
        const ms = Math.round(performance.now() - t0);
        const body = await res.json().catch(() => null);
        if (!alive) return;
        setProbe({
          status: res.status,
          ms,
          count: body?.meta?.count ?? null,
          stale: Boolean(body?.meta?.stale),
        });
      } catch {
        if (alive) setProbe({ status: 0, ms: Math.round(performance.now() - t0), count: null, stale: false });
      }
    };

    run();
    const id = setInterval(run, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const good = probe !== null && probe.status >= 200 && probe.status < 300 && !probe.stale;
  const colour =
    probe === null ? "#8b95a3" : good ? THEME.up : probe.status === 0 ? THEME.down : THEME.accent;

  return (
    <Link
      href="/api-docs"
      className="group inline-flex items-center gap-2 rounded-md border border-gray-200 dark:border-zinc-800 px-2.5 py-1.5 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors max-w-full"
      title="A live call to this site's own API"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {good && (
          <span
            className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: colour }}
          />
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: colour }} />
      </span>

      <code className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate">
        GET /api/v1/quotes
      </code>

      <span className="font-mono text-[10px] tabular-nums shrink-0" style={{ color: colour }}>
        {probe === null
          ? "···"
          : probe.status === 0
            ? "failed"
            : `${probe.status} · ${probe.ms}ms${probe.count !== null ? ` · ${probe.count} rows` : ""}${probe.stale ? " · stale" : ""}`}
      </span>
    </Link>
  );
}
