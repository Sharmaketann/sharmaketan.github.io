import { BY_SOURCE, INSTRUMENTS, type Segment } from "@/data/instruments";

/**
 * Upstream quote fetching.
 *
 * Source is Yahoo Finance's public spark endpoint — no key, one request for
 * every instrument. Two things learned the hard way and encoded here:
 *
 *  1. It returns "Edge: Too Many Requests" to anything without a browser
 *     User-Agent, so one is always sent.
 *  2. It is undocumented and can block datacenter IPs at any time, so a
 *     failure must not take the page down.
 *
 * Degradation is deliberate and visible rather than silent: a warm instance
 * serves its last good payload marked `stale`, and with nothing cached the
 * endpoint returns 503 saying so. It never invents a price — the whole point
 * of this change was to stop showing numbers that merely look real.
 */

const SPARK = "https://query1.finance.yahoo.com/v7/finance/spark";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** How long a fetched payload is considered fresh. */
export const TTL_SECONDS = 60;
/** Beyond this, a cached payload is served but flagged stale. */
const MAX_STALE_SECONDS = 60 * 30;

export interface Quote {
  symbol: string;
  source: string;
  name: string;
  segment: Segment;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
}

export interface QuotePayload {
  quotes: Quote[];
  fetchedAt: number;
}

export interface QuoteResult {
  quotes: Quote[];
  fetchedAt: number;
  ageSeconds: number;
  stale: boolean;
  cached: boolean;
}

/**
 * Module-level cache. On serverless this is per warm instance, so it is a
 * best-effort buffer, not a shared store — the CDN cache headers on the route
 * do the real work of keeping upstream traffic down.
 */
let cache: QuotePayload | null = null;
let inFlight: Promise<QuotePayload> | null = null;

function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

async function fetchUpstream(): Promise<QuotePayload> {
  const symbols = INSTRUMENTS.map((i) => i.source).join(",");
  const url = `${SPARK}?symbols=${encodeURIComponent(symbols)}&interval=1d&range=1d`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // Let the platform dedupe/cache the upstream call as well as the response.
    next: { revalidate: TTL_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`upstream ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as any;
  const results = body?.spark?.result;
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("upstream returned no results");
  }

  const quotes: Quote[] = [];
  for (const r of results) {
    const meta = r?.response?.[0]?.meta;
    const inst = BY_SOURCE.get(r?.symbol ?? meta?.symbol);
    const price = meta?.regularMarketPrice;
    if (!inst || typeof price !== "number") continue;

    const prev =
      typeof meta?.chartPreviousClose === "number" ? meta.chartPreviousClose : null;
    const change = prev === null ? null : round(price - prev);
    const changePercent =
      typeof meta?.regularMarketChangePercent === "number"
        ? round(meta.regularMarketChangePercent, 2)
        : prev
          ? round(((price - prev) / prev) * 100, 2)
          : null;

    quotes.push({
      symbol: inst.symbol,
      source: inst.source,
      name: inst.name,
      segment: inst.segment,
      exchange: inst.exchange,
      currency: inst.currency,
      price: round(price),
      previousClose: prev === null ? null : round(prev),
      change,
      changePercent,
    });
  }

  if (quotes.length === 0) throw new Error("upstream returned no usable quotes");

  // Keep the registry's order rather than the upstream's.
  const order = new Map(INSTRUMENTS.map((i, idx) => [i.symbol, idx]));
  quotes.sort((a, b) => (order.get(a.symbol) ?? 0) - (order.get(b.symbol) ?? 0));

  return { quotes, fetchedAt: Date.now() };
}

/**
 * Returns quotes, preferring fresh data, falling back to a stale cache, and
 * throwing only when there is genuinely nothing to serve.
 */
export async function getQuotes(): Promise<QuoteResult> {
  const now = Date.now();
  const age = cache ? Math.floor((now - cache.fetchedAt) / 1000) : Infinity;

  if (cache && age < TTL_SECONDS) {
    return { ...cache, ageSeconds: age, stale: false, cached: true };
  }

  // Collapse concurrent refreshes on the same instance into one upstream call.
  if (!inFlight) {
    inFlight = fetchUpstream().finally(() => {
      inFlight = null;
    });
  }

  try {
    const fresh = await inFlight;
    cache = fresh;
    return { ...fresh, ageSeconds: 0, stale: false, cached: false };
  } catch (err) {
    if (cache && age < MAX_STALE_SECONDS) {
      return { ...cache, ageSeconds: age, stale: true, cached: true };
    }
    throw err instanceof Error ? err : new Error("upstream failed");
  }
}
