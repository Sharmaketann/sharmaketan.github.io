import type { Candle } from "./backtest";
import { BY_SYMBOL } from "@/data/instruments";

/**
 * Daily OHLC history, from the same upstream as the quotes.
 *
 * History barely changes, so it is cached far harder than quotes — an hour in
 * process and a day at the edge. That keeps the backtest endpoint from
 * hammering a free, undocumented upstream every time someone drags a slider.
 *
 * Incomplete bars are dropped. Yahoo returns today's candle with nulls while
 * the session is still open, and feeding a null close into an indicator
 * poisons every value after it.
 */

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const RANGES = ["1y", "2y", "5y", "10y"] as const;
export type Range = (typeof RANGES)[number];

const CACHE_TTL_MS = 60 * 60 * 1000;

const cache = new Map<string, { candles: Candle[]; at: number }>();

export async function getHistory(symbol: string, range: Range): Promise<Candle[]> {
  const inst = BY_SYMBOL.get(symbol);
  if (!inst) throw new Error(`unknown symbol: ${symbol}`);

  const key = `${symbol}:${range}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.candles;

  const url = `${CHART}/${encodeURIComponent(inst.source)}?interval=1d&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);

  const body = (await res.json()) as any;
  const result = body?.chart?.result?.[0];
  const ts: number[] | undefined = result?.timestamp;
  const q = result?.indicators?.quote?.[0];
  if (!Array.isArray(ts) || !q) throw new Error("upstream returned no history");

  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    // Drop any bar that is not fully formed — today's in-progress candle, and
    // the occasional gap the provider leaves on a holiday.
    if ([o, h, l, c].some((v) => typeof v !== "number" || !isFinite(v))) continue;
    candles.push({ t: ts[i], o, h, l, c });
  }

  if (candles.length < 30) throw new Error("not enough history returned");

  cache.set(key, { candles, at: Date.now() });
  return candles;
}
