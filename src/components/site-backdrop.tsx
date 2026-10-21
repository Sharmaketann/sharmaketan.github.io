/**
 * The page sits on a price grid.
 *
 * At 1600px the content column uses about two thirds of the viewport and the
 * rest was flat black, so the page floated. Rather than reach for a gradient
 * — which would both fight the data already on screen and look like every
 * other dark portfolio — the texture is borrowed from the subject: every
 * chart in this domain is drawn on a grid, including the two on this site.
 *
 * Deliberately faint. It should register as "this page has a surface", not as
 * a pattern anyone notices. It fades out down the page so the arcade and
 * footer sit on clean ground, and it is masked at the edges of the viewport
 * so the lines never terminate in a hard crop.
 *
 * Purely decorative: aria-hidden, no pointer events, and it sits at z-0 with
 * the content above it at z-10.
 */
export function SiteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Price grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px)," +
            "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          backgroundPosition: "center top",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 78%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 78%)",
        }}
      />

      {/* A single warmer line, where a chart would mark the open. */}
      <div
        className="absolute inset-x-0 top-[72px] h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--grid-accent) 22%, var(--grid-accent) 78%, transparent)",
        }}
      />

      {/* Just enough lift behind the masthead that the brass sits on something. */}
      <div
        className="absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 100% at 32% 0%, var(--backdrop-lift) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
