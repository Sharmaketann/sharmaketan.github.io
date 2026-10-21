"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { THEME } from "@/data/theme";
import { INSTRUMENTS } from "@/data/instruments";

/**
 * Backtest playground.
 *
 * Built narrow-first: controls stack into one column on a phone and sit in a
 * sidebar from `lg` up, the chart is a viewBox SVG that scales to any width,
 * and the stat grid and trade table reflow rather than scrolling the page
 * sideways.
 *
 * The benchmark line is always drawn. A strategy that loses to buy-and-hold
 * should look like it is losing to buy-and-hold.
 */

type Strategy = "sma" | "rsi" | "buyhold";

interface Stats {
  totalReturnPct: number;
  cagrPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number | null;
  trades: number;
  exposurePct: number;
}

interface Trade {
  entryTime: number;
  exitTime: number | null;
  entryPrice: number;
  exitPrice: number | null;
  returnPct: number | null;
  bars: number;
}

interface Result {
  symbol: string;
  name: string;
  currency: string;
  bars: number;
  from: string;
  to: string;
  equity: number[];
  benchmark: number[];
  times: number[];
  stats: Stats;
  benchmarkStats: Stats;
  trades: Trade[];
  tradeCount: number;
}

const STRATEGIES: { id: Strategy; label: string; blurb: string }[] = [
  { id: "sma", label: "SMA cross", blurb: "Long while the fast average is above the slow one." },
  { id: "rsi", label: "RSI dip", blurb: "Buy when RSI falls below the entry level, sell when it recovers past the exit." },
  { id: "buyhold", label: "Buy & hold", blurb: "Buy on day one, never sell. The bar everything else has to clear." },
];

const RANGES = ["1y", "2y", "5y", "10y"] as const;

const fmtDate = (t: number) =>
  new Date(t * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

function Field({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-gray-600 dark:text-gray-300">{value}</span>
      </span>
      {children}
    </label>
  );
}

const sliderClass =
  "w-full h-1 appearance-none rounded-full bg-gray-200 dark:bg-zinc-800 accent-[#c08a3e] cursor-pointer";

export function BacktestPlayground() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [strategy, setStrategy] = useState<Strategy>("sma");
  const [range, setRange] = useState<(typeof RANGES)[number]>("5y");
  const [fast, setFast] = useState(20);
  const [slow, setSlow] = useState(50);
  const [period, setPeriod] = useState(14);
  const [oversold, setOversold] = useState(30);
  const [exitLevel, setExitLevel] = useState(55);
  const [costBps, setCostBps] = useState(10);

  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const reqId = useRef(0);

  const run = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({
      symbol, strategy, range,
      fast: String(fast), slow: String(Math.max(slow, fast + 1)),
      period: String(period), oversold: String(oversold),
      exitLevel: String(exitLevel), costBps: String(costBps),
    });
    try {
      const res = await fetch(`/api/v1/backtest?${qs}`);
      const body = await res.json();
      if (id !== reqId.current) return; // a newer request already went out
      if (!res.ok) {
        setError(body.message || "Backtest failed.");
        setData(null);
      } else {
        setData(body.data);
      }
    } catch {
      if (id === reqId.current) {
        setError("Could not reach the backtest endpoint.");
        setData(null);
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [symbol, strategy, range, fast, slow, period, oversold, exitLevel, costBps]);

  // Debounced so dragging a slider fires one request, not forty.
  useEffect(() => {
    const t = setTimeout(run, 260);
    return () => clearTimeout(t);
  }, [run]);

  const W = 720;
  const H = 240;
  const PAD = 8;

  let paths = { strat: "", bench: "", lo: 0, hi: 0 };
  if (data && data.equity.length > 1) {
    const all = [...data.equity, ...data.benchmark];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = Math.max(1e-6, hi - lo);
    const x = (i: number) => (i / (data.equity.length - 1)) * W;
    const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);
    const toPath = (arr: number[]) =>
      arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    paths = { strat: toPath(data.equity), bench: toPath(data.benchmark), lo, hi };
  }

  const beatsBench =
    data && data.stats.totalReturnPct > data.benchmarkStats.totalReturnPct;

  const hoverIdx =
    data && hover !== null
      ? Math.max(0, Math.min(data.equity.length - 1, Math.round(hover * (data.equity.length - 1))))
      : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-100 dark:border-zinc-800 p-4 space-y-4">
        <Field label="Instrument" value="">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full font-mono text-[11.5px] rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-gray-700 dark:text-gray-200"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.symbol} — {i.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 block mb-1.5">
            Strategy
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map((s) => {
              const on = s.id === strategy;
              return (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className="font-mono text-[10px] px-2 py-1 rounded border transition-colors"
                  style={on
                    ? { color: THEME.accent, borderColor: THEME.accent, backgroundColor: THEME.accentWash }
                    : { color: "#8b95a3", borderColor: "transparent" }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-600 mt-2">
            {STRATEGIES.find((s) => s.id === strategy)!.blurb}
          </p>
        </div>

        {strategy === "sma" && (
          <>
            <Field label="Fast MA" value={`${fast}d`}>
              <input type="range" min={2} max={60} value={fast} className={sliderClass}
                onChange={(e) => setFast(+e.target.value)} />
            </Field>
            <Field label="Slow MA" value={`${Math.max(slow, fast + 1)}d`}>
              <input type="range" min={5} max={200} value={slow} className={sliderClass}
                onChange={(e) => setSlow(+e.target.value)} />
            </Field>
          </>
        )}

        {strategy === "rsi" && (
          <>
            <Field label="RSI period" value={`${period}d`}>
              <input type="range" min={2} max={40} value={period} className={sliderClass}
                onChange={(e) => setPeriod(+e.target.value)} />
            </Field>
            <Field label="Buy below" value={String(oversold)}>
              <input type="range" min={5} max={50} value={oversold} className={sliderClass}
                onChange={(e) => setOversold(+e.target.value)} />
            </Field>
            <Field label="Sell above" value={String(exitLevel)}>
              <input type="range" min={50} max={95} value={exitLevel} className={sliderClass}
                onChange={(e) => setExitLevel(+e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Cost per side" value={`${costBps} bps`}>
          <input type="range" min={0} max={50} value={costBps} className={sliderClass}
            onChange={(e) => setCostBps(+e.target.value)} />
        </Field>

        <div>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 block mb-1.5">
            Window
          </span>
          <div className="flex gap-1.5">
            {RANGES.map((r) => {
              const on = r === range;
              return (
                <button key={r} onClick={() => setRange(r)}
                  className="flex-1 font-mono text-[10px] py-1 rounded border transition-colors"
                  style={on
                    ? { color: THEME.accent, borderColor: THEME.accent, backgroundColor: THEME.accentWash }
                    : { color: "#8b95a3", borderColor: "transparent" }}>
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Output ───────────────────────────────────────────── */}
      <div className="min-w-0">
        {error ? (
          <div className="rounded-lg border p-4" style={{ borderColor: THEME.down }}>
            <p className="font-mono text-[11px] mb-1" style={{ color: THEME.down }}>backtest unavailable</p>
            <p className="text-[12.5px] text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : !data ? (
          <div className="h-[240px] rounded-lg bg-gray-50 dark:bg-zinc-900/40 animate-pulse" aria-label="Loading" />
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
              <span className="font-mono text-[10.5px] text-gray-600 dark:text-gray-300">
                {data.symbol} <span className="text-gray-400 dark:text-gray-600">· {data.from} → {data.to} · {data.bars} bars</span>
              </span>
              <span className="font-mono text-[10px] tabular-nums" style={{ opacity: loading ? 0.4 : 1 }}>
                <span style={{ color: THEME.accent }}>strategy</span>
                <span className="text-gray-300 dark:text-zinc-700"> / </span>
                <span className="text-gray-400 dark:text-gray-500">buy &amp; hold</span>
              </span>
            </div>

            <div
              className="relative rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden"
              style={{ opacity: loading ? 0.55 : 1, transition: "opacity .2s" }}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[180px] sm:h-[240px] touch-none"
                preserveAspectRatio="none"
                role="img"
                aria-label="Equity curve against buy and hold"
                onMouseLeave={() => setHover(null)}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setHover((e.clientX - r.left) / r.width);
                }}
              >
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1="0" x2={W} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
                    stroke={THEME.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={paths.bench} fill="none" stroke="#8b95a3" strokeWidth="1.25"
                  strokeDasharray="4 3" vectorEffect="non-scaling-stroke" opacity="0.8" />
                <path d={paths.strat} fill="none" stroke={THEME.accent} strokeWidth="2"
                  strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {hoverIdx !== null && (
                  <line x1={(hoverIdx / (data.equity.length - 1)) * W} x2={(hoverIdx / (data.equity.length - 1)) * W}
                    y1={PAD} y2={H - PAD} stroke={THEME.accent} strokeWidth="1"
                    strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                )}
              </svg>

              {hoverIdx !== null && (
                <div className="absolute top-1.5 left-2 font-mono text-[9.5px] tabular-nums text-gray-500 dark:text-gray-400 pointer-events-none">
                  {fmtDate(data.times[hoverIdx])} · {data.equity[hoverIdx].toFixed(1)}
                  <span className="text-gray-300 dark:text-zinc-700"> / </span>
                  {data.benchmark[hoverIdx].toFixed(1)}
                </div>
              )}
            </div>

            {/* Verdict — the point of showing the benchmark at all */}
            <p className="mt-2.5 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
              Over this window the strategy returned{" "}
              <strong style={{ color: data.stats.totalReturnPct >= 0 ? THEME.up : THEME.down }}>
                {data.stats.totalReturnPct > 0 ? "+" : ""}{data.stats.totalReturnPct}%
              </strong>{" "}
              against{" "}
              <strong className="text-gray-600 dark:text-gray-300">
                {data.benchmarkStats.totalReturnPct > 0 ? "+" : ""}{data.benchmarkStats.totalReturnPct}%
              </strong>{" "}
              for buy &amp; hold —{" "}
              <strong style={{ color: beatsBench ? THEME.up : THEME.down }}>
                {beatsBench ? "ahead" : "behind"}
              </strong>
              {data.stats.trades > 0 && <> across {data.stats.trades} round trips</>}.
            </p>

            {/* Stats */}
            <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {([
                ["return", `${data.stats.totalReturnPct}%`, data.stats.totalReturnPct >= 0],
                ["cagr", `${data.stats.cagrPct}%`, data.stats.cagrPct >= 0],
                ["max dd", `-${data.stats.maxDrawdownPct}%`, false],
                ["sharpe", String(data.stats.sharpe), data.stats.sharpe >= 1],
                ["win rate", data.stats.winRatePct === null ? "—" : `${data.stats.winRatePct}%`, null],
                ["in market", `${data.stats.exposurePct}%`, null],
              ] as [string, string, boolean | null][]).map(([k, v, good]) => (
                <div key={k} className="rounded-md border border-gray-100 dark:border-zinc-800 px-2 py-1.5">
                  <dd className="font-mono text-[13px] tabular-nums"
                    style={{ color: good === null ? undefined : good ? THEME.up : THEME.down }}>
                    {v}
                  </dd>
                  <dt className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-gray-400 dark:text-gray-600 mt-0.5">
                    {k}
                  </dt>
                </div>
              ))}
            </dl>

            {/* Trades */}
            {data.trades.length > 0 && (
              <div className="mt-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 mb-2">
                  Last {data.trades.length} of {data.tradeCount} trades
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-800">
                  <table className="w-full min-w-[380px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-zinc-800">
                        {["Entry", "Exit", "Bars", "Return"].map((h, i) => (
                          <th key={h} className={`font-mono text-[8.5px] uppercase tracking-[0.08em] text-gray-400 dark:text-gray-600 font-normal px-2.5 py-1.5 ${i === 3 ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.trades.map((t, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                          <td className="font-mono text-[10.5px] tabular-nums px-2.5 py-1.5 text-gray-600 dark:text-gray-300">{fmtDate(t.entryTime)}</td>
                          <td className="font-mono text-[10.5px] tabular-nums px-2.5 py-1.5 text-gray-500 dark:text-gray-400">
                            {t.exitTime ? fmtDate(t.exitTime) : <span style={{ color: THEME.up }}>open</span>}
                          </td>
                          <td className="font-mono text-[10.5px] tabular-nums px-2.5 py-1.5 text-gray-400 dark:text-gray-600">{t.bars}</td>
                          <td className="font-mono text-[10.5px] tabular-nums px-2.5 py-1.5 text-right"
                            style={{ color: t.returnPct === null ? undefined : t.returnPct >= 0 ? THEME.up : THEME.down }}>
                            {t.returnPct === null ? "—" : `${t.returnPct > 0 ? "+" : ""}${t.returnPct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
