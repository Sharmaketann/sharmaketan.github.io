import { getQuotes, TTL_SECONDS } from "@/lib/quotes";
import { ok, fail, preflight } from "@/lib/api";
import { BY_SYMBOL } from "@/data/instruments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/v1/quotes
 *   ?symbols=NIFTY,GOLD   optional filter, comma separated
 *
 * Delayed quotes for the tracked instruments. Never fabricates a price: if
 * upstream is unreachable and nothing is cached it returns 503.
 */
export async function GET(req: Request) {
  try {
    const result = await getQuotes();

    const requested = new URL(req.url).searchParams.get("symbols");
    let quotes = result.quotes;
    let unknown: string[] = [];

    if (requested) {
      const wanted = requested
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      unknown = wanted.filter((s) => !BY_SYMBOL.has(s));
      quotes = quotes.filter((q) => wanted.includes(q.symbol));
    }

    return ok(quotes, {
      asOf: new Date(result.fetchedAt).toISOString(),
      count: quotes.length,
      source: "Yahoo Finance (delayed)",
      cached: result.cached,
      stale: result.stale,
      ageSeconds: result.ageSeconds,
      ttlSeconds: TTL_SECONDS,
      ...(unknown.length ? { unknownSymbols: unknown } : {}),
      disclaimer:
        "Delayed third-party data for display only. Not for trading decisions.",
    });
  } catch (err) {
    return fail(
      "upstream_unavailable",
      err instanceof Error ? err.message : "Quote provider is unreachable.",
      503,
      { source: "Yahoo Finance (delayed)" },
    );
  }
}
