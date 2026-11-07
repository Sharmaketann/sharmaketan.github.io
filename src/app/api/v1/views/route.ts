import { getViews } from "@/lib/views";
import { ok, fail, preflight } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/v1/views
 *   ?hit=1   count this visit as well as reading the total
 *
 * Total visits to the site. The browser sends ?hit=1 once per session and
 * plain reads after that, so a refresh does not inflate the number.
 *
 * Returns 503 rather than a guess if the counter is unreachable.
 */
export async function GET(req: Request) {
  const hit = new URL(req.url).searchParams.get("hit") === "1";

  try {
    const { value, cached, ageSeconds } = await getViews(hit);

    return ok(
      { views: value },
      {
        asOf: new Date().toISOString(),
        cached,
        ageSeconds,
        counts: "one per browser session, not per page load",
      },
      // A counted visit must never be served from a CDN cache, or it would
      // be counted once and then replayed to everyone behind that edge.
      hit ? { sMaxAge: 0, swr: 0 } : { sMaxAge: 30, swr: 300 },
    );
  } catch {
    return fail(
      "counter_unavailable",
      "The visit counter is unreachable and nothing is cached.",
      503,
    );
  }
}
