/**
 * The instruments the public API tracks.
 *
 * `source` is the upstream ticker; `symbol` is what this API exposes. They are
 * deliberately separate so the upstream can be swapped without changing the
 * contract consumers depend on.
 *
 * Note the commodity rows: these are COMEX/NYMEX contracts quoted in USD, not
 * MCX contracts in INR. A site about Indian markets showing "GOLD" without
 * saying which gold would be quietly wrong, so exchange and currency are part
 * of the payload and are rendered wherever the price is.
 */

export type Segment = "INDEX" | "EQUITY" | "COMMODITY";

export interface Instrument {
  /** Symbol this API exposes. */
  symbol: string;
  /** Upstream ticker. Implementation detail, still published for transparency. */
  source: string;
  name: string;
  segment: Segment;
  exchange: "NSE" | "COMEX" | "NYMEX";
  currency: "INR" | "USD";
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: "NIFTY",      source: "^NSEI",        name: "Nifty 50",            segment: "INDEX",     exchange: "NSE",   currency: "INR" },
  { symbol: "BANKNIFTY",  source: "^NSEBANK",     name: "Nifty Bank",          segment: "INDEX",     exchange: "NSE",   currency: "INR" },
  { symbol: "RELIANCE",   source: "RELIANCE.NS",  name: "Reliance Industries", segment: "EQUITY",    exchange: "NSE",   currency: "INR" },
  { symbol: "HDFCBANK",   source: "HDFCBANK.NS",  name: "HDFC Bank",           segment: "EQUITY",    exchange: "NSE",   currency: "INR" },
  { symbol: "INFY",       source: "INFY.NS",      name: "Infosys",             segment: "EQUITY",    exchange: "NSE",   currency: "INR" },
  { symbol: "TCS",        source: "TCS.NS",       name: "Tata Consultancy",    segment: "EQUITY",    exchange: "NSE",   currency: "INR" },
  { symbol: "TATASTEEL",  source: "TATASTEEL.NS", name: "Tata Steel",          segment: "EQUITY",    exchange: "NSE",   currency: "INR" },
  { symbol: "GOLD",       source: "GC=F",         name: "Gold Futures",        segment: "COMMODITY", exchange: "COMEX", currency: "USD" },
  { symbol: "SILVER",     source: "SI=F",         name: "Silver Futures",      segment: "COMMODITY", exchange: "COMEX", currency: "USD" },
  { symbol: "COPPER",     source: "HG=F",         name: "Copper Futures",      segment: "COMMODITY", exchange: "COMEX", currency: "USD" },
  { symbol: "CRUDEOIL",   source: "CL=F",         name: "Crude Oil Futures",   segment: "COMMODITY", exchange: "NYMEX", currency: "USD" },
  { symbol: "NATURALGAS", source: "NG=F",         name: "Natural Gas Futures", segment: "COMMODITY", exchange: "NYMEX", currency: "USD" },
];

export const BY_SOURCE = new Map(INSTRUMENTS.map((i) => [i.source, i]));
export const BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));
