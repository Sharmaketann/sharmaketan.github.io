/**
 * Indian market session clock.
 *
 * IST is UTC+5:30 year-round with no daylight saving, so the wall clock can be
 * derived from UTC directly rather than relying on the viewer's timezone — a
 * visitor in London should still see Mumbai's session state, not their own.
 *
 * Sessions (regular trading days, Mon-Fri):
 *   NSE equity / F&O   pre-open 09:00-09:15, regular 09:15-15:30
 *   MCX commodities    09:00-23:30
 *
 * Exchange holidays are not modelled — the calendar changes every year and a
 * stale hard-coded list would be worse than none. Weekends are handled.
 */

export const IST_OFFSET_MINUTES = 330;

export type SessionState = "PRE_OPEN" | "OPEN" | "CLOSED" | "WEEKEND";

export interface MarketStatus {
  state: SessionState;
  /** Label for the segment this status describes. */
  segment: "NSE" | "MCX";
  /** IST wall-clock time, HH:MM:SS. */
  istTime: string;
  /** Minutes until the next state change, or null at the weekend. */
  minutesToChange: number | null;
  /** Human phrase for what happens next, e.g. "opens in 2h 14m". */
  nextLabel: string;
}

/** Wall-clock pieces of `date` as observed in IST. */
export function istParts(date: Date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return {
    weekday: ist.getUTCDay(), // 0 Sun .. 6 Sat
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
    seconds: ist.getUTCSeconds(),
    minuteOfDay: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

function phrase(minutes: number, verb: string): string {
  if (minutes <= 0) return `${verb} now`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${verb} in ${m}m`;
  return `${verb} in ${h}h ${m}m`;
}

const SEGMENTS = {
  NSE: { preOpen: 9 * 60, open: 9 * 60 + 15, close: 15 * 60 + 30 },
  MCX: { preOpen: 9 * 60, open: 9 * 60, close: 23 * 60 + 30 },
} as const;

export function getMarketStatus(
  now: Date = new Date(),
  segment: "NSE" | "MCX" = "NSE",
): MarketStatus {
  const { weekday, hours, minutes, seconds, minuteOfDay } = istParts(now);
  const istTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const s = SEGMENTS[segment];

  if (weekday === 0 || weekday === 6) {
    return {
      state: "WEEKEND",
      segment,
      istTime,
      minutesToChange: null,
      nextLabel: "opens Monday",
    };
  }

  if (minuteOfDay < s.preOpen) {
    return {
      state: "CLOSED",
      segment,
      istTime,
      minutesToChange: s.preOpen - minuteOfDay,
      nextLabel: phrase(s.preOpen - minuteOfDay, "pre-open"),
    };
  }

  if (minuteOfDay < s.open) {
    return {
      state: "PRE_OPEN",
      segment,
      istTime,
      minutesToChange: s.open - minuteOfDay,
      nextLabel: phrase(s.open - minuteOfDay, "opens"),
    };
  }

  if (minuteOfDay < s.close) {
    return {
      state: "OPEN",
      segment,
      istTime,
      minutesToChange: s.close - minuteOfDay,
      nextLabel: phrase(s.close - minuteOfDay, "closes"),
    };
  }

  // After the close: next session is tomorrow, or Monday if it's Friday.
  const daysAhead = weekday === 5 ? 3 : 1;
  const minsLeftToday = 24 * 60 - minuteOfDay;
  const toNext = minsLeftToday + (daysAhead - 1) * 24 * 60 + s.preOpen;
  return {
    state: "CLOSED",
    segment,
    istTime,
    minutesToChange: toNext,
    nextLabel: weekday === 5 ? "opens Monday" : phrase(toNext, "opens"),
  };
}

export const STATE_LABEL: Record<SessionState, string> = {
  PRE_OPEN: "Pre-open",
  OPEN: "Open",
  CLOSED: "Closed",
  WEEKEND: "Closed",
};
