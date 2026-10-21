import { INSTRUMENTS } from "@/data/instruments";
import { ok, preflight } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/v1/instruments
 *
 * The symbols /quotes covers, with the exchange and currency each is quoted
 * in — the commodity contracts are COMEX/NYMEX in USD, not MCX in INR, and
 * that distinction matters enough to publish.
 */
export async function GET() {
  return ok(INSTRUMENTS, {
    asOf: new Date().toISOString(),
    count: INSTRUMENTS.length,
  }, { sMaxAge: 3600, swr: 86400 });
}
