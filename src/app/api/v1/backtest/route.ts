import { getHistory, RANGES, type Range } from "@/lib/history";
import { runBacktest, type StrategyId } from "@/lib/backtest";
import { ok, fail, preflight } from "@/lib/api";
import { BY_SYMBOL, INSTRUMENTS } from "@/data/instruments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const STRATEGIES: StrategyId[] = ["sma", "rsi", "buyhold"];

/** Params are clamped rather than rejected — a slider should never 500. */
function clampInt(raw: string | null, min: number, max: number, dflt: number) {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

/**
 * GET /api/v1/backtest
 *   ?symbol=NIFTY &strategy=sma &range=5y &fast=20 &slow=50 &costBps=10
 *   RSI:  &period=14 &oversold=30 &exitLevel=55
 *
 * Long-only, one position at a time, signals acted on with a one-bar delay,
 * costs charged on entry and exit. Always returns buy-and-hold alongside, so
 * a strategy that loses to simply holding is visibly losing to it.
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;

  const symbol = (p.get("symbol") ?? "NIFTY").toUpperCase();
  if (!BY_SYMBOL.has(symbol)) {
    return fail(
      "unknown_symbol",
      `Unknown symbol "${symbol}". See /api/v1/instruments.`,
      400,
      { known: INSTRUMENTS.map((i) => i.symbol) },
    );
  }

  const strategy = (p.get("strategy") ?? "sma") as StrategyId;
  if (!STRATEGIES.includes(strategy)) {
    return fail("unknown_strategy", `Unknown strategy "${strategy}".`, 400, {
      known: STRATEGIES,
    });
  }

  const range = (RANGES as readonly string[]).includes(p.get("range") ?? "")
    ? (p.get("range") as Range)
    : "5y";

  const fast = clampInt(p.get("fast"), 2, 100, 20);
  const slow = clampInt(p.get("slow"), 3, 300, 50);
  const period = clampInt(p.get("period"), 2, 50, 14);
  const oversold = clampInt(p.get("oversold"), 5, 50, 30);
  const exitLevel = clampInt(p.get("exitLevel"), 50, 95, 55);
  const costBps = clampInt(p.get("costBps"), 0, 200, 10);

  try {
    const candles = await getHistory(symbol, range);
    const result = runBacktest({
      candles,
      strategy,
      fast,
      slow: Math.max(slow, fast + 1),
      period,
      oversold,
      exitLevel,
      costBps,
    });

    const inst = BY_SYMBOL.get(symbol)!;
    return ok(
      {
        symbol,
        name: inst.name,
        exchange: inst.exchange,
        currency: inst.currency,
        params: { strategy, range, fast, slow, period, oversold, exitLevel, costBps },
        bars: candles.length,
        from: new Date(candles[0].t * 1000).toISOString().slice(0, 10),
        to: new Date(candles[candles.length - 1].t * 1000).toISOString().slice(0, 10),
        equity: result.equity,
        benchmark: result.benchmark,
        times: result.times,
        stats: result.stats,
        benchmarkStats: result.benchmarkStats,
        // Most recent first, and capped — the full list can run to hundreds.
        trades: result.trades.slice(-40).reverse(),
        tradeCount: result.trades.length,
      },
      {
        asOf: new Date().toISOString(),
        source: "Yahoo Finance (delayed, daily bars)",
        model:
          "Long only, one position at a time. Signals act with a one-bar delay; costs charged on entry and exit.",
        disclaimer:
          "A toy on past data with no survivorship or liquidity modelling. Not advice, and not evidence a strategy works.",
      },
      { sMaxAge: 3600, swr: 86400 },
    );
  } catch (err) {
    return fail(
      "upstream_unavailable",
      err instanceof Error ? err.message : "Could not load price history.",
      503,
    );
  }
}
