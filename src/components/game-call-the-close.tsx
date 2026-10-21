"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { THEME } from "@/data/theme";

/**
 * Call the Close — read the tape, call the next candle.
 *
 * All state is created after mount (the candles are random), so the component
 * renders a sized skeleton during SSR rather than risking a hydration
 * mismatch or a layout jump when the game appears.
 */

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

const VISIBLE = 22;
const W = 640;
const H = 220;
const PAD = 10;

function nextCandle(prev: number): Candle {
  const o = prev;
  // Fat-ish tails: most bars are small, a few are not.
  const shock = Math.random() < 0.12 ? 3.1 : 1;
  const body = (Math.random() - 0.5) * 2.4 * shock;
  const c = Math.max(4, o + body);
  const wick = Math.abs(body) * (0.4 + Math.random() * 1.1) + 0.25;
  return {
    o,
    c,
    h: Math.max(o, c) + wick * Math.random(),
    l: Math.max(0.5, Math.min(o, c) - wick * Math.random()),
  };
}

function seedSeries(n: number): Candle[] {
  const out: Candle[] = [];
  let p = 100;
  for (let i = 0; i < n; i++) {
    const k = nextCandle(p);
    out.push(k);
    p = k.c;
  }
  return out;
}

type Call = "UP" | "DOWN" | null;

export function CallTheClose() {
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [call, setCall] = useState<Call>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [calls, setCalls] = useState(0);
  const [hits, setHits] = useState(0);
  const [pnl, setPnl] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    setCandles(seedSeries(VISIBLE));
  }, []);

  const play = useCallback(
    (dir: Exclude<Call, null>) => {
      if (busy.current || !candles) return;
      busy.current = true;
      setCall(dir);

      const last = candles[candles.length - 1];
      const fresh = nextCandle(last.c);
      const wentUp = fresh.c >= fresh.o;
      const won = (dir === "UP") === wentUp;
      const move = Math.abs(fresh.c - fresh.o);

      // Let the call register visually before the candle prints.
      window.setTimeout(() => {
        setCandles((cs) => [...(cs ?? []).slice(-(VISIBLE - 1)), fresh]);
        setResult(won ? "win" : "loss");
        setCalls((n) => n + 1);
        setPnl((p) => p + (won ? move : -move));
        if (won) {
          setHits((n) => n + 1);
          setStreak((s) => {
            const ns = s + 1;
            setBest((b) => Math.max(b, ns));
            return ns;
          });
        } else {
          setStreak(0);
        }
        window.setTimeout(() => {
          setCall(null);
          setResult(null);
          busy.current = false;
        }, 700);
      }, 260);
    },
    [candles],
  );

  const reset = () => {
    setCandles(seedSeries(VISIBLE));
    setStreak(0); setBest(0); setCalls(0); setHits(0); setPnl(0);
    setCall(null); setResult(null); busy.current = false;
  };

  if (!candles) {
    return <div className="h-[220px] w-full rounded-lg bg-gray-50 dark:bg-zinc-900/40" aria-hidden />;
  }

  const lo = Math.min(...candles.map((k) => k.l));
  const hi = Math.max(...candles.map((k) => k.h));
  const span = Math.max(0.001, hi - lo);
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);
  const slot = W / VISIBLE;
  const bw = slot * 0.56;

  const accuracy = calls ? Math.round((hits / calls) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: THEME.accent }}>
            Call the Close
          </span>
          <span className="font-mono text-[9.5px] text-gray-400 dark:text-gray-500">
            next candle — up or down?
          </span>
        </div>
        <button
          onClick={reset}
          className="font-mono text-[9.5px] px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
        >
          reset
        </button>
      </div>

      <div className="relative rounded-lg border border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px] md:h-[220px]" role="img" aria-label="Candlestick chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
              stroke={THEME.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}

          {candles.map((k, i) => {
            const up = k.c >= k.o;
            const col = up ? THEME.up : THEME.down;
            const cx = i * slot + slot / 2;
            const isNew = i === candles.length - 1 && result !== null;
            const top = y(Math.max(k.o, k.c));
            const bot = y(Math.min(k.o, k.c));
            return (
              <g key={i} opacity={isNew ? 1 : 0.92} className={isNew ? "motion-safe:animate-[flashUp_600ms_ease-out]" : undefined}>
                <line x1={cx} x2={cx} y1={y(k.h)} y2={y(k.l)} stroke={col} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <rect
                  x={cx - bw / 2}
                  y={top}
                  width={bw}
                  height={Math.max(1.2, bot - top)}
                  fill={col}
                  rx="0.6"
                />
              </g>
            );
          })}

          {/* Your call, marked on the tape before the print */}
          {call && (
            <g>
              <line
                x1={candles.length * slot - slot / 2}
                x2={W}
                y1={y(candles[candles.length - 1].c)}
                y2={y(candles[candles.length - 1].c)}
                stroke={call === "UP" ? THEME.up : THEME.down}
                strokeWidth="1"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={W - 4}
                y={y(candles[candles.length - 1].c) - 5}
                textAnchor="end"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
                fill={call === "UP" ? THEME.up : THEME.down}
              >
                {call}
              </text>
            </g>
          )}
        </svg>

        {result && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-live="polite"
          >
            <span
              className="font-mono text-xs px-2.5 py-1 rounded-md border backdrop-blur-sm"
              style={{
                color: result === "win" ? THEME.up : THEME.down,
                borderColor: result === "win" ? THEME.up : THEME.down,
                backgroundColor: result === "win" ? THEME.upWash : THEME.downWash,
              }}
            >
              {result === "win" ? "filled — good call" : "stopped out"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => play("UP")}
          className="flex-1 min-w-[110px] font-mono text-[11px] py-2 rounded-md border transition-colors"
          style={{ color: THEME.up, borderColor: THEME.up, backgroundColor: THEME.upWash }}
        >
          ▲ Long
        </button>
        <button
          onClick={() => play("DOWN")}
          className="flex-1 min-w-[110px] font-mono text-[11px] py-2 rounded-md border transition-colors"
          style={{ color: THEME.down, borderColor: THEME.down, backgroundColor: THEME.downWash }}
        >
          ▼ Short
        </button>
      </div>

      <dl className="mt-2.5 grid grid-cols-4 gap-2 font-mono text-center">
        {[
          ["streak", String(streak)],
          ["best", String(best)],
          ["hit rate", calls ? `${accuracy}%` : "—"],
          ["p&l", `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}`],
        ].map(([k, v], i) => (
          <div key={k} className="rounded-md border border-gray-100 dark:border-zinc-800 py-1.5">
            <dd
              className="text-[13px] tabular-nums font-medium"
              style={i === 3 ? { color: pnl >= 0 ? THEME.up : THEME.down } : undefined}
            >
              {v}
            </dd>
            <dt className="text-[8.5px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600">{k}</dt>
          </div>
        ))}
      </dl>

      <p className="mt-2 font-mono text-[8.5px] text-gray-400 dark:text-gray-600">
        Random walk — roughly a coin flip, like most short-horizon calls. That is the joke.
      </p>
    </div>
  );
}
