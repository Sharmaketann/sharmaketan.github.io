"use client";

import { useMemo, useState } from "react";
import { THEME } from "@/data/theme";

/**
 * The career plotted the way the job plots a strategy: as an equity curve.
 *
 * Each role contributes a different monthly slope, and the Oct 2021 - Aug 2022
 * break between the internship and Sapio is drawn flat rather than hidden. A
 * curve that only ever goes up is the tell of a fabricated backtest, and the
 * flat leg is the honest shape.
 *
 * The series is generated deterministically (no Math.random, no Date.now in
 * render) so the server and client produce identical SVG and hydration is
 * clean. Only the hover state lives in the browser.
 */

interface Leg {
  /** Months since the series start. */
  from: number;
  to: number;
  slopePerMonth: number;
  label: string;
  org: string;
}

const START = { year: 2021, month: 6 }; // Jul 2021, zero-indexed month
const MONTHS = 64; // Jul 2021 -> Oct 2026

const monthIndex = (year: number, month: number) =>
  (year - START.year) * 12 + (month - START.month);

const LEGS: Leg[] = [
  { from: monthIndex(2021, 6),  to: monthIndex(2021, 9),  slopePerMonth: 0.7, label: ".NET Intern",        org: "Ushyaku" },
  { from: monthIndex(2021, 9),  to: monthIndex(2022, 8),  slopePerMonth: 0.0, label: "Between roles",      org: "" },
  { from: monthIndex(2022, 8),  to: monthIndex(2023, 9),  slopePerMonth: 1.1, label: "Full Stack Dev",     org: "Sapio Analytics" },
  { from: monthIndex(2023, 10), to: monthIndex(2025, 11), slopePerMonth: 1.7, label: "Full Stack Lead",    org: "Insure Efficient" },
  { from: monthIndex(2026, 0),  to: MONTHS - 1,           slopePerMonth: 2.3, label: "Senior Backend Dev", org: "Wizzer AdvisorTech" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function labelFor(i: number) {
  const m = (START.month + i) % 12;
  const y = START.year + Math.floor((START.month + i) / 12);
  return `${MONTH_NAMES[m]} ${y}`;
}

function legAt(i: number): Leg | null {
  return LEGS.find((l) => i >= l.from && i <= l.to) ?? null;
}

/** Deterministic wobble — a straight line reads as fake, but randomness breaks SSR. */
const wobble = (i: number) => Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.6) * 0.32;

function buildSeries() {
  const pts: number[] = [];
  let v = 4;
  for (let i = 0; i < MONTHS; i++) {
    const leg = legAt(i);
    v += leg ? leg.slopePerMonth : 0;
    pts.push(Math.max(0, v + wobble(i)));
  }
  return pts;
}

const W = 760;
const H = 150;
const PAD_T = 12;
const PAD_B = 16;

export function CareerCurve() {
  const [hover, setHover] = useState<number | null>(null);

  const { line, area, points, max, markers } = useMemo(() => {
    const series = buildSeries();
    const max = Math.max(...series);
    const x = (i: number) => (i / (MONTHS - 1)) * W;
    const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B);

    const points = series.map((v, i) => ({ x: x(i), y: y(v), v, i }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${W},${H - PAD_B} L0,${H - PAD_B} Z`;

    const markers = LEGS.filter((l) => l.org).map((l) => ({
      leg: l,
      x: x(l.from),
      y: y(series[l.from]),
    }));

    return { line, area, points, max, markers };
  }, []);

  const active = hover !== null ? points[hover] : null;
  const activeLeg = hover !== null ? legAt(hover) : null;

  return (
    <figure className="m-0 w-full">
      <figcaption className="sr-only">
        Career progression from July 2021 to October 2026, drawn as an equity curve.
      </figcaption>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[120px] md:h-[150px] overflow-visible"
          preserveAspectRatio="none"
          role="img"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - r.left) / r.width;
            setHover(Math.max(0, Math.min(MONTHS - 1, Math.round(ratio * (MONTHS - 1)))));
          }}
        >
          <defs>
            <linearGradient id="cc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={THEME.accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={THEME.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid — four levels, unobtrusive */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={PAD_T + (1 - f) * (H - PAD_T - PAD_B)}
              y2={PAD_T + (1 - f) * (H - PAD_T - PAD_B)}
              stroke={THEME.grid}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill="url(#cc-fill)" />
          <path
            d={line}
            fill="none"
            stroke={THEME.accent}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="motion-safe:[stroke-dasharray:2400] motion-safe:[animation:drawIn_2.2s_cubic-bezier(.22,.61,.36,1)_forwards]"
            style={{ ["--dash" as string]: "2400" }}
          />

          {/* Role entries */}
          {markers.map((m) => (
            <g key={m.leg.org}>
              <line
                x1={m.x} x2={m.x} y1={PAD_T} y2={H - PAD_B}
                stroke={THEME.grid} strokeWidth="1" vectorEffect="non-scaling-stroke"
              />
              <circle cx={m.x} cy={m.y} r="3.5" fill={THEME.accent} vectorEffect="non-scaling-stroke" />
            </g>
          ))}

          {/* Live end point */}
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={THEME.up}>
            <animate attributeName="r" values="4;6.5;4" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;.45;1" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {active && (
            <>
              <line
                x1={active.x} x2={active.x} y1={PAD_T} y2={H - PAD_B}
                stroke={THEME.accent} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"
              />
              <circle cx={active.x} cy={active.y} r="3.5" fill={THEME.accent} vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        {/* Readout sits outside the SVG so text never scales with preserveAspectRatio="none" */}
        <div className="mt-1.5 flex items-center justify-between gap-3 font-mono text-[9.5px] text-gray-400 dark:text-gray-500">
          <span>{labelFor(0)}</span>
          <span className="truncate text-center" style={{ color: activeLeg?.org ? THEME.accent : undefined }}>
            {activeLeg
              ? activeLeg.org
                ? `${labelFor(hover!)} · ${activeLeg.label} · ${activeLeg.org}`
                : `${labelFor(hover!)} · ${activeLeg.label}`
              : "hover to scrub the curve"}
          </span>
          <span>{labelFor(MONTHS - 1)}</span>
        </div>
      </div>
    </figure>
  );
}
