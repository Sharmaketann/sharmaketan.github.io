import { NextResponse } from "next/server";

/**
 * Shared response shape for /api/v1.
 *
 * Every payload carries a `meta` block saying where the data came from and how
 * old it is, because an API that serves cached third-party data and does not
 * say so is lying by omission.
 *
 * CORS is open: this is a public, read-only, unauthenticated API, and the
 * point of publishing it is that other people can call it.
 */

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export interface Meta {
  asOf: string;
  [k: string]: unknown;
}

export function ok<T>(
  data: T,
  meta: Meta,
  { sMaxAge = 60, swr = 300 }: { sMaxAge?: number; swr?: number } = {},
) {
  return NextResponse.json(
    { data, meta },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        // The CDN absorbs the traffic; the function only runs on a miss. This
        // is what actually keeps load off the upstream, far more than any
        // in-process rate limiting could on serverless.
        "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
      },
    },
  );
}

export function fail(
  code: string,
  message: string,
  status = 503,
  meta: Partial<Meta> = {},
) {
  return NextResponse.json(
    {
      error: code,
      message,
      meta: { asOf: new Date().toISOString(), ...meta },
    },
    {
      status,
      headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
    },
  );
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
