import { getMarketStatus } from "@/lib/market";
import { ok, preflight } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/v1/session
 *
 * NSE and MCX session state in IST. Computed, not fetched — this endpoint has
 * no upstream dependency and so cannot fail the way /quotes can.
 *
 * Exchange holidays are not modelled; the calendar changes yearly and a stale
 * hard-coded list would be worse than none. Weekends are handled.
 */
export async function GET() {
  const now = new Date();
  const nse = getMarketStatus(now, "NSE");
  const mcx = getMarketStatus(now, "MCX");

  return ok(
    {
      istTime: nse.istTime,
      nse: {
        state: nse.state,
        next: nse.nextLabel,
        minutesToChange: nse.minutesToChange,
        hours: { preOpen: "09:00", open: "09:15", close: "15:30" },
      },
      mcx: {
        state: mcx.state,
        next: mcx.nextLabel,
        minutesToChange: mcx.minutesToChange,
        hours: { open: "09:00", close: "23:30" },
      },
    },
    {
      asOf: now.toISOString(),
      timezone: "Asia/Kolkata (UTC+05:30, no DST)",
      note: "Exchange holidays are not modelled; weekends are.",
    },
    { sMaxAge: 20, swr: 60 },
  );
}
