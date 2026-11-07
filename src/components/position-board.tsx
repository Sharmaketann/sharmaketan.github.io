"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POSITIONS, label, heldMonths, heldLabel } from "@/data/career";
import { THEME } from "@/data/theme";

/**
 * The board.
 *
 * Every position hangs off a rail on its own string and swings. The strings
 * are drawn on a canvas underneath; the dockets are ordinary DOM, moved with
 * a transform each frame so the text stays selectable and the links stay
 * real links.
 *
 * The physics is a plain pendulum rather than the lattice the hero badge
 * uses - one angle per card, gravity as a restoring torque, a damping term,
 * and the drag writing the angle directly. A card is rigid and hangs from a
 * point, so there is nothing a cloth solver would add here except cost.
 *
 * Sound is synthesised in the browser: two detuned sine partials with an
 * exponential decay, one note per card down a pentatonic scale. No audio
 * files, so nothing to host and no rights to clear.
 */

const GRAVITY = 26;      // restoring strength
const DAMP = 1.1;        // how quickly a swing dies
const MAX_STEP = 1 / 40; // clamp a long frame so a tab wake cannot explode it

/** C major pentatonic, low to high. Any two ring together without clashing. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

interface Card {
  /** radians from straight down */
  a: number;
  av: number;
  pinX: number;
  pinY: number;
  len: number;
  dragging: boolean;
  el: HTMLDivElement | null;
}

export function PositionBoard() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<Card[]>([]);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [open, setOpen] = useState<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // The open position's duration depends on today's date, so the server and
  // the first client render have to agree on *not knowing it yet*. Reading
  // the clock inline rendered "-" on the server and "11 mo" on the client,
  // which failed hydration and - because React then threw the markup away
  // and re-rendered - left the animation loop holding refs to detached
  // nodes, so nothing ever moved.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  /** A struck docket: two partials, quick attack, long exponential tail. */
  const chime = useCallback((i: number) => {
    if (mutedRef.current) return;
    try {
      // Created on the first gesture, which is the only time a browser
      // will let it start.
      const ctx =
        audioRef.current ??
        (audioRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)());
      if (ctx.state === "suspended") void ctx.resume();

      const t = ctx.currentTime;
      const f = SCALE[i % SCALE.length];
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      out.connect(ctx.destination);

      [
        { m: 1, g: 1 },
        { m: 2.01, g: 0.32 }, // slightly sharp partial: metal, not flute
        { m: 2.99, g: 0.12 },
      ].forEach(({ m, g }) => {
        const o = ctx.createOscillator();
        const vg = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f * m;
        vg.gain.value = g;
        o.connect(vg).connect(out);
        o.start(t);
        o.stop(t + 2);
      });
    } catch {
      /* no audio available; the board still works */
    }
  }, []);

  // ── Layout + simulation ──────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layout = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // One rail when there is room, two rows when there is not. The
      // threshold matches the md: height class on the wrapper - if the two
      // disagree, there is a band of widths where the last row hangs off
      // the bottom of the board.
      const narrow = w < 768;
      const perRow = narrow ? 2 : cardsRef.current.length;

      cardsRef.current.forEach((c, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const colW = w / perRow;
        c.pinX = colW * (col + 0.5);
        c.pinY = 26 + row * 250;
        // Alternate the drop so the row does not read as a straight line.
        c.len = (narrow ? 96 : 108) + ((i % 3) * 16);
        if (!c.dragging) c.a = c.a || 0;
      });
    };

    let raf = 0;
    let last = performance.now();

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((t - last) / 1000, MAX_STEP);
      last = t;
      if (document.hidden) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < cardsRef.current.length; i++) {
        const c = cardsRef.current[i];

        if (!c.dragging && !reduce) {
          // theta'' = -(g/L) sin(theta) - damping * theta'
          const acc = -(GRAVITY / c.len) * 40 * Math.sin(c.a) - DAMP * c.av;
          c.av += acc * dt;
          c.a += c.av * dt;
        }

        const x = c.pinX + Math.sin(c.a) * c.len;
        const y = c.pinY + Math.cos(c.a) * c.len;

        // String: a shallow curve, bowing away from the swing.
        ctx.beginPath();
        ctx.moveTo(c.pinX, c.pinY);
        ctx.quadraticCurveTo(
          (c.pinX + x) / 2 - Math.sin(c.a) * 6,
          (c.pinY + y) / 2 + 8,
          x,
          y,
        );
        ctx.strokeStyle = "rgba(192,138,62,0.42)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // The pin
        ctx.beginPath();
        ctx.arc(c.pinX, c.pinY, 3, 0, Math.PI * 2);
        ctx.fillStyle = THEME.accent;
        ctx.fill();

        if (c.el) {
          c.el.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px) rotate(${
            c.a * (180 / Math.PI)
          }deg)`;
        }
      }
    };

    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    layout();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // ── Drag ─────────────────────────────────────────────────────────────
  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    const c = cardsRef.current[i];
    if (!c) return;
    c.dragging = true;
    c.av = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (i: number) => (e: React.PointerEvent) => {
    const c = cardsRef.current[i];
    const wrap = wrapRef.current;
    if (!c || !c.dragging || !wrap) return;
    const r = wrap.getBoundingClientRect();
    const dx = e.clientX - r.left - c.pinX;
    const dy = Math.max(12, e.clientY - r.top - c.pinY);
    // Clamped so a card cannot be swung over the rail and left upside down.
    c.a = Math.max(-1.2, Math.min(1.2, Math.atan2(dx, dy)));
  };

  const onPointerUp = (i: number) => (e: React.PointerEvent) => {
    const c = cardsRef.current[i];
    if (!c) return;
    c.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-[12px] text-gray-500 dark:text-gray-400">
          Drag a docket to swing it. Tap one to hear it and read the detail.
        </p>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          className="shrink-0 font-mono text-[10px] px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-gray-600 hover:border-[#c08a3e] hover:text-[#c08a3e] transition-colors"
        >
          {muted ? "sound off" : "sound on"}
        </button>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full h-[520px] md:h-[330px] rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/40 overflow-hidden"
      >
        {/* The rail the dockets hang from */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[25px] h-px"
          style={{ background: "rgba(192,138,62,0.3)" }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {POSITIONS.map((p, i) => {
          const months = heldMonths(p.start, p.end, now);
          return (
            <div
              key={p.symbol}
              ref={(el) => {
                if (!cardsRef.current[i]) {
                  cardsRef.current[i] = {
                    a: (i % 2 ? 1 : -1) * (0.12 + i * 0.03),
                    av: 0,
                    pinX: 0,
                    pinY: 0,
                    len: 110,
                    dragging: false,
                    el,
                  };
                } else {
                  cardsRef.current[i].el = el;
                }
              }}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove(i)}
              onPointerUp={onPointerUp(i)}
              onPointerCancel={onPointerUp(i)}
              onClick={() => {
                chime(i);
                setOpen((o) => (o === i ? null : i));
              }}
              className="absolute left-0 top-0 w-[160px] sm:w-[190px] cursor-grab active:cursor-grabbing select-none touch-none rounded-md border bg-white dark:bg-zinc-950 px-3 py-2.5 shadow-lg"
              style={{
                transformOrigin: "50% -6px",
                borderColor: open === i ? THEME.accent : undefined,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: THEME.accent }}
                >
                  {p.symbol}
                </span>
                <span className="font-mono text-[9px] text-gray-400 dark:text-gray-600">
                  {heldLabel(months)}
                </span>
              </div>
              <p className="text-[12.5px] font-medium mt-1 leading-tight text-gray-900 dark:text-gray-100">
                {p.org}
              </p>
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                {p.role}
              </p>
              <p className="font-mono text-[9px] text-gray-400 dark:text-gray-600 mt-1.5">
                {label(p.start)} &ndash; {p.end ? label(p.end) : "now"}
              </p>
              {p.result && (
                <p
                  className="font-mono text-[9.5px] mt-1"
                  style={{ color: THEME.up }}
                >
                  {p.result}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail for the struck docket */}
      {open !== null && (
        <div
          className="mt-5 rounded-lg border p-4 animate-[ckFade_220ms_ease-out]"
          style={{ borderColor: THEME.accent, background: THEME.accentWash }}
        >
          <p className="font-mono text-[10px] tracking-wider mb-2" style={{ color: THEME.accent }}>
            {POSITIONS[open].symbol} &middot; {POSITIONS[open].sector}
          </p>
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            {POSITIONS[open].note}
          </p>
          <ul className="space-y-1.5">
            {POSITIONS[open].marks.map((m) => (
              <li
                key={m}
                className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed pl-3.5 -indent-3.5"
              >
                <span style={{ color: THEME.accent }}>&mdash; </span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
