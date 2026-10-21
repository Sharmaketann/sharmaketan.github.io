import { runBacktest, sma, rsi, type Candle } from "../src/lib/backtest";

let fail = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  if (!cond) fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  -> ${detail}` : ""}`);
};
const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

const mk = (closes: number[]): Candle[] =>
  closes.map((c, i) => ({ t: 1600000000 + i * 86400, o: c, h: c, l: c, c }));

console.log("── Indicators ─────────────────────────────────────────");

const s = sma([1, 2, 3, 4, 5], 3);
ok("SMA warms up with nulls", s[0] === null && s[1] === null);
ok("SMA(3) of 1..5", s[2] === 2 && s[3] === 3 && s[4] === 4, JSON.stringify(s));

// A monotonically rising series has no losses, so RSI must pin at 100.
const rUp = rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14);
ok("RSI of a pure uptrend = 100", rUp[14] === 100, String(rUp[14]));
const rDown = rsi([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 14);
ok("RSI of a pure downtrend = 0", near(rDown[14] as number, 0), String(rDown[14]));

console.log("\n── Buy & hold is the sanity check ─────────────────────");

// Doubling over the window with zero cost must give exactly +100%.
const dbl = mk(Array.from({ length: 101 }, (_, i) => 100 + i));
const bh = runBacktest({ candles: dbl, strategy: "buyhold", costBps: 0 });
ok("+100% on a doubling series", near(bh.stats.totalReturnPct, 100, 0.02), `${bh.stats.totalReturnPct}%`);
ok("equity matches benchmark exactly", JSON.stringify(bh.equity) === JSON.stringify(bh.benchmark));
ok("no drawdown on a monotonic rise", near(bh.stats.maxDrawdownPct, 0), `${bh.stats.maxDrawdownPct}%`);
ok("fully invested", near(bh.stats.exposurePct, 100), `${bh.stats.exposurePct}%`);

console.log("\n── Costs actually bite ────────────────────────────────");

const free = runBacktest({ candles: dbl, strategy: "sma", fast: 2, slow: 5, costBps: 0 });
const paid = runBacktest({ candles: dbl, strategy: "sma", fast: 2, slow: 5, costBps: 50 });
ok("charging 50bps lowers return", paid.stats.totalReturnPct < free.stats.totalReturnPct,
   `${free.stats.totalReturnPct}% -> ${paid.stats.totalReturnPct}%`);

console.log("\n── No look-ahead ──────────────────────────────────────");

// A series that rises then crashes on the final bar. A cheating backtest sees
// the crash on the signal bar and sidesteps it; an honest one eats it.
const crash = mk([...Array.from({ length: 60 }, (_, i) => 100 + i), 50]);
const bt = runBacktest({ candles: crash, strategy: "sma", fast: 5, slow: 20, costBps: 0 });
const last = bt.equity[bt.equity.length - 1];
const prev = bt.equity[bt.equity.length - 2];
ok("the final crash hits the equity curve", last < prev * 0.9, `${prev} -> ${last}`);

console.log("\n── Drawdown ───────────────────────────────────────────");

// 100 -> 200 -> 100: peak-to-trough is exactly 50%.
const vshape = mk([...Array.from({ length: 50 }, (_, i) => 100 + i * 2), ...Array.from({ length: 50 }, (_, i) => 198 - i * 2)]);
const v = runBacktest({ candles: vshape, strategy: "buyhold", costBps: 0 });
ok("max drawdown = 50% on a 2x-then-halve path", near(v.stats.maxDrawdownPct, 50, 0.6), `${v.stats.maxDrawdownPct}%`);

console.log("\n── Flat market ────────────────────────────────────────");

const flat = mk(new Array(80).fill(100));
const f = runBacktest({ candles: flat, strategy: "buyhold", costBps: 0 });
ok("0% return on a flat series", near(f.stats.totalReturnPct, 0), `${f.stats.totalReturnPct}%`);
ok("Sharpe is 0, not NaN, when variance is 0", f.stats.sharpe === 0, String(f.stats.sharpe));

console.log("\n── Open position is not counted as a win ──────────────");

const rising = mk(Array.from({ length: 80 }, (_, i) => 100 + i));
const r = runBacktest({ candles: rising, strategy: "sma", fast: 3, slow: 10, costBps: 0 });
const open = r.trades.filter((t) => t.exitTime === null);
ok("open trade has null return", open.every((t) => t.returnPct === null), `${open.length} open`);
ok("win rate counts closed trades only", r.stats.trades === r.trades.filter((t) => t.returnPct !== null).length);

console.log("\n── Degenerate input ───────────────────────────────────");
const tiny = runBacktest({ candles: mk([100]), strategy: "sma", costBps: 0 });
ok("single candle does not throw", tiny.equity.length === 1 && tiny.stats.trades === 0);

console.log(fail === 0 ? "\nall backtest cases pass" : `\n${fail} FAILING`);
process.exit(fail === 0 ? 0 : 1);
