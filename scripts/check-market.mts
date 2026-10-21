import { getMarketStatus } from "../src/lib/market";

const cases: Array<[string, string, string]> = [
  ["2026-10-21T03:29:00Z", "CLOSED",   "IST 08:59 Wed, before pre-open"],
  ["2026-10-21T03:30:00Z", "PRE_OPEN", "IST 09:00 Wed, pre-open bell"],
  ["2026-10-21T03:44:59Z", "PRE_OPEN", "IST 09:14 Wed, last second of pre-open"],
  ["2026-10-21T03:45:00Z", "OPEN",     "IST 09:15 Wed, open"],
  ["2026-10-21T09:59:00Z", "OPEN",     "IST 15:29 Wed, last minute"],
  ["2026-10-21T10:00:00Z", "CLOSED",   "IST 15:30 Wed, close"],
  ["2026-10-24T06:00:00Z", "WEEKEND",  "IST 11:30 Sat"],
  ["2026-10-25T06:00:00Z", "WEEKEND",  "IST 11:30 Sun"],
  ["2026-10-23T11:00:00Z", "CLOSED",   "IST 16:30 Fri"],
  ["2026-10-21T18:30:00Z", "CLOSED",   "IST 00:00 Thu, midnight rollover"],
];

let fail = 0;
for (const [iso, want, desc] of cases) {
  const s = getMarketStatus(new Date(iso));
  const ok = s.state === want;
  if (!ok) fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${s.state.padEnd(9)} ${s.istTime}  ${s.nextLabel.padEnd(18)} ${desc}`);
}

// Friday evening must point at Monday, not tomorrow.
const fri = getMarketStatus(new Date("2026-10-23T11:00:00Z"));
const friOk = fri.nextLabel === "opens Monday";
if (!friOk) fail++;
console.log(`  ${friOk ? "PASS" : "FAIL"}  Friday close rolls to Monday -> "${fri.nextLabel}"`);

// MCX runs later than NSE: 16:00 IST should be open on MCX, closed on NSE.
const t = new Date("2026-10-21T10:30:00Z"); // IST 16:00 Wed
const nse = getMarketStatus(t, "NSE").state;
const mcx = getMarketStatus(t, "MCX").state;
const segOk = nse === "CLOSED" && mcx === "OPEN";
if (!segOk) fail++;
console.log(`  ${segOk ? "PASS" : "FAIL"}  IST 16:00 -> NSE ${nse}, MCX ${mcx}`);

console.log(fail === 0 ? "\nall market-clock cases pass" : `\n${fail} FAILING`);
process.exit(fail === 0 ? 0 : 1);
