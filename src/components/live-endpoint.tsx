"use client";

import { useEffect, useState } from "react";
import { THEME } from "@/data/theme";

/**
 * A console on the docs page that calls the real endpoints.
 *
 * Documentation that shows a hand-written example response is a claim.
 * Documentation that fetches the live endpoint in front of you is evidence —
 * including when it is degraded, which is the more interesting case and the
 * reason the status line reports the HTTP code and latency rather than
 * quietly swallowing failures.
 */

const PATHS = [
  "/api/v1/session",
  "/api/v1/quotes?symbols=NIFTY,BANKNIFTY,GOLD",
  "/api/v1/instruments",
] as const;

export function LiveEndpoint() {
  const [path, setPath] = useState<string>(PATHS[0]);
  const [body, setBody] = useState<string>("");
  const [status, setStatus] = useState<{ code: number; ms: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (p: string) => {
    setLoading(true);
    setBody("");
    setStatus(null);
    const t0 = performance.now();
    try {
      const res = await fetch(p, { cache: "no-store" });
      const json = await res.json();
      setStatus({ code: res.status, ms: Math.round(performance.now() - t0) });
      setBody(JSON.stringify(json, null, 2));
    } catch (err) {
      setStatus({ code: 0, ms: Math.round(performance.now() - t0) });
      setBody(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const okish = status && status.code >= 200 && status.code < 300;

  return (
    <div className="rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/50 flex-wrap">
        {PATHS.map((p) => {
          const on = p === path;
          return (
            <button
              key={p}
              onClick={() => setPath(p)}
              className="font-mono text-[10px] px-2 py-1 rounded border transition-colors"
              style={
                on
                  ? { color: THEME.accent, borderColor: THEME.accent, backgroundColor: THEME.accentWash }
                  : { color: "#8b95a3", borderColor: "transparent" }
              }
            >
              {p.replace("/api/v1/", "").split("?")[0]}
            </button>
          );
        })}

        <span className="ml-auto font-mono text-[9.5px] tabular-nums">
          {loading ? (
            <span className="text-gray-400 dark:text-gray-600">requesting…</span>
          ) : status ? (
            <span style={{ color: okish ? THEME.up : THEME.down }}>
              {status.code === 0 ? "network error" : `${status.code} · ${status.ms}ms`}
            </span>
          ) : null}
        </span>
      </div>

      <pre className="p-3.5 overflow-x-auto max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-950">
        <code className="font-mono text-[10.5px] leading-relaxed text-gray-600 dark:text-gray-300">
          {body || " "}
        </code>
      </pre>
    </div>
  );
}
