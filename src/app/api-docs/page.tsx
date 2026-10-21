import { generatePageMetadata } from "../seo";
import { THEME } from "@/data/theme";
import { INSTRUMENTS } from "@/data/instruments";
import { LiveEndpoint } from "@/components/live-endpoint";

export const metadata = generatePageMetadata({
  title: "API",
  description:
    "A small public API for Indian market session state and delayed quotes across NSE indices, equities and COMEX/NYMEX commodity futures.",
});

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/session",
    blurb:
      "NSE and MCX session state in IST — pre-open, open, closed — with the countdown to the next change. Computed, not fetched, so it has no upstream to fail.",
    cache: "20s",
  },
  {
    method: "GET",
    path: "/api/v1/quotes",
    blurb:
      "Delayed quotes for every tracked instrument. Filter with ?symbols=NIFTY,GOLD. Returns 503 rather than inventing a price if the provider is unreachable and nothing is cached.",
    cache: "60s",
  },
  {
    method: "GET",
    path: "/api/v1/instruments",
    blurb:
      "The symbol registry, with the exchange and currency each instrument is quoted in.",
    cache: "1h",
  },
];

export default function ApiDocs() {
  const indices = INSTRUMENTS.filter((i) => i.segment === "INDEX");
  const equities = INSTRUMENTS.filter((i) => i.segment === "EQUITY");
  const commodities = INSTRUMENTS.filter((i) => i.segment === "COMMODITY");

  return (
    <section>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: THEME.accent }} />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Public API
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
          Market API
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
          The ticker at the top of this site runs on this API. It is open, read-only,
          needs no key, and is the same thing I do at work in miniature: pull from an
          upstream, normalise it, cache it, and degrade honestly when it breaks.
        </p>
      </div>

      {/* Try it, against the deployed endpoint */}
      <LiveEndpoint />

      {/* Endpoints */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3 mt-10" style={{ color: THEME.accent }}>
        Endpoints
      </h2>
      <div className="rounded-lg border border-gray-100 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="p-4">
            <div className="flex items-baseline gap-2.5 flex-wrap mb-1.5">
              <span
                className="font-mono text-[9.5px] px-1.5 py-0.5 rounded border"
                style={{ color: THEME.up, borderColor: THEME.up }}
              >
                {e.method}
              </span>
              <a
                href={e.path}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12.5px] text-gray-900 dark:text-gray-100 hover:underline"
              >
                {e.path}
              </a>
              <span className="font-mono text-[9.5px] text-gray-400 dark:text-gray-600 ml-auto">
                cache {e.cache}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400 max-w-prose">
              {e.blurb}
            </p>
          </div>
        ))}
      </div>

      {/* curl */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3 mt-10" style={{ color: THEME.accent }}>
        From your terminal
      </h2>
      <pre className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 p-4 overflow-x-auto">
        <code className="font-mono text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-300">
          {`curl -s https://sharmaketann.in/api/v1/session | jq .

curl -s 'https://sharmaketann.in/api/v1/quotes?symbols=NIFTY,GOLD' | jq '.data'`}
        </code>
      </pre>

      {/* Coverage */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3 mt-10" style={{ color: THEME.accent }}>
        Coverage
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Indices · NSE · INR", indices],
          ["Equities · NSE · INR", equities],
          ["Commodities · COMEX/NYMEX · USD", commodities],
        ].map(([label, list]) => (
          <div key={label as string} className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 mb-2">
              {label as string}
            </p>
            <ul className="space-y-1">
              {(list as typeof INSTRUMENTS).map((i) => (
                <li key={i.symbol} className="font-mono text-[11px] text-gray-600 dark:text-gray-300">
                  {i.symbol}
                  <span className="text-gray-400 dark:text-gray-600"> · {i.source}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* The honest bit */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3 mt-10" style={{ color: THEME.accent }}>
        What this is not
      </h2>
      <ul className="space-y-2 mb-10 max-w-prose">
        {[
          "Not real time. Quotes are delayed third-party data, cached for 60 seconds at the edge, and fine for a ticker but not for a trading decision.",
          "Not MCX. The commodity contracts are COMEX and NYMEX, quoted in USD — the payload says so on every row rather than implying Indian prices.",
          "Not guaranteed. The upstream is a free, undocumented endpoint that can rate-limit or block at any time. When it does, the API serves its last good payload flagged stale, and 503s rather than making a number up.",
          "Not authenticated. Read-only and open on purpose. Load is absorbed by CDN caching rather than per-key limits.",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            <span className="mt-[7px] h-1 w-1 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
