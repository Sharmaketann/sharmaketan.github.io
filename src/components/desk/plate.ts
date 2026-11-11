/**
 * The generated atmosphere plate behind /desk.
 *
 * `null` until there is art to point at, and the page is built to look
 * finished without it — the backdrop underneath is drawn in CSS and SVG from
 * the site's own palette, so an empty plate is a deliberate state rather than
 * a hole. Dropping art in is a one-line change here.
 *
 * To fill it:
 *   1. Generate a wide and a portrait crop (see scratchpad/higgsfield/PROMPT.md
 *      — generate the portrait separately; cropping a 21:9 plate to 9:16 loses
 *      the composition).
 *   2. Convert to AVIF, keep each under 200 KB, and put them in
 *      public/_static/generated/ so they stay distinguishable from real
 *      screenshots.
 *   3. Record model, prompt, seed and date in that folder's MANIFEST.json.
 *   4. Set PLATE below.
 *
 * `alt` stays empty on purpose while this is decoration: a screen reader
 * should skip it, not narrate it.
 */
export interface Plate {
  /** 21:9 or 16:9, shown from `sm` up. */
  wide: string;
  /** 9:16, shown on phones. */
  portrait: string;
  /** Empty string for pure decoration. */
  alt: string;
  /** 0–1. The type has to stay readable over it. */
  opacity: number;
}

export const PLATE: Plate | null = null;
