"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { label, heldLabel, tearsheet } from "@/data/career";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { PLATE } from "./plate";

/**
 * /desk — the homepage hero with the furniture taken away.
 *
 * Same name, same numbers, same curve as the terminal, given a full screen
 * and nothing else on it. It is an expansion of the homepage rather than an
 * alternative to it, which is the distinction that matters: there is one
 * route in and one route back, and nothing here is a second source of truth.
 * Every figure is derived from POSITIONS, exactly as the tearsheet is.
 *
 * The backdrop is drawn, not loaded. A generated plate can sit behind it
 * later (see ./plate.ts) but the page is finished without one — ink ground,
 * two slow brass glows, a faint price grid, and the equity curve from the
 * social card drawn large. That ordering is deliberate: a page that only
 * looks right once an asset arrives is a page that is broken until then.
 */

/** The same curve as the OG card and the homepage close. One shape, three places. */
const CURVE =
  "M0,96 L40,92 L80,97 L120,86 L160,80 L200,84 L240,70 L280,62 L320,66 " +
  "L360,52 L400,44 L440,48 L480,34 L520,26 L560,30 L600,14";

const INK = "#0b0e12";
const BRASS = "#c08a3e";

export function DeskHero() {
  // Read the clock after mount. Anything date-dependent rendered on the
  // server disagrees with the client and fails hydration — which on this site
  // has already cost one feature its animation loop.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const s = tearsheet(now);

  const figures: { k: string; v: string; tone?: "up" }[] = [
    { k: "Since", v: label(s.inception) },
    { k: "Time in market", v: heldLabel(s.totalMonths) },
    {
      k: "Current position",
      v: s.open ? `${s.open.symbol} · ${heldLabel(s.openMonths)}` : "—",
      tone: "up",
    },
    { k: "Sectors", v: String(s.sectors) },
  ];

  return (
    <section
      className="desk-root relative flex w-full flex-col justify-center overflow-hidden"
      style={{ background: INK }}
    >
      <style>{CSS}</style>

      {/* Layer 0 — the generated plate, when there is one. */}
      {PLATE && (
        <picture>
          <source media="(max-width: 639px)" srcSet={PLATE.portrait} />
          <source media="(min-width: 640px)" srcSet={PLATE.wide} />
          <img
            src={PLATE.wide}
            alt={PLATE.alt}
            aria-hidden={PLATE.alt === "" ? true : undefined}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: PLATE.opacity }}
          />
        </picture>
      )}

      {/* Layer 1 — brass haze. Two glows on different axes so the light has
          a direction instead of sitting in the middle like a spotlight. */}
      <div className="desk-haze" aria-hidden="true" />
      {/* Layer 2 — the price grid, almost subliminal. */}
      <div className="desk-grid" aria-hidden="true" />
      {/* Layer 3 — the curve. */}
      <svg
        className="desk-curve"
        viewBox="0 0 600 110"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={CURVE} stroke={BRASS} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Layer 4 — vignette, to stop the type floating. */}
      <div className="desk-vignette" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 sm:px-10">
        <p className="desk-in desk-d1 mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#79828f]">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: BRASS }}
          />
          The desk
        </p>

        <h1 className="desk-in desk-d2 text-[clamp(2.6rem,9vw,6.5rem)] font-bold leading-[0.93] tracking-[-0.03em] text-[#f2efe9]">
          Sharma{" "}
          <span style={{ color: BRASS }}>Ketan</span>
        </h1>

        <p className="desk-in desk-d3 mt-6 max-w-[34ch] text-[clamp(1.05rem,2.6vw,1.6rem)] leading-[1.35] text-[#c9cdd4]">
          I build the backend for systems that move money.
        </p>

        <dl className="desk-in desk-d4 mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {figures.map((f) => (
            <div key={f.k}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7480]">
                {f.k}
              </dt>
              <dd
                className="mt-1.5 font-mono text-[15px] sm:text-[17px]"
                style={{ color: f.tone === "up" ? "#1fa97a" : "#e7e4de" }}
              >
                {f.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="desk-in desk-d5 mt-14 flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-[12px] text-[#9aa2ad] transition-colors hover:text-[#c08a3e]"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Back to the terminal
          </Link>
          <a
            href={PORTFOLIO_CONFIG.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12px] text-[#6b7480] transition-colors hover:text-[#c08a3e]"
          >
            GitHub ↗
          </a>
          <Link
            href="/book-journey"
            className="font-mono text-[12px] text-[#6b7480] transition-colors hover:text-[#c08a3e]"
          >
            The blotter ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

const CSS = `
/*
  Fill the viewport BELOW the terminal chrome, not the whole viewport.

  min-h-screen looked right in isolation and was wrong on the page: the
  ticker and header sit above this section, so a full 100vh pushed the
  bottom — and with it the end of the equity curve — past the fold. 150px
  is the measured height of ticker + header + its margin.

  svh rather than vh so a mobile browser collapsing its address bar does not
  resize the section mid-scroll. The padding on the content gives the floor,
  so there is no fixed minimum to fight with in landscape.
*/
.desk-root {
  color-scheme: dark;
  min-height: calc(100svh - 150px);
}
@supports not (height: 100svh) {
  .desk-root { min-height: calc(100vh - 150px); }
}

.desk-haze {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(60% 55% at 22% 18%, rgba(192,138,62,0.17) 0%, transparent 68%),
    radial-gradient(55% 60% at 86% 88%, rgba(120,150,180,0.09) 0%, transparent 65%);
}

.desk-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    repeating-linear-gradient(to right,  rgba(148,163,184,0.055) 0 1px, transparent 1px 72px),
    repeating-linear-gradient(to bottom, rgba(148,163,184,0.055) 0 1px, transparent 1px 72px);
  /* Fade the grid out at the edges so it reads as depth, not as a texture
     someone tiled across the whole screen. */
  -webkit-mask-image: radial-gradient(70% 70% at 50% 45%, #000 20%, transparent 100%);
          mask-image: radial-gradient(70% 70% at 50% 45%, #000 20%, transparent 100%);
}

.desk-curve {
  position: absolute; left: -8%; bottom: 0;
  width: 116%; height: 46%;
  opacity: 0.42; pointer-events: none;
}
.desk-curve path {
  stroke-dasharray: 1400;
  stroke-dashoffset: 1400;
  animation: desk-draw 2.6s cubic-bezier(.22,1,.36,1) .25s forwards;
}
@keyframes desk-draw { to { stroke-dashoffset: 0; } }

.desk-vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(85% 75% at 50% 42%, transparent 35%, rgba(11,14,18,0.82) 100%);
}

/* Content rises as the curve draws. */
.desk-in { opacity: 0; transform: translateY(14px); animation: desk-rise .85s cubic-bezier(.22,1,.36,1) forwards; }
.desk-d1 { animation-delay: .05s; }
.desk-d2 { animation-delay: .13s; }
.desk-d3 { animation-delay: .23s; }
.desk-d4 { animation-delay: .33s; }
.desk-d5 { animation-delay: .43s; }
@keyframes desk-rise { to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .desk-in { animation: none; opacity: 1; transform: none; }
  .desk-curve path { animation: none; stroke-dashoffset: 0; }
}
`;
