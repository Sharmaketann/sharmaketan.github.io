/**
 * A small, honest backtester.
 *
 * Long-only, one position at a time, no leverage and no shorting. Two things
 * it does deliberately that toy backtests usually skip, because skipping them
 * is how a strategy ends up looking better than it is:
 *
 *  1. No look-ahead. A signal derived from bar i is acted on at the close of
 *     bar i+1. Entering at the same bar that produced the signal is the most
 *     common way a backtest quietly cheats.
 *  2. Costs are charged. A round-trip cost in basis points is applied on every
 *     entry and exit, defaulting to something non-zero, because a frictionless
 *     backtest is a fantasy.
 *
 * It also always returns buy-and-hold alongside the strategy. Most simple
 * rules lose to just holding the index, and a backtester that hides the
 * benchmark is selling something.
 */

export interface Candle {
  t: number; // epoch seconds
  o: number;
  h: number;
  l: number;
  c: number;
}

export type StrategyId = "sma" | "rsi" | "buyhold";

export interface BacktestInput {
  candles: Candle[];
  strategy: StrategyId;
  /** SMA crossover */
  fast?: number;
  slow?: number;
  /** RSI mean reversion */
  period?: number;
  oversold?: number;
  exitLevel?: number;
  /** One-way cost in basis points, charged on entry and again on exit. */
  costBps?: number;
}

export interface Trade {
  entryTime: number;
  exitTime: number | null;
  entryPrice: number;
  exitPrice: number | null;
  returnPct: number | null;
  bars: number;
}

export interface Stats {
  totalReturnPct: number;
  cagrPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number | null;
  trades: number;
  exposurePct: number;
}

export interface BacktestResult {
  /** Equity curve indexed to 100 at the first bar. */
  equity: number[];
  /** Buy-and-hold over the same window, also indexed to 100. */
  benchmark: number[];
  times: number[];
  trades: Trade[];
  stats: Stats;
  benchmarkStats: Stats;
  warmupBars: number;
}

const TRADING_DAYS = 252;

// ── Indicators ───────────────────────────────────────────────────────────────

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Wilder's RSI — the smoothing is the part people get wrong. */
export function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d >= 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// ── Stats ────────────────────────────────────────────────────────────────────

function computeStats(
  equity: number[],
  times: number[],
  trades: Trade[],
  barsInMarket: number,
): Stats {
  const n = equity.length;
  const totalReturnPct = n < 2 ? 0 : (equity[n - 1] / equity[0] - 1) * 100;

  const years =
    n < 2 ? 0 : Math.max(1 / TRADING_DAYS, (times[n - 1] - times[0]) / (365.25 * 86400));
  const cagrPct = years <= 0 ? 0 : ((equity[n - 1] / equity[0]) ** (1 / years) - 1) * 100;

  let peak = equity[0] ?? 0;
  let maxDd = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    if (peak > 0) maxDd = Math.max(maxDd, (peak - v) / peak);
  }

  const rets: number[] = [];
  for (let i = 1; i < n; i++) {
    if (equity[i - 1] > 0) rets.push(equity[i] / equity[i - 1] - 1);
  }
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const variance = rets.length
    ? rets.reduce((a, r) => a + (r - mean) ** 2, 0) / rets.length
    : 0;
  const sd = Math.sqrt(variance);
  const sharpe = sd === 0 ? 0 : (mean / sd) * Math.sqrt(TRADING_DAYS);

  const closed = trades.filter((t) => t.returnPct !== null);
  const wins = closed.filter((t) => (t.returnPct as number) > 0).length;

  const r2 = (x: number) => Math.round(x * 100) / 100;
  return {
    totalReturnPct: r2(totalReturnPct),
    cagrPct: r2(cagrPct),
    maxDrawdownPct: r2(maxDd * 100),
    sharpe: r2(sharpe),
    winRatePct: closed.length ? r2((wins / closed.length) * 100) : null,
    trades: closed.length,
    exposurePct: n > 1 ? r2((barsInMarket / (n - 1)) * 100) : 0,
  };
}

// ── Engine ───────────────────────────────────────────────────────────────────

export function runBacktest(input: BacktestInput): BacktestResult {
  const { candles, strategy } = input;
  const costBps = input.costBps ?? 10;
  const cost = costBps / 10_000;

  const close = candles.map((c) => c.c);
  const times = candles.map((c) => c.t);

  // `desired[i]` is the position we want *going into* bar i+1, derived only
  // from information available at bar i.
  const desired: boolean[] = new Array(candles.length).fill(false);
  let warmupBars = 0;

  if (strategy === "buyhold") {
    desired.fill(true);
  } else if (strategy === "sma") {
    const fast = Math.max(2, input.fast ?? 20);
    const slow = Math.max(fast + 1, input.slow ?? 50);
    warmupBars = slow;
    const f = sma(close, fast);
    const s = sma(close, slow);
    for (let i = 0; i < close.length; i++) {
      const a = f[i];
      const b = s[i];
      desired[i] = a !== null && b !== null && a > b;
    }
  } else {
    const period = Math.max(2, input.period ?? 14);
    const oversold = input.oversold ?? 30;
    const exitLevel = input.exitLevel ?? 55;
    warmupBars = period + 1;
    const r = rsi(close, period);
    let holding = false;
    for (let i = 0; i < close.length; i++) {
      const v = r[i];
      if (v === null) {
        desired[i] = false;
        continue;
      }
      if (!holding && v < oversold) holding = true;
      else if (holding && v > exitLevel) holding = false;
      desired[i] = holding;
    }
  }

  const equity: number[] = [100];
  const benchmark: number[] = [100];
  const trades: Trade[] = [];

  let inMarket = false;
  let barsInMarket = 0;
  let entryPrice = 0;
  let entryTime = 0;
  let entryIdx = 0;

  for (let i = 1; i < candles.length; i++) {
    const ret = close[i] / close[i - 1] - 1;

    // `desired[i-1]` is the decision made with data through bar i-1, which
    // sets whether the position is held *for* bar i. The return therefore
    // follows the wanted state, not the previous one — reading the old state
    // here silently skipped the first bar of every position and made buy and
    // hold under-perform its own benchmark.
    const want = desired[i - 1];
    let bar = want ? ret : 0;

    if (want && !inMarket) {
      bar -= cost; // entering, filled at the prior close
      inMarket = true;
      entryPrice = close[i - 1];
      entryTime = times[i - 1];
      entryIdx = i - 1;
    } else if (!want && inMarket) {
      bar -= cost; // exiting
      inMarket = false;
      trades.push({
        entryTime,
        exitTime: times[i - 1],
        entryPrice,
        exitPrice: close[i - 1],
        returnPct: Math.round((close[i - 1] / entryPrice - 1) * 10_000) / 100,
        bars: i - 1 - entryIdx,
      });
    }

    if (want) barsInMarket++;
    equity.push(equity[i - 1] * (1 + bar));
    benchmark.push(benchmark[i - 1] * (1 + ret));
  }

  // An open position at the end is reported, but with no exit or return —
  // marking it to market as a "win" would flatter the win rate.
  if (inMarket) {
    trades.push({
      entryTime,
      exitTime: null,
      entryPrice,
      exitPrice: null,
      returnPct: null,
      bars: candles.length - 1 - entryIdx,
    });
  }

  return {
    equity: equity.map((v) => Math.round(v * 100) / 100),
    benchmark: benchmark.map((v) => Math.round(v * 100) / 100),
    times,
    trades,
    stats: computeStats(equity, times, trades, barsInMarket),
    benchmarkStats: computeStats(
      benchmark,
      times,
      [{ entryTime: times[0], exitTime: times[times.length - 1], entryPrice: close[0], exitPrice: close[close.length - 1], returnPct: (close[close.length - 1] / close[0] - 1) * 100, bars: close.length }],
      candles.length,
    ),
    warmupBars,
  };
}
