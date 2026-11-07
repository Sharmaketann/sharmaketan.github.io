"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * A manila folder you open to get at the board.
 *
 * Three leaves fan up out of a pocket while the front flap tips away from you.
 * The whole effect is one perspective container, a `rotateX` on the flap, and
 * three springs with staggered delays — no 3D library, because nothing here
 * needs a camera.
 *
 * The flap is an SVG path rather than a rounded rectangle so it keeps the
 * stepped tab along the top edge that makes a folder read as a folder.
 */

const W = 321;
const H = 270;
/** The flap is shorter than the folder so the leaves show above it. */
const FLAP_H = 241;

/** The tab outline: along the top, in 25px from the corner, then the step. */
const TAB_PATH =
  "M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z";

/**
 * Rest / hover / open, for each of the three leaves.
 *
 * The delays are deliberately out of order: on opening, the back leaf leads
 * and the front one trails, which reads as the stack being lifted rather than
 * as three things moving at once.
 */
const LEAVES = [
  { y: [-10, -30, -160], x: [40, 40, 70], rot: [10, 14, 18], delay: [0, 0.12, 0.1] },
  { y: [-20, -35, -180], x: [3, 3, 0], rot: [2, -1, -3], delay: [0, 0.06, 0.05] },
  { y: [-22, -44, -170], x: [-40, -40, -65], rot: [-5, -9, -14], delay: [0, 0, 0] },
] as const;

export interface Leaf {
  label: string;
  sub: string;
}

export function Folder({
  leaves,
  scale = 0.72,
  children,
}: {
  /** Three labels for the three visible leaves. */
  leaves: [Leaf, Leaf, Leaf];
  scale?: number;
  /** What the folder contains. Mounted only once it is open. */
  children: (close: () => void) => React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  // Lock the page behind the overlay, and give Escape to the reader. Restores
  // whatever overflow was there before rather than assuming it was "visible".
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const phase = open ? 2 : hover ? 1 : 0;

  return (
    <>
      <div
        className="relative select-none"
        style={{ width: W * scale, height: H * scale }}
      >
        <button
          type="button"
          className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c08a3e]"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          onClick={() => setOpen(true)}
          aria-label="Open the board"
        >
          <span
            className="absolute top-1/2 left-1/2 block"
            style={{
              width: W,
              height: H,
              transform: `translate(-50%, -50%) scale(${scale})`,
              perspective: 800 * scale,
            }}
          >
            {/* The pocket the leaves sit in. */}
            <span
              className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2"
              style={{
                width: W,
                height: H,
                borderRadius: 25,
                background: "var(--fold-back)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)",
              }}
            />

            {/* Leaves. */}
            <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              {LEAVES.map((l, i) => (
                <motion.span
                  key={i}
                  className="absolute block"
                  animate={{ y: l.y[phase], x: l.x[phase], rotate: l.rot[phase] }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 13,
                    delay: l.delay[phase],
                  }}
                >
                  <LeafCard leaf={leaves[i]} />
                </motion.span>
              ))}
            </span>

            {/* Front flap. */}
            <motion.span
              className="absolute block"
              style={{
                top: 16,
                left: 1,
                transformOrigin: "bottom center",
                transformStyle: "preserve-3d",
                width: W,
                height: FLAP_H,
              }}
              animate={{ rotateX: phase === 2 ? -55 : phase === 1 ? -45 : -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
            >
              {/* Frosted panel, clipped to the tab outline, so the leaves show
                  through the flap as blurred shapes rather than vanishing. */}
              <span
                className="absolute inset-0 block"
                style={{
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  clipPath: `path('${TAB_PATH}')`,
                  WebkitClipPath: `path('${TAB_PATH}')`,
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  willChange: "transform",
                }}
              />
              <svg
                className="absolute inset-0"
                width={W}
                height={FLAP_H}
                viewBox={`0 0 ${W} ${FLAP_H}`}
                fill="none"
                aria-hidden="true"
              >
                <path d={TAB_PATH} fill="var(--fold-flap)" fillOpacity="0.96" />
                <path d={TAB_PATH} stroke="var(--fold-edge)" />
              </svg>
              <span
                className="absolute font-medium tracking-[0.16em] uppercase"
                style={{ left: 26, bottom: 22, fontSize: 11, color: "var(--fold-ink)" }}
              >
                The board
              </span>
              <span
                className="absolute"
                style={{ left: 26, bottom: 6, fontSize: 10.5, color: "var(--fold-soft)" }}
              >
                click to open
              </span>
            </motion.span>
          </span>
        </button>

        <style>{FOLDER_CSS}</style>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[120]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            role="dialog"
            aria-modal="true"
            aria-label="The board"
          >
            <div className="absolute inset-0 bg-[#f4f2ed] dark:bg-[#0c0d0f]" />
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 0.985, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.99, opacity: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
            >
              {children(() => setOpen(false))}
            </motion.div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 z-[130] rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300 backdrop-blur hover:border-[#c08a3e] hover:text-[#c08a3e] transition-colors"
            >
              Close · esc
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LeafCard({ leaf }: { leaf: Leaf }) {
  return (
    <span
      className="flex flex-col justify-end"
      style={{
        width: 196,
        height: 150,
        borderRadius: 11,
        background: "var(--fold-leaf)",
        border: "1px solid var(--fold-edge)",
        boxShadow: "0 6px 16px rgba(15,14,12,0.14)",
        padding: "0 13px 12px",
      }}
    >
      <span
        className="block font-medium"
        style={{ fontSize: 12.5, color: "var(--fold-ink)" }}
      >
        {leaf.label}
      </span>
      <span
        className="block uppercase tracking-[0.14em]"
        style={{ fontSize: 9.5, color: "var(--fold-soft)", marginTop: 2 }}
      >
        {leaf.sub}
      </span>
    </span>
  );
}

const FOLDER_CSS = `
:root {
  --fold-back: #e3dfd4;
  --fold-flap: #eae6dc;
  --fold-leaf: #fbfaf7;
  --fold-edge: rgba(27,24,19,0.13);
  --fold-ink: #3a352c;
  --fold-soft: #8a8477;
}
.dark {
  --fold-back: #202225;
  --fold-flap: #272a2e;
  --fold-leaf: #15171a;
  --fold-edge: rgba(255,255,255,0.10);
  --fold-ink: #ddd9d1;
  --fold-soft: #8b8678;
}
`;
