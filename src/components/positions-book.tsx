import { THEME } from "@/data/theme";

/**
 * Engineering opinions, stated as a book of positions.
 *
 * A trader's portfolio says what it is long and short and why. Applied to
 * technical judgment it does something a skills list cannot: it shows an
 * opinion rather than claiming seniority. Every line is specific enough to be
 * argued with, which is the test — "long: clean code" would be worthless.
 *
 * Deliberately a server component. It is text; it needs no JavaScript.
 */

const LONG: { claim: string; why: string }[] = [
  {
    claim: "Boring infrastructure",
    why: "Postgres, a queue and one well-understood cache will outlive three clever services.",
  },
  {
    claim: "Columnar stores for time series",
    why: "ClickHouse for ticks and bars, Postgres for everything else. Using one engine for both is how query times quietly become seconds.",
  },
  {
    claim: "Typed contracts at the boundary",
    why: "Validate where data enters the system. Trust inside it, never at the edge.",
  },
  {
    claim: "Backpressure over bigger buffers",
    why: "A feed you cannot keep up with is a design problem. A larger buffer only moves the failure later and makes it harder to read.",
  },
  {
    claim: "One adapter per partner",
    why: "200 carrier APIs taught me this. A branch per quirk is a codebase nobody can change; an adapter per partner is one nobody has to.",
  },
  {
    claim: "Costs in the backtest",
    why: "Strategies that only work at zero fees are not strategies. Same instinct as load-testing with realistic payloads.",
  },
];

const SHORT: { claim: string; why: string }[] = [
  {
    claim: "Microservices before product-market fit",
    why: "Distributed systems problems are a tax. Pay it when the scale is real, not when the org chart is aspirational.",
  },
  {
    claim: "ORMs in the hot path",
    why: "Fine for CRUD, a liability where latency matters. Write the query; you will have to read it at 2am anyway.",
  },
  {
    claim: "Dashboards nobody opens",
    why: "A chart that has never changed a decision is a maintenance burden with good branding.",
  },
  {
    claim: "Retry loops without a budget",
    why: "Retries that do not count, back off and give up are how one slow dependency takes down everything in front of it.",
  },
  {
    claim: "Rewrites",
    why: "The second system is slower to arrive and rarely better. Strangle it instead.",
  },
];

function Side({
  side,
  items,
  colour,
}: {
  side: string;
  items: { claim: string; why: string }[];
  colour: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: colour }}>
          {side}
        </span>
        <span className="flex-1 h-px" style={{ backgroundColor: `${colour}33` }} />
      </div>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.claim}>
            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug">
              {i.claim}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
              {i.why}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PositionsBook() {
  return (
    <section className="pt-14">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: THEME.accent }} />
        <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
          The book
        </span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1.5">
        What I&apos;m long and short
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed mb-7">
        Opinions held with real money behind them, in the sense that I have had
        to live with each of these. Arguable on purpose.
      </p>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
        <Side side="Long" items={LONG} colour={THEME.up} />
        <Side side="Short" items={SHORT} colour={THEME.down} />
      </div>
    </section>
  );
}
