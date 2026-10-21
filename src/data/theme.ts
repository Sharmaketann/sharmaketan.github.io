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
