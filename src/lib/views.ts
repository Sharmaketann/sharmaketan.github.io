/**
 * The site's visit counter.
 *
 * Counting visits needs somewhere to put the number, and this project has no
 * database. Rather than stand one up for a single integer, the count lives in
 * a free hosted counter and this module proxies it, the same way /quotes
 * proxies Yahoo: the upstream is an implementation detail and the contract
 * this site publishes does not change if it is swapped for Redis later.
 *
 * Two rules carried over from the quotes endpoint, for the same reason:
 *  - Never invent a number. If the upstream is unreachable and nothing is
 *    cached, the caller gets an error and the UI shows nothing. A made-up
 *    visitor count on a site whose whole argument is "the numbers here are
 *    real, go and check" would be a strange thing to ship.
 *  - Say how old the number is, so the page can too.
 */

const NAMESPACE = "sharmaketann-in";
const KEY = "site";
const BASE = "https://abacus.jasoncameron.dev";

/** Reads are cheap and change slowly; this keeps the lambda off the wire. */
const TTL_MS = 30_000;

let cache: { value: number; at: number } | null = null;

export interface ViewsResult {
  value: number;
  cached: boolean;
  ageSeconds: number;
}

async function call(path: string): Promise<number> {
  const res = await fetch(`${BASE}/${path}/${NAMESPACE}/${KEY}`, {
    cache: "no-store",
    // The counter is a nicety. If it is slow, it does not get to hold up
    // the response that carries it.
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`counter upstream ${res.status}`);

  const body = (await res.json()) as { value?: unknown };
  const n = typeof body.value === "number" ? body.value : Number(body.value);
  if (!Number.isFinite(n)) throw new Error("counter returned no usable value");
  return n;
}

/**
 * @param hit  true counts this visit, false just reads the total.
 *             The browser decides which, once per session.
 */
export async function getViews(hit: boolean): Promise<ViewsResult> {
  const fresh = cache && Date.now() - cache.at < TTL_MS;

  if (!hit && fresh) {
    return {
      value: cache!.value,
      cached: true,
      ageSeconds: Math.round((Date.now() - cache!.at) / 1000),
    };
  }

  try {
    const value = await call(hit ? "hit" : "get");
    cache = { value, at: Date.now() };
    return { value, cached: false, ageSeconds: 0 };
  } catch (err) {
    // Serve a stale number rather than nothing, but say that it is stale.
    if (cache) {
      return {
        value: cache.value,
        cached: true,
        ageSeconds: Math.round((Date.now() - cache.at) / 1000),
      };
    }
    throw err;
  }
}
