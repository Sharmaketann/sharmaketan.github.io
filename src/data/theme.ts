/**
 * TRADING THEME — single source of truth for colour.
 *
 * The palette is pulled from the instruments themselves rather than from a
 * generic "fintech" board: brass for the commodities pit, a cooled graphite
 * ground, and semantic up/down taken from Indian market convention (green is
 * a gain, red is a loss — the opposite of the Western equity-red habit).
 *
 * UP and DOWN are *semantic*. They never decorate. If something on the page
 * is green it means a gain, and if it is red it means a loss. The accent
 * (brass) carries identity and does all other emphasis, so the two market
 * colours keep their meaning.
 */

export const THEME = {
  /** Identity. Evolved from the site's original terracotta toward brass/pit-gold. */
  accent: "#c08a3e",
  accentSoft: "#8a6228",
  accentWash: "rgba(192, 138, 62, 0.10)",

  /** Semantic market colours — gains and losses only. */
  up: "#1fa97a",
  upWash: "rgba(31, 169, 122, 0.12)",
  down: "#d9544d",
  downWash: "rgba(217, 84, 77, 0.12)",

  /** Grid lines on charts and ladders. */
  grid: "rgba(148, 163, 184, 0.14)",
} as const;

/** The instruments the work actually touches: index futures, equity, commodities. */
export type Segment = "INDEX" | "EQUITY" | "COMMODITY";

export interface Instrument {
  symbol: string;
  name: string;
  segment: Segment;
  /** Indicative level, only used to seed the generated tape. Not live data. */
  seed: number;
  /** Typical tick movement, to keep generated ticks plausible per instrument. */
  tick: number;
}

/**
 * The tape is generated client-side from these seeds — it is explicitly NOT a
 * live market feed, and is labelled as simulated wherever it appears. Quoting
 * real prices would mean either a paid feed or stale numbers pretending to be
 * fresh, and a portfolio has no business implying either.
 */
export const INSTRUMENTS: Instrument[] = [
  { symbol: "NIFTY",     name: "Nifty 50 Fut",      segment: "INDEX",     seed: 26120,  tick: 18 },
  { symbol: "BANKNIFTY", name: "Bank Nifty Fut",    segment: "INDEX",     seed: 58340,  tick: 42 },
  { symbol: "FINNIFTY",  name: "Fin Nifty Fut",     segment: "INDEX",     seed: 27480,  tick: 22 },
  { symbol: "RELIANCE",  name: "Reliance Inds",     segment: "EQUITY",    seed: 1486,   tick: 3.2 },
  { symbol: "HDFCBANK",  name: "HDFC Bank",         segment: "EQUITY",    seed: 1742,   tick: 3.6 },
  { symbol: "INFY",      name: "Infosys",           segment: "EQUITY",    seed: 1934,   tick: 4.1 },
  { symbol: "TATASTEEL", name: "Tata Steel",        segment: "EQUITY",    seed: 178,    tick: 0.7 },
  { symbol: "GOLD",      name: "Gold Fut",          segment: "COMMODITY", seed: 78420,  tick: 64 },
  { symbol: "SILVER",    name: "Silver Fut",        segment: "COMMODITY", seed: 94150,  tick: 128 },
  { symbol: "CRUDEOIL",  name: "Crude Oil Fut",     segment: "COMMODITY", seed: 5612,   tick: 11 },
  { symbol: "NATURALGAS",name: "Natural Gas Fut",   segment: "COMMODITY", seed: 243,    tick: 1.4 },
  { symbol: "COPPER",    name: "Copper Fut",        segment: "COMMODITY", seed: 854,    tick: 2.1 },
];
