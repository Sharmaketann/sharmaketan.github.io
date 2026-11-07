"use client";

import { useEffect, useRef } from "react";
import { Rope, type Pointer } from "./rope";
import { SCALE, strike } from "./chime";
import { POSITIONS, EDUCATION, label } from "@/data/career";

/**
 * The board: cards hung off one continuous string, and a frame in the middle
 * that plays whatever you put in it.
 *
 * Why this is imperative DOM rather than React state
 * --------------------------------------------------
 * Every card moves every frame. Routing 60fps of transforms through React
 * state would mean 60 reconciles a second for a scene whose structure never
 * changes, and the previous version of this page proved the sharper version of
 * the same problem: a mid-animation re-render swapped the nodes out from under
 * the loop, which was left holding refs to elements no longer in the document,
 * and nothing moved at all. So the effect builds the nodes once and writes
 * `transform` straight onto them. React owns the mount; the loop owns the
 * pixels.
 *
 * Topology
 * --------
 * The string is a chain — card 0 to card 1 to card 2, and so on — not a set of
 * drops from a rail. That is what makes it read as one piece of string someone
 * strung across a wall. One extra length runs from the frame to the middle
 * card, so the frame is visibly part of the same run.
 */

const ROPE_N = 16;
const DAMP = 0.986;
const ITERS = 4;
/** Where the string meets a card: top centre, just inside the edge. */
const ATTACH_INSET = 8;
/** Below this width the board stacks instead of scattering. */
const NARROW = 820;

interface Card {
  /** Short code on the plate. */
  code: string;
  org: string;
  role: string;
  meta: string;
  caption: string;
  detail: string;
  /** Drop a file in public/_static/board/ and name it here to use a photo
   *  instead of the generated plate. Nothing requires one. */
  img?: string;
  /** Percent of the board, and the card's own size in px. */
  px: number;
  py: number;
  w: number;
  h: number;
  tint: number;
  open?: boolean;
}

/**
 * Scatter positions, as percentages so they survive a resize.
 *
 * Hand-placed rather than generated: a random scatter reliably produces one
 * pair that overlaps badly and one card hugging an edge. These five are
 * arranged clockwise so the chain wraps the frame instead of crossing it.
 */
const LAYOUT: Array<Pick<Card, "px" | "py" | "w" | "h">> = [
  { px: 16, py: 21, w: 175, h: 215 },
  { px: 79, py: 17, w: 195, h: 150 },
  { px: 86, py: 66, w: 165, h: 200 },
  { px: 50, py: 88, w: 200, h: 140 },
  { px: 19, py: 75, w: 150, h: 185 },
];

function buildCards(): Card[] {
  const out: Card[] = POSITIONS.map((p, i) => ({
    code: p.symbol,
    org: p.org,
    role: p.role,
    meta: p.sector,
    caption: p.org,
    detail: p.note,
    px: 0,
    py: 0,
    w: 0,
    h: 0,
    tint: i,
    open: p.end === null,
  }));

  out.push({
    code: "CHRIST",
    org: EDUCATION.org,
    role: EDUCATION.qual,
    meta: "Education",
    caption: EDUCATION.org,
    detail: EDUCATION.detail,
    px: 0,
    py: 0,
    w: 0,
    h: 0,
    tint: out.length,
  });

  // Reorder so the chain runs clockwise: the last card sits bottom-left, which
  // closes the loop back under the first.
  const order = [0, 1, 2, 4, 3];
  const ranked = order.map((i) => out[i]).filter(Boolean);
  return ranked.map((c, i) => ({ ...c, ...LAYOUT[i % LAYOUT.length] }));
}

/** Date ranges, computed on the client so nothing here depends on render time. */
function rangeOf(code: string): string {
  const p = POSITIONS.find((x) => x.symbol === code);
  if (p) return `${label(p.start)} — ${p.end ? label(p.end) : "present"}`;
  return `${label(EDUCATION.start)} — ${label(EDUCATION.end)}`;
}

interface Node extends Card {
  el: HTMLDivElement;
  x: number;
  y: number;
  /** A fixed tilt, so the card looks pinned rather than printed. */
  rot: number;
  homePx: number;
  homePy: number;
  dragging: boolean;
  returning: boolean;
  inFrame: boolean;
  ropeNext: Rope | null;
  freq: number;
}

export function Moodboard({ onClose }: { onClose?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const canvas = root.querySelector<HTMLCanvasElement>(".bd-strings");
    const board = root.querySelector<HTMLDivElement>(".bd-board");
    const frame = root.querySelector<HTMLDivElement>(".bd-frame");
    const plate = root.querySelector<HTMLDivElement>(".bd-frame-plate");
    const hint = root.querySelector<HTMLDivElement>(".bd-frame-hint");
    const capBar = root.querySelector<HTMLDivElement>(".bd-frame-cap");
    const capText = root.querySelector<HTMLSpanElement>(".bd-frame-cap-text");
    const capMeta = root.querySelector<HTMLSpanElement>(".bd-frame-cap-meta");
    const eject = root.querySelector<HTMLButtonElement>(".bd-frame-eject");
    if (!canvas || !board || !frame || !plate || !capBar || !capText) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // StrictMode mounts effects twice in development. `dead` makes the first
    // run's loop and listeners inert instead of leaving two loops writing to
    // the same nodes.
    let dead = false;
    let raf = 0;
    let kickoff: number | undefined;
    const cleanups: Array<() => void> = [];

    const on = (
      t: EventTarget,
      ev: string,
      fn: (e: never) => void,
      opts?: AddEventListenerOptions,
    ) => {
      t.addEventListener(ev, fn as EventListener, opts);
      cleanups.push(() => t.removeEventListener(ev, fn as EventListener));
    };

    let W = 0;
    let H = 0;
    let dpr = 1;
    const pointer: Pointer = { x: 0, y: 0, active: false };
    const nodes: Node[] = [];
    let held: Node | null = null;
    let frameRopeTo = -1;
    const frameRope = new Rope(ROPE_N, 12);

    function sizeCanvas() {
      const r = board!.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Where the string meets a card — or the frame, if it is holding it. */
    function anchor(n: Node) {
      if (n.inFrame) {
        const fr = frame!.getBoundingClientRect();
        const br = board!.getBoundingClientRect();
        return {
          x: fr.left - br.left + fr.width / 2,
          y: fr.top - br.top + ATTACH_INSET,
        };
      }
      return { x: n.x + n.w / 2, y: n.y + ATTACH_INSET };
    }

    function place(n: Node) {
      n.el.style.transform = `translate(${n.x}px, ${n.y}px) rotate(${n.rot}deg)`;
    }

    function layout() {
      const narrow = W < NARROW;
      nodes.forEach((n, i) => {
        if (narrow) {
          // Two columns, gently alternating, so a phone gets a legible stack
          // rather than a pile of overlapping cards.
          const col = i % 2;
          const row = Math.floor(i / 2);
          n.homePx = col === 0 ? 29 : 71;
          n.homePy = 13 + row * 27;
        } else {
          n.homePx = n.px;
          n.homePy = n.py;
        }
        if (n.dragging || n.returning) return;
        n.x = (n.homePx / 100) * W - n.w / 2;
        n.y = (n.homePy / 100) * H - n.h / 2;
        place(n);
      });
    }

    // ---- build the cards -------------------------------------------------
    buildCards().forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "bd-node";
      el.style.width = `${c.w}px`;
      el.style.height = `${c.h}px`;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute(
        "aria-label", `${c.org} — ${c.role}. Activate to open in the frame.`,
      );

      el.innerHTML = `
        <div class="bd-plate" data-tint="${c.tint}">
          ${
            c.img
              ? `<img src="${c.img}" alt="" draggable="false">`
              : `<span class="bd-code">${c.code}</span>
                 <span class="bd-meta">${c.meta}</span>
                 ${c.open ? `<span class="bd-live">open</span>` : ""}`
          }
        </div>
        <div class="bd-cap">${c.caption}</div>
      `;

      board.appendChild(el);
      const n: Node = {
        ...c,
        el,
        x: 0,
        y: 0,
        rot: 0,
        homePx: c.px,
        homePy: c.py,
        dragging: false,
        returning: false,
        inFrame: false,
        ropeNext: null,
        freq: SCALE[i % SCALE.length],
      } as Node;
      // A consistent, tiny tilt per card. Derived from the index rather than
      // random so it does not change on every mount.
      n.rot = [-3.2, 2.4, -1.6, 3.1, -2.2][i % 5];
      nodes.push(n);
      wire(n);
    });

    for (let i = 0; i < nodes.length - 1; i++) nodes[i].ropeNext = new Rope(ROPE_N);
    frameRopeTo = nodes.length ? Math.floor(nodes.length / 2) : -1;

    // ---- the frame -------------------------------------------------------
    function insert(n: Node) {
      if (held && held !== n) {
        const prev = held;
        prev.inFrame = false;
        prev.el.classList.remove("in-frame");
        goHome(prev);
      }
      n.inFrame = true;
      n.el.classList.add("in-frame");
      held = n;

      plate!.innerHTML = n.img
        ? `<img src="${n.img}" alt="">`
        : `<span class="bd-frame-code">${n.code}</span>
           <span class="bd-frame-role">${n.role}</span>`;
      plate!.dataset.tint = String(n.tint);
      plate!.classList.add("show");
      if (hint) hint.style.display = "none";

      capText!.textContent = n.caption;
      if (capMeta) capMeta.textContent = rangeOf(n.code);
      capBar!.classList.add("show");

      frame!.classList.add("playing");
      strike(n.freq);
      // The equaliser is only honest while the note is actually ringing.
      window.setTimeout(() => {
        if (!dead && held === n) frame!.classList.remove("playing");
      }, 2400);

      const d = root!.querySelector<HTMLDivElement>(".bd-detail");
      if (d) {
        d.textContent = n.detail;
        d.classList.add("show");
      }
    }

    function clearFrame() {
      if (!held) return;
      held.inFrame = false;
      held.el.classList.remove("in-frame");
      goHome(held);
      held = null;
      plate!.classList.remove("show");
      plate!.innerHTML = "";
      capBar!.classList.remove("show");
      frame!.classList.remove("playing");
      if (hint) hint.style.display = "";
      const d = root!.querySelector<HTMLDivElement>(".bd-detail");
      if (d) d.classList.remove("show");
    }

    function overFrame(n: Node) {
      const fr = frame!.getBoundingClientRect();
      const cx = n.x + n.w / 2 + board!.getBoundingClientRect().left;
      const cy = n.y + n.h / 2 + board!.getBoundingClientRect().top;
      return cx > fr.left && cx < fr.right && cy > fr.top && cy < fr.bottom;
    }

    /** Ease back to the card's home spot. Cubic out over 480ms. */
    function goHome(n: Node) {
      n.returning = true;
      const fromX = n.x;
      const fromY = n.y;
      const toX = (n.homePx / 100) * W - n.w / 2;
      const toY = (n.homePy / 100) * H - n.h / 2;
      const t0 = performance.now();
      const step = (now: number) => {
        if (dead) return;
        const u = Math.min(1, (now - t0) / 480);
        const e = 1 - Math.pow(1 - u, 3);
        n.x = fromX + (toX - fromX) * e;
        n.y = fromY + (toY - fromY) * e;
        place(n);
        if (u < 1 && n.returning) requestAnimationFrame(step);
        else n.returning = false;
      };
      requestAnimationFrame(step);
    }

    // ---- drag ------------------------------------------------------------
    function wire(n: Node) {
      const el = n.el;
      let gx = 0;
      let gy = 0;
      let sx = 0;
      let sy = 0;
      let moved = false;

      on(el, "pointerdown", (e: PointerEvent) => {
        if (n.inFrame || dead) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        n.dragging = true;
        n.returning = false;
        el.classList.add("dragging");
        moved = false;
        gx = e.clientX - n.x;
        gy = e.clientY - n.y;
        sx = e.clientX;
        sy = e.clientY;
      });

      on(el, "pointermove", (e: PointerEvent) => {
        if (!n.dragging) return;
        // 5px of slop, so a click with a shaky hand is still a click.
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > 5) moved = true;
        n.x = e.clientX - gx;
        n.y = e.clientY - gy;
        place(n);
        frame!.classList.toggle("drag-over", overFrame(n));
      });

      on(el, "pointerup", () => {
        if (!n.dragging) return;
        n.dragging = false;
        el.classList.remove("dragging");
        frame!.classList.remove("drag-over");
        if (overFrame(n) || !moved) {
          // Dropped on the frame, or never really moved — treat as a pick.
          insert(n);
          goHome(n);
        } else {
          // Wherever you let go becomes its new home.
          n.homePx = ((n.x + n.w / 2) / W) * 100;
          n.homePy = ((n.y + n.h / 2) / H) * 100;
          place(n);
        }
      });

      on(el, "keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          insert(n);
        }
      });
    }

    // ---- loop ------------------------------------------------------------
    const threadBase = () =>
      getComputedStyle(root!).getPropertyValue("--bd-thread").trim() ||
      "192, 138, 62";

    let t = 0;
    function tick(now?: number) {
      if (dead) return;
      t = now ?? t + 16;
      ctx!.clearRect(0, 0, W, H);
      const rgb = threadBase();

      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        if (!a.ropeNext) a.ropeNext = new Rope(ROPE_N);
        const pa = anchor(a);
        const pb = anchor(b);
        a.ropeNext.update(pa.x, pa.y, pb.x, pb.y, t, DAMP, ITERS, pointer);
        const lit = a.inFrame || b.inFrame;
        a.ropeNext.draw(
          ctx!,
          `rgba(${rgb}, ${lit ? 0.85 : 0.45})`,
          lit ? 2.2 : 1.4,
        );
      }

      if (frameRopeTo >= 0 && nodes[frameRopeTo] && !nodes[frameRopeTo].inFrame) {
        const fr = frame!.getBoundingClientRect();
        const br = board!.getBoundingClientRect();
        const fx = fr.left - br.left + fr.width / 2;
        const fy = fr.top - br.top + ATTACH_INSET;
        const to = anchor(nodes[frameRopeTo]);
        frameRope.update(fx, fy, to.x, to.y, t, DAMP, ITERS, pointer);
        frameRope.draw(ctx!, `rgba(${rgb}, 0.4)`, 1.3);
      }

      raf = requestAnimationFrame(tick);
    }

    // ---- listeners -------------------------------------------------------
    on(board, "pointermove", (e: PointerEvent) => {
      const r = board.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    });
    on(board, "pointerleave", () => {
      pointer.active = false;
    });
    on(window, "resize", () => {
      sizeCanvas();
      layout();
    });
    if (eject) {
      on(eject, "click", (e: MouseEvent) => {
        e.stopPropagation();
        clearFrame();
      });
    }
    on(frame, "click", (e: MouseEvent) => {
      // Clicking the frame itself re-strikes whatever is in it.
      if (e.target === eject) return;
      if (held) {
        strike(held.freq);
        frame.classList.add("playing");
        window.setTimeout(() => {
          if (!dead) frame.classList.remove("playing");
        }, 2400);
      }
    });
    if (onClose) {
      on(window, "keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      });
    }

    sizeCanvas();
    layout();

    // Two frames so the browser has committed the layout before the blur-in
    // starts, then a short beat so the board is visibly settling rather than
    // already settled when it appears.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nodes.forEach((n, i) =>
          window.setTimeout(() => {
            if (!dead) n.el.classList.add("loaded");
          }, i * 45),
        );
      });
    });
    kickoff = window.setTimeout(() => {
      if (!dead) raf = requestAnimationFrame(tick);
    }, 350);

    return () => {
      dead = true;
      if (kickoff) clearTimeout(kickoff);
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      nodes.forEach((n) => n.el.remove());
    };
  }, [onClose]);

  return (
    <div className="bd-root" ref={rootRef}>
      <style>{CSS}</style>
      <div className="bd-board">
        <canvas className="bd-strings" aria-hidden="true" />

        <div className="bd-frame-wrap">
          <div className="bd-frame">
            <div className="bd-frame-hint">
              Drag a card in here
              <br />
              <span>or just click one</span>
            </div>
            <div className="bd-frame-plate" />
            <div className="bd-frame-cap">
              <span className="bd-frame-cap-body">
                <span className="bd-frame-cap-text" />
                <span className="bd-frame-cap-meta" />
              </span>
              <span className="bd-eq" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <button
                type="button"
                className="bd-frame-eject"
                aria-label="Take it out of the frame"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="bd-detail" />
        </div>
      </div>
    </div>
  );
}

/**
 * Scoped to .bd-root and injected with the component, so none of it reaches
 * the rest of the site. The dark variants hang off `.dark`, which next-themes
 * puts on <html>.
 */
const CSS = `
.bd-root {
  --bd-thread: 192, 138, 62;
  --bd-card: #fbfaf7;
  --bd-plate: #efece4;
  --bd-ink: #1b1813;
  --bd-soft: #7c7467;
  --bd-edge: rgba(27, 24, 19, 0.10);
  position: absolute; inset: 0; overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.dark .bd-root {
  --bd-card: #17181b;
  --bd-plate: #1e2024;
  --bd-ink: #e8e6e1;
  --bd-soft: #8b8678;
  --bd-edge: rgba(255, 255, 255, 0.08);
}
.bd-root * { box-sizing: border-box; }

.bd-board {
  position: absolute; inset: 0; overflow: hidden;
  background:
    radial-gradient(circle at 18% 12%, rgba(192,138,62,0.07) 0%, transparent 55%),
    radial-gradient(circle at 84% 82%, rgba(192,138,62,0.05) 0%, transparent 50%);
}
.bd-strings { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

/* ---- a card ---- */
.bd-node {
  position: absolute; top: 0; left: 0; z-index: 5;
  padding: 5px; border-radius: 13px;
  background: var(--bd-card);
  border: 1px solid var(--bd-edge);
  box-shadow: 0 10px 22px rgba(15,14,12,0.13), 0 2px 5px rgba(15,14,12,0.07);
  cursor: grab; touch-action: none; user-select: none;
  opacity: 0; filter: blur(18px);
  transition: opacity .8s cubic-bezier(.22,1,.36,1),
              filter .8s cubic-bezier(.22,1,.36,1),
              box-shadow .18s;
  will-change: transform, opacity, filter;
}
.bd-node.loaded { opacity: 1; filter: blur(0); }
.bd-node:hover { box-shadow: 0 16px 30px rgba(15,14,12,0.19), 0 2px 6px rgba(15,14,12,0.1); }
.bd-node:focus-visible { outline: 2px solid rgb(var(--bd-thread)); outline-offset: 3px; }
.bd-node.dragging {
  cursor: grabbing; z-index: 200; transition: none;
  opacity: 1; filter: blur(0);
  box-shadow: 0 24px 44px rgba(15,14,12,0.28);
}
.bd-node.in-frame { opacity: 0; pointer-events: none; }

.bd-plate {
  position: relative; width: 100%; height: 100%;
  border-radius: 9px; overflow: hidden;
  background: var(--bd-plate);
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: flex-end;
  padding: 11px 12px; gap: 2px;
}
.bd-plate img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; pointer-events: none; -webkit-user-drag: none;
}
.bd-plate::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(145deg, rgba(192,138,62,0.13), transparent 62%);
  pointer-events: none;
}
.bd-plate[data-tint="1"]::after { background: linear-gradient(145deg, rgba(90,120,150,0.15), transparent 62%); }
.bd-plate[data-tint="2"]::after { background: linear-gradient(145deg, rgba(120,140,100,0.15), transparent 62%); }
.bd-plate[data-tint="3"]::after { background: linear-gradient(145deg, rgba(150,110,110,0.14), transparent 62%); }
.bd-plate[data-tint="4"]::after { background: linear-gradient(145deg, rgba(120,110,145,0.15), transparent 62%); }

.bd-code {
  position: relative; font-family: var(--font-space-grotesk), ui-monospace, monospace;
  font-size: 15px; font-weight: 600; letter-spacing: .07em;
  color: var(--bd-ink);
}
.bd-meta {
  position: relative; font-size: 10.5px; letter-spacing: .13em;
  text-transform: uppercase; color: var(--bd-soft);
}
.bd-live {
  position: absolute; top: 10px; right: 10px;
  font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
  color: rgb(var(--bd-thread));
  border: 1px solid rgba(var(--bd-thread), .45);
  border-radius: 3px; padding: 1px 5px;
}
.bd-cap {
  position: absolute; left: 7px; bottom: -19px;
  font-size: 11.5px; font-weight: 500; color: var(--bd-soft);
  max-width: 94%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ---- the frame ---- */
.bd-frame-wrap {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(19vw, 248px); z-index: 10;
}
.bd-frame {
  position: relative; width: 100%; aspect-ratio: 1; border-radius: 17px;
  background: linear-gradient(155deg, var(--bd-card), var(--bd-plate));
  border: 1px solid var(--bd-edge);
  box-shadow: 0 18px 40px rgba(15,14,12,0.14), 0 2px 6px rgba(15,14,12,0.06);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; transition: box-shadow .25s; cursor: pointer;
}
.bd-frame.drag-over {
  box-shadow: 0 0 0 2.5px rgb(var(--bd-thread)), 0 18px 40px rgba(192,138,62,0.25);
}
.bd-frame-hint {
  font-size: 12.5px; line-height: 1.6; text-align: center;
  color: var(--bd-soft); padding: 14px; pointer-events: none;
}
.bd-frame-hint span { opacity: .65; }
.bd-frame-plate {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end;
  gap: 3px; padding: 16px;
  background: var(--bd-plate);
  opacity: 0; transform: scale(1.04);
  transition: opacity .35s, transform .35s;
}
.bd-frame-plate.show { opacity: 1; transform: scale(1); }
.bd-frame-plate img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bd-frame-plate::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(145deg, rgba(192,138,62,0.14), transparent 60%);
}
.bd-frame-code {
  position: relative; font-size: 21px; font-weight: 600; letter-spacing: .06em;
  color: var(--bd-ink);
}
.bd-frame-role { position: relative; font-size: 11.5px; color: var(--bd-soft); }

.bd-frame-cap {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
  padding: 9px 11px;
  background: linear-gradient(0deg, rgba(0,0,0,0.62), rgba(0,0,0,0));
  color: #fff; display: flex; align-items: flex-end; gap: 8px;
  opacity: 0; transform: translateY(6px);
  transition: opacity .3s, transform .3s;
}
.bd-frame-cap.show { opacity: 1; transform: translateY(0); }
.bd-frame-cap-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.bd-frame-cap-text {
  font-size: 12.5px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bd-frame-cap-meta { font-size: 10px; opacity: .78; }

.bd-eq { display: flex; align-items: flex-end; gap: 2px; height: 12px; flex: 0 0 auto; pointer-events: none; }
.bd-eq span { width: 2.5px; height: 3px; border-radius: 1px; background: #fff; opacity: .4; }
.bd-frame.playing .bd-eq span { opacity: 1; animation: bd-bounce .9s ease-in-out infinite; }
.bd-frame.playing .bd-eq span:nth-child(2) { animation-delay: .15s; }
.bd-frame.playing .bd-eq span:nth-child(3) { animation-delay: .3s; }
@keyframes bd-bounce { 0%,100% { height: 3px; } 50% { height: 11px; } }

.bd-frame-eject {
  flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%;
  background: rgba(255,255,255,0.22); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; cursor: pointer; border: 0; padding: 0;
}
.bd-frame-eject:hover { background: rgba(255,255,255,0.4); }

.bd-detail {
  margin-top: 13px; font-size: 12px; line-height: 1.65; text-align: center;
  color: var(--bd-soft);
  opacity: 0; transform: translateY(4px);
  transition: opacity .3s, transform .3s;
}
.bd-detail.show { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .bd-node { transition: opacity .2s; filter: none; }
  .bd-frame.playing .bd-eq span { animation: none; }
}
@media (max-width: 819px) {
  .bd-frame-wrap { width: min(44vw, 210px); }
}
`;
