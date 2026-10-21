import { generatePageMetadata } from "../seo";
import { THEME } from "@/data/theme";
import { BacktestPlayground } from "@/components/backtest-playground";

export const metadata = generatePageMetadata({
  title: "Backtest",
  description:
    "Run a moving-average or RSI strategy over real Indian index, equity and commodity history, against buy-and-hold, in the browser.",
});

export default function BacktestPage() {
  return (
    <section>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: THEME.accent }} />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Playground
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
          Backtest a strategy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
          Pick an instrument and a rule, drag the parameters, and the server runs it
          over real daily history and hands back an equity curve. Buy-and-hold is
          drawn alongside every run, because most simple rules lose to it and a
          backtester that hides the benchmark is selling something.
        </p>
      </div>

      <BacktestPlayground />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3 mt-10" style={{ color: THEME.accent }}>
        How it is calculated
      </h2>
      <ul className="space-y-2 max-w-prose mb-10">
        {[
          "Long only, one position at a time. No shorting, no leverage, no position sizing.",
          "Signals act with a one-bar delay — a rule derived from today's close is filled at tomorrow's. Entering on the same bar that produced the signal is the most common way a backtest quietly cheats.",
          "Costs are charged on entry and again on exit, and the slider goes to 50bps a side. A frictionless backtest is a fantasy; drag the cost up and watch a high-turnover rule stop working.",
          "An open position at the end is listed but excluded from the win rate. Marking it to market as a win would flatter the number.",
          "Daily bars from a free delayed provider. No survivorship adjustment, no dividends, no liquidity or slippage modelling beyond the flat cost.",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            <span className="mt-[7px] h-1 w-1 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <p className="text-[12px] leading-relaxed text-gray-400 dark:text-gray-600 max-w-prose mb-6">
        This is a toy for showing how the machinery fits together, not evidence that
        any of these rules work. Past data is the one thing a backtest is guaranteed
        to fit. It is not advice, and nobody should trade off it. The same engine is
        exposed at{" "}
        <a href="/api/v1/backtest?symbol=NIFTY&strategy=sma" target="_blank" rel="noopener noreferrer"
           className="font-mono underline hover:opacity-70" style={{ color: THEME.accent }}>
          /api/v1/backtest
        </a>.
      </p>
    </section>
  );
}
