"use client";

import { useEffect, useState } from "react";
import { THEME } from "@/data/theme";

/**
 * Total visits, rolled up like a mechanical counter.
 *
 * The digits are a pure-CSS odometer: each column is a 0-9 strip inside a
 * one-line-tall window, and the whole thing animates by translating the
 * strip. No animation library, no per-frame JS - it costs one transform per
 * digit, which is why this can sit in the footer of every route without
 * showing up in the bundle.
 *
 * It counts one visit per browser session, not per page load, so a refresh
 * does not inflate it. And if the counter is unreachable it renders nothing
 * at all rather than a placeholder number - the rest of this site goes to
 * some trouble not to show figures it cannot stand behind.
 */

const DIGITS = "0123456789".split("");

function Odometer({ value, ready }: { value: number; ready: boolean }) {
  const chars = value.toLocaleString("en-IN").split("");

  return (
    <span
      className="inline-flex items-center tabular-nums"
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-hidden
    >
      {chars.map((c, i) => {
        if (!/\d/.test(c)) {
          return (
            <span key={i} className="opacity-50 px-[0.5px]">
              {c}
            </span>
          );
        }
        const d = ready ? Number(c) : 0;
        return (
          <span
            key={i}
            className="inline-block overflow-hidden h-[1.1em] leading-[1.1em]"
          >
            <span
              className="flex flex-col transition-transform duration-[900ms]"
              style={{
                transform: `translateY(-${d * 1.1}em)`,
                // Each column lands a beat after the one to its left, so the
                // number settles left-to-right the way a real counter does.
                transitionDelay: `${i * 70}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {DIGITS.map((n) => (
                <span key={n} className="h-[1.1em] leading-[1.1em]">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function VisitCounter() {
  const [views, setViews] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const KEY = "sk:counted";

    // Claim the session's single counted visit synchronously, before any
    // await. React 18 mounts effects twice in dev, and guarding that with a
    // ref was worse than the problem: the first mount's cleanup had already
    // flipped `alive`, so its result was thrown away and the second mount
    // never ran. Claiming the flag up front means the second mount simply
    // does a read, and whichever one resolves can set state.
    let counted = true;
    try {
      counted = sessionStorage.getItem(KEY) === "1";
      if (!counted) sessionStorage.setItem(KEY, "1");
    } catch {
      // Private mode or blocked storage. Read-only is the safe default:
      // better to under-count than to count every refresh.
      counted = true;
    }

    const run = async () => {
      try {
        const res = await fetch(`/api/v1/views${counted ? "" : "?hit=1"}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        const n = body?.data?.views;
        if (!Number.isFinite(n)) throw new Error("no value");
        if (!alive) return;

        setViews(n);
        // Paint the zeros first, then roll, so there is something to watch.
        requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
      } catch {
        if (alive) setFailed(true);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400 dark:text-gray-600">
      <span
        className="h-1 w-1 rounded-full shrink-0 transition-opacity duration-500"
        style={{
          backgroundColor: THEME.accent,
          opacity: views === null ? 0.3 : 1,
        }}
      />
      <span className="uppercase tracking-[0.18em]">Visits</span>
      <span
        className="text-gray-600 dark:text-gray-300 transition-opacity duration-500"
        style={{ opacity: views === null ? 0.35 : 1 }}
      >
        {/* Zeros while loading: a counter that is briefly 0 reads as a
            counter warming up. An empty gap reads as broken. */}
        <Odometer value={views ?? 0} ready={ready} />
      </span>
      <span className="sr-only">
        {views === null ? "Loading visit count" : `${views} total visits`}
      </span>
    </div>
  );
}
