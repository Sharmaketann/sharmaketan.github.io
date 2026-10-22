"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { THEME } from "@/data/theme";

/**
 * A firm access pass on a woven lanyard. Grab it and it swings.
 *
 * The reference implementation for this interaction is WebGL — three.js plus a
 * physics engine, roughly 20MB of dependency unpacked, on a site whose entire
 * shared bundle is 87KB. So the rope is a verlet solver in about eighty lines
 * and the band is drawn as geometry rather than simulated cloth.
 *
 * What makes it read as fabric rather than a stroked line:
 *  - the band is a filled polygon built from perpendicular offsets along the
 *    rope, so it has real width and the edges move independently;
 *  - it tapers into the clip the way webbing gathers into hardware;
 *  - a lengthwise gradient fakes the sheen of a folded ribbon;
 *  - the firm name is printed along it on a textPath, so it bends with it.
 *
 * The card is DOM, not canvas: the photo stays an <img> and the name stays
 * selectable text. Reduced motion gets it hanging still.
 */

const SEGMENTS = 9;
const SEG_LEN = 13;
const GRAVITY = 0.62;
const DAMPING = 0.94;    // a released pass settles in about a second
const ITERATIONS = 16;

const CARD_W = 268;
const CARD_H = 366;

const BAND_W = 19;   // half-width along the run
const CLIP_W = 6.5;  // half-width where it meets the hardware

interface P { x: number; y: number; px: number; py: number }

export function LanyardPass() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<SVGPathElement>(null);
  const centreRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGGElement>(null);

  const pts = useRef<P[]>([]);
  const anchor = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  const raf = useRef(0);
  const scale = useRef(1);
  const [boxH, setBoxH] = useState(SEGMENTS * SEG_LEN + CARD_H + 44);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);

  const fit = useCallback((w: number) => {
    // A card tilted ~25 degrees spans W*cos25 + H*sin25 horizontally, which
    // is much wider than W — sizing against W alone is why it overflowed.
    const swept = CARD_W * 0.906 + CARD_H * 0.423;
    const k = Math.max(0.6, Math.min(1, (w - 14) / swept));
    scale.current = k;
    setBoxH(Math.round((SEGMENTS * SEG_LEN + CARD_H + 44) * k));
    return k;
  }, []);

  const seed = useCallback((w: number) => {
    anchor.current = { x: w / 2, y: 0 };
    pts.current = Array.from({ length: SEGMENTS }, (_, i) => ({
      x: anchor.current.x,
      y: i * SEG_LEN * scale.current,
      px: anchor.current.x, // starts at rest; it only moves when dragged
      py: i * SEG_LEN * scale.current,
    }));
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fit(wrap.clientWidth);
    seed(wrap.clientWidth);
    setReady(true);

    /** Build the woven band as a closed polygon around the rope centreline. */
    const paint = () => {
      const p = pts.current;
      const n = p.length;

      const left: string[] = [];
      const right: string[] = [];
      for (let i = 0; i < n; i++) {
        const a = p[Math.max(0, i - 1)];
        const b = p[Math.min(n - 1, i + 1)];
        let tx = b.x - a.x;
        let ty = b.y - a.y;
        const len = Math.hypot(tx, ty) || 1;
        tx /= len;
        ty /= len;
        // Constant width, gathering only over the last fifth where the
        // webbing feeds into the clip.
        const t = i / (n - 1);
        const gather = t < 0.8 ? 0 : (t - 0.8) / 0.2;
        const hw = (BAND_W + (CLIP_W - BAND_W) * gather) * scale.current;
        const nx = -ty * hw;
        const ny = tx * hw;
        left.push(`${(p[i].x + nx).toFixed(1)},${(p[i].y + ny).toFixed(1)}`);
        right.push(`${(p[i].x - nx).toFixed(1)},${(p[i].y - ny).toFixed(1)}`);
      }
      bandRef.current?.setAttribute(
        "d",
        `M${left.join(" L")} L${right.reverse().join(" L")} Z`,
      );
      centreRef.current?.setAttribute(
        "d",
        p.map((q, i) => `${i === 0 ? "M" : "L"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" "),
      );

      const last = p[n - 1];
      const prev = p[n - 2];
      const angle = (Math.atan2(last.x - prev.x, last.y - prev.y) * 180) / Math.PI;

      clipRef.current?.setAttribute(
        "transform",
        `translate(${last.x.toFixed(1)} ${last.y.toFixed(1)}) rotate(${(-angle).toFixed(2)})`,
      );
      if (cardRef.current) {
        cardRef.current.style.transform =
          `translate(${(last.x - CARD_W / 2).toFixed(1)}px, ${(last.y + 16 * scale.current).toFixed(1)}px) rotate(${(-angle).toFixed(2)}deg) scale(${scale.current.toFixed(3)})`;
        cardRef.current.style.transformOrigin = "top center";
      }
    };

    if (reduce) {
      setStill(true);
      pts.current.forEach((q, i) => { q.x = anchor.current.x; q.y = i * SEG_LEN; q.px = q.x; q.py = q.y; });
      paint();
      return;
    }

    const step = () => {
      const p = pts.current;

      for (let i = 1; i < p.length; i++) {
        const q = p[i];
        const vx = (q.x - q.px) * DAMPING;
        const vy = (q.y - q.py) * DAMPING;
        q.px = q.x;
        q.py = q.y;
        q.x += vx;
        q.y += vy + GRAVITY * scale.current;
      }

      for (let k = 0; k < ITERATIONS; k++) {
        p[0].x = anchor.current.x;
        p[0].y = anchor.current.y;

        for (let i = 0; i < p.length - 1; i++) {
          const a = p[i];
          const b = p[i + 1];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const diff = (d - SEG_LEN * scale.current) / d / 2;
          dx *= diff;
          dy *= diff;
          if (i === 0) {
            b.x -= dx * 2;
            b.y -= dy * 2;
          } else {
            a.x += dx;
            a.y += dy;
            b.x -= dx;
            b.y -= dy;
          }
        }

        if (drag.current.active) {
          const last = p[p.length - 1];
          last.x = drag.current.x;
          last.y = drag.current.y;
          last.px = last.x;
          last.py = last.y;
        }

      }

      paint();
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);

    const ro = new ResizeObserver(() => {
      if (!wrap.clientWidth) return;
      fit(wrap.clientWidth);
      anchor.current.x = wrap.clientWidth / 2;
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [seed, fit]);

  const toLocal = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent) => {
    if (still) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const l = toLocal(e);
    drag.current = { active: true, x: l.x, y: l.y - 16 };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const l = toLocal(e);
    drag.current.x = l.x;
    drag.current.y = l.y - 16;
  };
  const onUp = (e: React.PointerEvent) => {
    // Clear the flag first. Capture is taken on the card but this handler is
    // on the wrapper, and releasePointerCapture throws NotFoundError when the
    // element does not hold that pointer — which previously aborted the
    // handler and left the pass pinned wherever it was dropped.
    drag.current.active = false;
    const el = e.currentTarget as Element;
    try {
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    } catch {
      /* no capture to release */
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height: boxH }}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden>
        <defs>
          <linearGradient id="band-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6b4a16" />
            <stop offset="28%"  stopColor={THEME.accent} />
            <stop offset="50%"  stopColor="#e3b96d" />
            <stop offset="58%"  stopColor="#c99440" />
            <stop offset="78%"  stopColor={THEME.accent} />
            <stop offset="100%" stopColor="#5e400f" />
          </linearGradient>
          <linearGradient id="clip-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e8eaed" />
            <stop offset="45%"  stopColor="#9aa0a8" />
            <stop offset="55%"  stopColor="#c7ccd2" />
            <stop offset="100%" stopColor="#7d838b" />
          </linearGradient>
        </defs>

        {/* Woven band */}
        <path ref={bandRef} fill="url(#band-sheen)" stroke="rgba(0,0,0,.35)" strokeWidth="0.6" />
        {/* Invisible centreline that the printed text follows */}
        <path ref={centreRef} id="band-centre" fill="none" stroke="none" />
        <text
          fill="rgba(0,0,0,.42)"
          fontSize="7"
          fontFamily="ui-monospace, monospace"
          letterSpacing="2.4"
        >
          <textPath href="#band-centre" startOffset="6%">
            SHARMAKETANN.IN · SHARMAKETANN.IN
          </textPath>
        </text>

        {/* Clip hardware */}
        <g ref={clipRef}>
          <rect x="-9" y="-3" width="18" height="13" rx="2.5" fill="url(#clip-metal)" stroke="rgba(0,0,0,.4)" strokeWidth="0.6" />
          <rect x="-6" y="0.5" width="12" height="2" rx="1" fill="rgba(0,0,0,.28)" />
          <rect x="-2.5" y="9" width="5" height="8" rx="1.5" fill="url(#clip-metal)" stroke="rgba(0,0,0,.4)" strokeWidth="0.6" />
        </g>
      </svg>

      {/* The pass */}
      <div
        ref={cardRef}
        onPointerDown={onDown}
        className={`absolute left-0 top-0 origin-top ${still ? "" : "cursor-grab active:cursor-grabbing"}`}
        style={{ width: CARD_W, visibility: ready ? "visible" : "hidden", touchAction: "none" }}
      >
        {/* Punch hole */}
        <div className="flex justify-center -mb-px">
          <div
            className="h-[9px] w-[34px] rounded-full"
            style={{ background: "#0c0f13", boxShadow: "inset 0 1px 2px rgba(0,0,0,.9)" }}
          />
        </div>

        <div
          className="rounded-[14px] overflow-hidden"
          style={{
            background: "linear-gradient(158deg,#222836 0%,#171c26 42%,#10141b 100%)",
            border: "1px solid rgba(190,200,215,.16)",
            boxShadow:
              "0 26px 50px -18px rgba(0,0,0,.85), 0 2px 0 rgba(255,255,255,.05) inset, 0 -16px 36px -22px rgba(192,138,62,.5) inset",
          }}
        >
          {/* Firm bar */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5"
            style={{ background: "linear-gradient(90deg,rgba(192,138,62,.17),transparent 70%)", borderBottom: "1px solid rgba(190,200,215,.12)" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: THEME.accent }} />
              <span className="font-mono text-[8.5px] tracking-[0.2em] text-gray-200">SHARMAKETANN</span>
            </span>
            <span className="font-mono text-[7px] tracking-[0.16em] text-gray-500">EST. 2021</span>
          </div>

          <div className="px-4 pt-4 pb-3">
            <div className="flex gap-3.5">
              <div
                className="w-[94px] h-[114px] rounded-md overflow-hidden shrink-0"
                style={{ border: "1px solid rgba(190,200,215,.2)" }}
              >
                <Image
                  src="/_static/me1.jpg"
                  alt="Sharma Ketan"
                  width={200}
                  height={244}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="font-mono text-[7px] tracking-[0.16em] text-gray-500 mb-1">BEARER</p>
                <p className="text-[17px] font-semibold tracking-tight text-gray-50 leading-tight">
                  Sharma<br />Ketan
                </p>
                <p className="font-mono text-[8px] tracking-[0.08em] mt-1.5 leading-snug" style={{ color: THEME.accent }}>
                  SENIOR BACKEND<br />DEVELOPER
                </p>
              </div>
            </div>

            {/* Credential rows */}
            <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2">
              {[
                ["DESK", "Market Data"],
                ["ID", "SK-2026-01"],
                ["CLEARANCE", "Backend"],
                ["BASED", "Mumbai"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[6.5px] tracking-[0.14em] text-gray-500">{k}</dt>
                  <dd className="font-mono text-[9.5px] text-gray-200 mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Holographic strip */}
          <div
            className="h-[18px] mx-4 rounded-[3px] mb-3"
            style={{
              background:
                "linear-gradient(100deg, rgba(192,138,62,.5), rgba(31,169,122,.4) 32%, rgba(120,160,220,.4) 58%, rgba(192,138,62,.5))",
              opacity: 0.5,
            }}
            aria-hidden
          />

          {/* Barcode + status */}
          <div
            className="flex items-end justify-between gap-3 px-4 pb-3.5 pt-2.5"
            style={{ borderTop: "1px solid rgba(190,200,215,.1)" }}
          >
            <div className="flex gap-[1.5px] h-5 items-end flex-1" aria-hidden>
              {[7,3,9,2,6,4,8,3,5,9,2,7,4,8,3,6,9,2,5,7,3,8,4,6,2,9].map((h, i) => (
                <span key={i} className="flex-1 rounded-[0.5px]" style={{ height: `${h * 2.1}px`, background: "rgba(200,208,220,.45)" }} />
              ))}
            </div>
            <span className="inline-flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: THEME.up }} />
              <span className="font-mono text-[7px] tracking-[0.1em]" style={{ color: THEME.up }}>ACTIVE</span>
            </span>
          </div>
        </div>
      </div>

      {!still && (
        <p className="absolute bottom-0 inset-x-0 text-center font-mono text-[8.5px] text-gray-400 dark:text-gray-600">
          drag the pass
        </p>
      )}
    </div>
  );
}
