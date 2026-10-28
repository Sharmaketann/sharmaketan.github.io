"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A badge on a lanyard, in WebGL.
 *
 * The model is a verlet particle system, not a rigid body on a joint chain.
 * That distinction is the whole thing: the card is a 5x7 lattice of particles
 * held in shape by distance constraints, so it bends, twists and leads with an
 * edge when it turns. A quaternion on a box can only ever slab around its
 * centre, which is what the first version did and why it read as a decal.
 *
 * Click the card and it turns over. The turn is not a tween — a click budgets
 * a few hundred steps of per-step push applied to the card's two sides along
 * its own face normal, so the near side swings out and the far side swings in.
 * Once the normal has gone past 90 degrees the push stops, the body is braked,
 * and the standing "face the viewer" pull finishes the rotation and holds the
 * back out. Momentum does the middle of the move, which is why it eases.
 *
 * Everything runs on a fixed timestep with an accumulator, so a 120Hz display
 * and a 60Hz one see identical motion.
 *
 * Loaded through next/dynamic with ssr:false, so three never enters the shared
 * bundle or any other route.
 */

// ── Tuning ──────────────────────────────────────────────────────────────────
// Units are world units and per-step deltas, not SI. The names are what each
// value is actually felt as.

const DT = 1 / 120;        // fixed physics step
const MAX_SUB = 8;         // substeps per frame before we stop catching up
const MAX_FRAME = 1 / 20;  // a long frame (tab wake, GC) is clamped to this

const GRAVITY = 34;        // swing period lands near 2.5s at this rope length
const DAMP = 0.9935;       // per-step velocity retention
const VMAX = 0.14;         // per-step displacement cap — nothing outruns the solver
const ITERS = 10;          // constraint passes

const ROPE_N = 11;
const SEG = 0.24;
/** Half the gap between the two runs where they leave the top of frame. */
const ANCHOR_SPREAD = 0.62;
const STRETCH = 0.9;       // webbing gives a little under load
const ROPE_BEND = 0.35;    // second-neighbour stiffness (0 = rope, 1 = rod)

const CARD_W = 1.95;
const CARD_H = 2.76;
const CARD_T = 0.05;
const CX = 5;              // lattice columns (odd, so there is a centre line)
const CY = 7;              // lattice rows
const CARD_BEND = 0.9;     // the card is a laminate, not cloth
const GAP = 0.19;          // clip to card slot

const FOLLOW = 0.22;       // the grab point's approach to the pointer
const HOLD = 0.55;         // the grab's stiffness — under 1 the hold has give
const THROW = 0.45;        // drag velocity surviving a release
const FACE = 0.009;        // per-step share of the facing error removed
const FACE_HELD = 0.4;     // kept while dragging, so a fast drag cannot tumble it
const TILT = 0.1;          // resting lean, so it is never dead flat to camera

const FLIP = 0.013;        // a click's per-step push on the card's sides
const FLIP_PAST = -0.15;   // normal . start that counts as over
const BRAKE = 0.5;         // speed kept once it is over
const FLIP_BUDGET = 300;   // steps — a turn can never run forever

// Both are per-step displacements, so they are accelerations of
// value / DT^2 — at a 1/120 step, 0.0013 would be 19 u/s^2 against gravity's
// 34, which parks the badge at a permanent 30-degree lean. Sized against
// gravity instead: a breeze worth about 5% of it, and a puff worth a nudge.
const BREEZE = 0.00012;    // a slow faint sway so it never dies
const PUFF = 0.0022;       // an occasional puff, every few seconds

const BAND_W = 0.46;
const BAND_N = 56;         // samples along the smoothed curve

const ANCHOR_Y = 2.9;

const BRASS = "#c08a3e";
const UP = "#1fa97a";

/** canvas letterSpacing ships in Chrome but is not in TS's DOM lib yet. */
type Ctx2D = CanvasRenderingContext2D & { letterSpacing: string };

const INK = "#17171a";
const MUTED = "#8b8880";
const RULE = "rgba(23,23,26,.14)";

/** The card stock, shared by both faces so they read as one object. */
function stock(x: Ctx2D, W: number, H: number) {
  const bg = x.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, "#f4f1ea");
  bg.addColorStop(0.55, "#ece8df");
  bg.addColorStop(1, "#e2ddd2");
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);

  // Punch slot. Same place on both faces, so it lines up through the card.
  x.fillStyle = "rgba(23,23,26,.82)";
  x.beginPath();
  x.roundRect(W / 2 - 54, 34, 108, 20, 10);
  x.fill();
}

function barcode(x: Ctx2D, left: number, baseline: number) {
  const heights = [26, 10, 32, 8, 20, 14, 30, 11, 18, 32, 8, 24, 14, 28, 10, 22, 32, 9, 19, 27];
  let bx = left;
  x.fillStyle = "rgba(23,23,26,.4)";
  heights.forEach((h, i) => {
    const w = i % 3 === 0 ? 6 : 3;
    x.fillRect(bx, baseline - h, w, h);
    bx += w + 5;
  });
}

const finish = (c: HTMLCanvasElement) => {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/**
 * The front: portrait, name, role, desk. Laid out centred on a cream card,
 * which is what gives it contrast against the black webbing.
 */
function makeFrontTexture(photo: HTMLImageElement | null): THREE.CanvasTexture {
  const W = 600;
  const H = 848;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")! as Ctx2D;

  stock(x, W, H);

  x.fillStyle = MUTED;
  x.font = "600 16px ui-monospace, monospace";
  x.letterSpacing = "3px";
  x.textBaseline = "alphabetic";
  x.fillText("DESK PASS", 42, 108);
  x.textAlign = "right";
  x.fillText("2026", W - 42, 108);
  x.textAlign = "left";
  x.fillStyle = RULE;
  x.fillRect(42, 126, W - 84, 1.5);

  // Portrait tile, centred
  const ts = 236;
  const tx = (W - ts) / 2;
  const ty = 178;
  x.save();
  x.beginPath();
  x.roundRect(tx, ty, ts, ts, 26);
  x.clip();
  if (photo) {
    const r = Math.max(ts / photo.width, ts / photo.height);
    const dw = photo.width * r;
    const dh = photo.height * r;
    x.drawImage(photo, tx + (ts - dw) / 2, ty + (ts - dh) / 2, dw, dh);
  } else {
    x.fillStyle = "#1d1d21";
    x.fillRect(tx, ty, ts, ts);
  }
  x.restore();
  x.strokeStyle = "rgba(23,23,26,.16)";
  x.lineWidth = 2;
  x.beginPath();
  x.roundRect(tx, ty, ts, ts, 26);
  x.stroke();

  x.textAlign = "center";
  x.fillStyle = INK;
  x.letterSpacing = "0px";
  x.font = "600 46px ui-sans-serif, system-ui, sans-serif";
  x.fillText("Sharma Ketan", W / 2, 506);
  x.fillStyle = MUTED;
  x.font = "20px ui-sans-serif, system-ui, sans-serif";
  x.fillText("Senior Backend Developer", W / 2, 540);

  x.fillStyle = BRASS;
  x.fillRect(W / 2 - 30, 568, 60, 2.5);

  const pairs: [string, string][] = [
    ["DESK", "Market Data"],
    ["BASED", "Mumbai"],
  ];
  pairs.forEach(([k, v], i) => {
    const cx = i === 0 ? 150 : W - 150;
    x.fillStyle = MUTED;
    x.font = "14px ui-monospace, monospace";
    x.letterSpacing = "2.5px";
    x.fillText(k, cx, 636);
    x.letterSpacing = "0px";
    x.fillStyle = INK;
    x.font = "20px ui-sans-serif, system-ui, sans-serif";
    x.fillText(v, cx, 664);
  });

  x.fillStyle = RULE;
  x.fillRect(42, 720, W - 84, 1.5);
  x.textAlign = "left";
  x.fillStyle = MUTED;
  x.font = "600 16px ui-monospace, monospace";
  x.letterSpacing = "3px";
  x.fillText("SK-2026-01", 42, 762);
  x.textAlign = "right";
  x.fillStyle = UP;
  x.fillText("ACTIVE", W - 42, 762);
  x.textAlign = "left";

  barcode(x, 42, 806);

  // The affordance. Without it nobody learns the card has a back.
  x.textAlign = "right";
  x.fillStyle = MUTED;
  x.font = "600 13px ui-monospace, monospace";
  x.letterSpacing = "2px";
  x.fillText("TURN OVER ↻", W - 42, 806);
  x.textAlign = "left";

  return finish(c);
}

/**
 * The back: what a real pass carries on the reverse — a mag stripe, the
 * holder's working detail, a signature strip and a return-to line.
 */
function makeBackTexture(): THREE.CanvasTexture {
  const W = 600;
  const H = 848;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")! as Ctx2D;

  stock(x, W, H);

  // Magnetic stripe
  const mag = x.createLinearGradient(0, 96, 0, 158);
  mag.addColorStop(0, "#26262b");
  mag.addColorStop(0.5, "#131316");
  mag.addColorStop(1, "#2b2b31");
  x.fillStyle = mag;
  x.fillRect(0, 96, W, 62);

  x.fillStyle = MUTED;
  x.font = "600 15px ui-monospace, monospace";
  x.letterSpacing = "3px";
  x.textBaseline = "alphabetic";
  x.fillText("AUTHORISED", 42, 200);
  x.textAlign = "right";
  x.fillStyle = UP;
  x.fillText("CLEARED", W - 42, 200);
  x.textAlign = "left";
  x.fillStyle = RULE;
  x.fillRect(42, 218, W - 84, 1.5);

  // Working detail — label left, value right, the way a pass prints it.
  const rows: [string, string][] = [
    ["RUNTIME", "Node · TypeScript"],
    ["SERVICES", "Python · REST"],
    ["STORES", "Mongo · Redis · ClickHouse"],
    ["FEEDS", "WebSocket"],
    ["ISSUED", "Jan 2026"],
  ];
  let y = 268;
  rows.forEach(([k, v]) => {
    x.fillStyle = MUTED;
    x.font = "13px ui-monospace, monospace";
    x.letterSpacing = "2.5px";
    x.textAlign = "left";
    x.fillText(k, 42, y);

    x.letterSpacing = "0px";
    x.fillStyle = INK;
    x.font = "19px ui-sans-serif, system-ui, sans-serif";
    x.textAlign = "right";
    x.fillText(v, W - 42, y);

    x.fillStyle = "rgba(23,23,26,.08)";
    x.fillRect(42, y + 16, W - 84, 1);
    y += 52;
  });
  x.textAlign = "left";
  x.letterSpacing = "0px";

  // Signature strip
  const sy = 556;
  x.fillStyle = "#fbfaf6";
  x.beginPath();
  x.roundRect(42, sy, W - 84, 86, 4);
  x.fill();
  x.strokeStyle = "rgba(23,23,26,.12)";
  x.lineWidth = 1.5;
  x.beginPath();
  x.roundRect(42, sy, W - 84, 86, 4);
  x.stroke();

  // A guilloche-ish wash, so the strip does not read as an empty box.
  x.save();
  x.beginPath();
  x.roundRect(42, sy, W - 84, 86, 4);
  x.clip();
  x.strokeStyle = "rgba(192,138,62,.17)";
  x.lineWidth = 1;
  for (let i = -90; i < W; i += 7) {
    x.beginPath();
    x.moveTo(i, sy);
    x.lineTo(i + 86, sy + 86);
    x.stroke();
  }
  x.restore();

  x.fillStyle = INK;
  x.font = "italic 34px ui-serif, Georgia, serif";
  x.fillText("Sharma Ketan", 64, sy + 56);
  x.fillStyle = MUTED;
  x.font = "600 11px ui-monospace, monospace";
  x.letterSpacing = "2px";
  x.fillText("HOLDER SIGNATURE", 64, sy + 76);
  x.letterSpacing = "0px";

  // Return-to
  x.fillStyle = MUTED;
  x.font = "15px ui-sans-serif, system-ui, sans-serif";
  x.fillText("If found, return to", 42, 684);
  x.fillStyle = INK;
  x.font = "600 17px ui-sans-serif, system-ui, sans-serif";
  x.fillText("sharmaketann.in", 42, 708);

  x.fillStyle = RULE;
  x.fillRect(42, 736, W - 84, 1.5);

  x.fillStyle = MUTED;
  x.font = "600 15px ui-monospace, monospace";
  x.letterSpacing = "2.5px";
  x.fillText("github.com/sharmaketann", 42, 772);

  x.textAlign = "right";
  x.fillText("SK-2026-01", W - 42, 772);
  x.textAlign = "left";

  barcode(x, 42, 816);

  return finish(c);
}

/** Repeating webbing — black strap with a light print, as in the reference. */
function makeBandTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 64;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")! as Ctx2D;

  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0e0e10");
  g.addColorStop(0.26, "#2b2b30");
  g.addColorStop(0.5, "#3a3a41");
  g.addColorStop(0.74, "#27272c");
  g.addColorStop(1, "#0b0b0d");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  x.strokeStyle = "rgba(255,255,255,.045)";
  x.lineWidth = 1;
  for (let i = 0; i < W; i += 3) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, H);
    x.stroke();
  }
  x.strokeStyle = "rgba(0,0,0,.3)";
  for (let i = -H; i < W; i += 9) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + H, H);
    x.stroke();
  }

  x.fillStyle = "rgba(255,255,255,.1)";
  x.fillRect(0, 3, W, 1);
  x.fillRect(0, H - 4, W, 1);

  x.fillStyle = "rgba(226,230,236,.5)";
  x.font = "600 15px ui-monospace, monospace";
  x.letterSpacing = "6px";
  x.textBaseline = "middle";
  x.fillText("SHARMAKETANN.IN", 30, H / 2 + 1);
  x.fillText("SHARMAKETANN.IN", 286, H / 2 + 1);

  const tex = finish(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * A studio in a 256x128 canvas: ground, horizon, sky, and two soft boxes.
 * Run through PMREM it gives the card's clearcoat something to reflect, which
 * is most of what separates "laminated plastic" from "flat image on a quad".
 */
function makeEnvTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const x = c.getContext("2d")!;

  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "#d7dadf");
  g.addColorStop(0.42, "#8e9299");
  g.addColorStop(0.55, "#4a4d52");
  g.addColorStop(1, "#141517");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 128);

  x.fillStyle = "#ffffff";
  x.fillRect(28, 12, 74, 26);
  x.fillStyle = "rgba(255,255,255,.65)";
  x.fillRect(168, 20, 52, 18);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface Particle {
  x: number; y: number; z: number;
  px: number; py: number; pz: number;
  /** inverse mass; 0 pins the particle */
  w: number;
}

interface Link { a: number; b: number; rest: number; k: number }

export default function Lanyard3D() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Scene ───────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const FOV = 32;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envSrc = makeEnvTexture();
    const envRT = pmrem.fromEquirectangular(envSrc);
    scene.environment = envRT.texture;
    envSrc.dispose();

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc08a3e, 0.7);
    rim.position.set(-4, 1, 2);
    scene.add(rim);

    // ── Particles ───────────────────────────────────────────────────────────
    // [0 .. ROPE_N)              left run of the strap, neck to clip
    // [ROPE_N .. 2*ROPE_N)       right run
    // [CARD0 .. CARD0 + N)       card lattice, row-major from the top-left
    // last                       the pointer, pinned, used only while dragging
    const N = CX * CY;
    const CARD0 = ROPE_N * 2;
    const PTR = CARD0 + N;
    const P: Particle[] = [];
    const push = (x: number, y: number, z: number, w: number) =>
      P.push({ x, y, z, px: x, py: y, pz: z, w });

    // The entrance. Everything starts deflected and twisted but at its correct
    // rest *lengths*, so no energy is injected by the first solve — the badge
    // simply swings and untwists into place over the first couple of seconds.
    const LEAN = 0.18;
    const TWIST = 0.45;

    // A lanyard is a loop, not a string. It passes over the neck well above
    // the frame and both runs converge on the clip, so the strap reads as an
    // open V. One band dropped from a point reads as a luggage tag.
    const ROPE_L = (ROPE_N - 1) * SEG;
    const CLIP_Y =
      ANCHOR_Y - Math.sqrt(Math.max(0.04, ROPE_L * ROPE_L - ANCHOR_SPREAD * ANCHOR_SPREAD));
    const anchors = [
      new THREE.Vector3(-ANCHOR_SPREAD, ANCHOR_Y, 0),
      new THREE.Vector3(ANCHOR_SPREAD, ANCHOR_Y, 0),
    ];
    for (const a of anchors) {
      for (let i = 0; i < ROPE_N; i++) {
        const t = i / (ROPE_N - 1);
        push(a.x - a.x * t + t * LEAN, a.y + (CLIP_Y - a.y) * t, 0, i === 0 ? 0 : 1);
      }
    }

    const ci = (i: number, j: number) => CARD0 + j * CX + i;
    const DX = CARD_W / (CX - 1);
    const DY = CARD_H / (CY - 1);
    /** Rest offsets from the card's slot, used by the turn and by snapping. */
    const rx = new Float32Array(N);
    const ry = new Float32Array(N);
    const topY = CLIP_Y - GAP;
    for (let j = 0; j < CY; j++) {
      for (let i = 0; i < CX; i++) {
        const ox = -CARD_W / 2 + i * DX;
        const oy = -j * DY;
        rx[j * CX + i] = ox;
        ry[j * CX + i] = oy;
        // Rotated about Y rather than squashed, so every rest length still
        // holds and the solver has nothing to snap back.
        push(LEAN + ox * Math.cos(TWIST), topY + oy, -ox * Math.sin(TWIST), 1);
      }
    }
    push(0, 0, 0, 0); // pointer

    // ── Constraints ─────────────────────────────────────────────────────────
    const cons: Link[] = [];
    const link = (a: number, b: number, k: number, rest?: number) => {
      const pa = P[a];
      const pb = P[b];
      cons.push({
        a, b, k,
        rest: rest ?? Math.hypot(pb.x - pa.x, pb.y - pa.y, pb.z - pa.z),
      });
    };

    for (let s = 0; s < 2; s++) {
      const b = s * ROPE_N;
      for (let i = 0; i < ROPE_N - 1; i++) link(b + i, b + i + 1, STRETCH, SEG);
      for (let i = 0; i < ROPE_N - 2; i++) link(b + i, b + i + 2, ROPE_BEND, SEG * 2);
    }

    // The two runs meet. Rest length 0, so they are one point at the clip and
    // the load from the card is shared back up both sides.
    link(ROPE_N - 1, ROPE_N * 2 - 1, 1, 0);

    // The clip. One point of attachment, so the badge can swivel like a badge.
    link(ROPE_N - 1, ci((CX - 1) / 2, 0), 1, GAP);

    // The card. Structural, shear and second-neighbour bend: enough to behave
    // as a laminate that gives slightly, rather than as cloth.
    for (let j = 0; j < CY; j++) {
      for (let i = 0; i < CX; i++) {
        if (i < CX - 1) link(ci(i, j), ci(i + 1, j), 1, DX);
        if (j < CY - 1) link(ci(i, j), ci(i, j + 1), 1, DY);
        if (i < CX - 1 && j < CY - 1) {
          const diag = Math.hypot(DX, DY);
          link(ci(i, j), ci(i + 1, j + 1), 1, diag);
          link(ci(i + 1, j), ci(i, j + 1), 1, diag);
        }
        if (i < CX - 2) link(ci(i, j), ci(i + 2, j), CARD_BEND, DX * 2);
        if (j < CY - 2) link(ci(i, j), ci(i, j + 2), CARD_BEND, DY * 2);
      }
    }

    /** Added to the solve only while a drag is live. */
    let dragLink: Link | null = null;

    // ── Card geometry ───────────────────────────────────────────────────────
    // Front sheet, back sheet, and a rim joining their borders, so the card is
    // a solid with a visible edge. Seen edge-on mid-turn, two floating planes
    // would read as a glitch.
    const ring: number[] = [];
    for (let i = 0; i < CX; i++) ring.push(i);
    for (let j = 1; j < CY; j++) ring.push(j * CX + (CX - 1));
    for (let i = CX - 2; i >= 0; i--) ring.push((CY - 1) * CX + i);
    for (let j = CY - 2; j >= 1; j--) ring.push(j * CX);
    const R = ring.length;

    const VCOUNT = 2 * N + 2 * R;
    const vpos = new Float32Array(VCOUNT * 3);
    const vnrm = new Float32Array(VCOUNT * 3);
    const vuv = new Float32Array(VCOUNT * 2);

    for (let j = 0; j < CY; j++) {
      for (let i = 0; i < CX; i++) {
        const k = j * CX + i;
        const u = i / (CX - 1);
        const v = 1 - j / (CY - 1);
        vuv[k * 2] = u;
        vuv[k * 2 + 1] = v;
        // Mirrored, so the back print reads the right way round from behind.
        vuv[(N + k) * 2] = 1 - u;
        vuv[(N + k) * 2 + 1] = v;
      }
    }

    const idx: number[] = [];
    for (let j = 0; j < CY - 1; j++) {
      for (let i = 0; i < CX - 1; i++) {
        const a = j * CX + i;
        const b = a + 1;
        const c = a + CX;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const frontCount = idx.length;
    for (let j = 0; j < CY - 1; j++) {
      for (let i = 0; i < CX - 1; i++) {
        const a = N + j * CX + i;
        const b = a + 1;
        const c = a + CX;
        const d = c + 1;
        idx.push(b, c, a, d, c, b);
      }
    }
    const backCount = idx.length - frontCount;
    const RF = 2 * N;
    const RB = 2 * N + R;
    for (let k = 0; k < R; k++) {
      const n = (k + 1) % R;
      idx.push(RF + k, RF + n, RB + n, RF + k, RB + n, RB + k);
    }
    const rimCount = idx.length - frontCount - backCount;

    const cardGeo = new THREE.BufferGeometry();
    cardGeo.setAttribute("position", new THREE.BufferAttribute(vpos, 3));
    cardGeo.setAttribute("normal", new THREE.BufferAttribute(vnrm, 3));
    cardGeo.setAttribute("uv", new THREE.BufferAttribute(vuv, 2));
    cardGeo.setIndex(idx);
    cardGeo.addGroup(0, frontCount, 0);
    cardGeo.addGroup(frontCount, backCount, 1);
    cardGeo.addGroup(frontCount + backCount, rimCount, 2);

    const faceMat = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.45,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.55,
      });

    const frontTex = makeFrontTexture(null);
    const backTex = makeBackTexture();
    const cardMats = [
      faceMat(frontTex),
      faceMat(backTex),
      new THREE.MeshStandardMaterial({
        color: 0xd2ccbf,
        roughness: 0.62,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    ];
    const card = new THREE.Mesh(cardGeo, cardMats);
    card.frustumCulled = false;
    scene.add(card);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const m = cardMats[0] as THREE.MeshPhysicalMaterial;
      m.map?.dispose();
      m.map = makeFrontTexture(img);
      m.needsUpdate = true;
    };
    img.src = "/_static/me1.jpg";

    // ── Straps ──────────────────────────────────────────────────────────────
    // Two of them, same webbing, built by the same factory. Each is its own
    // Catmull-Rom ribbon so the two runs can twist independently - which they
    // do, because the card turning drags one side forward and the other back.
    const bandTex = makeBandTexture();
    const bandMat = new THREE.MeshStandardMaterial({
      map: bandTex,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.06,
      envMapIntensity: 0.4,
    });

    interface Strap {
      curve: THREE.CatmullRomCurve3;
      geo: THREE.BufferGeometry;
      pos: Float32Array;
      nor: Float32Array;
      uv: Float32Array;
      mesh: THREE.Mesh;
    }

    const makeStrap = (): Strap => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: ROPE_N }, () => new THREE.Vector3()),
      );
      curve.curveType = "chordal";

      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(BAND_N * 2 * 3);
      const nor = new Float32Array(BAND_N * 2 * 3);
      const uv = new Float32Array(BAND_N * 2 * 2);
      const ix: number[] = [];
      for (let i = 0; i < BAND_N - 1; i++) {
        const a = i * 2;
        ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      geo.setIndex(ix);

      const mesh = new THREE.Mesh(geo, bandMat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { curve, geo, pos, nor, uv, mesh };
    };

    const straps: Strap[] = [makeStrap(), makeStrap()];

    // ── Clip ────────────────────────────────────────────────────────────────
    const clip = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0xb9bfc7, roughness: 0.26, metalness: 1, envMapIntensity: 1.1,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.07), metal);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.055), metal);
    stem.position.y = -0.17;
    clip.add(body, stem);
    scene.add(clip);

    // ── Working vectors ─────────────────────────────────────────────────────
    const nrm = new THREE.Vector3(0, 0, 1);      // card face normal
    const cen = new THREE.Vector3();             // card centre
    const right = new THREE.Vector3();
    const upv = new THREE.Vector3();
    const target = new THREE.Vector3();
    const qTo = new THREE.Quaternion();
    const qStep = new THREE.Quaternion();
    const qId = new THREE.Quaternion();
    const tmp = new THREE.Vector3();
    const pt = new THREE.Vector3();
    const nxt = new THREE.Vector3();
    const prevPt = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const bn = new THREE.Vector3();
    const side = new THREE.Vector3();
    const DEF_N = new THREE.Vector3(0, 0, 1);
    const basis = new THREE.Matrix4();

    const cardBasis = () => {
      cen.set(0, 0, 0);
      for (let k = 0; k < N; k++) {
        const p = P[CARD0 + k];
        cen.x += p.x; cen.y += p.y; cen.z += p.z;
      }
      cen.multiplyScalar(1 / N);

      const midRow = (CY - 1) >> 1;
      const midCol = (CX - 1) >> 1;
      const a = P[ci(CX - 1, midRow)];
      const b = P[ci(0, midRow)];
      right.set(a.x - b.x, a.y - b.y, a.z - b.z).normalize();
      const t = P[ci(midCol, 0)];
      const u = P[ci(midCol, CY - 1)];
      upv.set(t.x - u.x, t.y - u.y, t.z - u.z).normalize();
      nrm.crossVectors(right, upv).normalize();
    };

    // ── Turn ────────────────────────────────────────────────────────────────
    let flipSteps = 0;
    let flipDir = 1;
    const flipStart = new THREE.Vector3();

    const snapTo = (sgn: number) => {
      // Motion-free turn, for reduced-motion users: rebuild the lattice flat
      // in the requested orientation and zero its velocity.
      cardBasis();
      for (let k = 0; k < N; k++) {
        const p = P[CARD0 + k];
        p.x = cen.x + rx[k] * sgn;
        p.y = cen.y + ry[k] + CARD_H / 2;
        p.z = cen.z;
        p.px = p.x; p.py = p.y; p.pz = p.z;
      }
    };

    const startFlip = (dir: number) => {
      if (reduce) {
        cardBasis();
        snapTo(nrm.z >= 0 ? -1 : 1);
        return;
      }
      if (flipSteps > 0) return;
      cardBasis();
      flipStart.copy(nrm);
      flipDir = dir;
      flipSteps = FLIP_BUDGET;
    };

    // ── Interaction ─────────────────────────────────────────────────────────
    // The canvas hangs over the page, so it must never swallow clicks: it is
    // pointer-events:none and the listeners live on window instead, picking
    // the card by raycast. Anything that is not the card passes straight
    // through to the links and buttons underneath.
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hitPt = new THREE.Vector3();
    const want = new THREE.Vector3();
    let hovering = false;
    let downAt = 0;
    let downX = 0;
    let downY = 0;
    let moved = 0;
    let pressed = false;

    const toNdc = (e: PointerEvent): boolean => {
      const r = renderer.domElement.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        return false;
      }
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      return true;
    };

    const pickCard = (e: PointerEvent): THREE.Intersection | null => {
      if (!toNdc(e)) return null;
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObject(card, false);
      return hits.length ? hits[0] : null;
    };

    const setCursor = (v: boolean) => {
      if (v === hovering) return;
      hovering = v;
      document.body.style.cursor = v ? "grab" : "";
    };

    const onDown = (e: PointerEvent) => {
      const hit = pickCard(e);
      if (!hit) return;

      pressed = true;
      downAt = performance.now();
      downX = e.clientX;
      downY = e.clientY;
      moved = 0;

      if (!reduce) {
        // Grab the lattice particle nearest the hit and tie the pointer to it
        // with a soft link, so the hold has give.
        let best = -1;
        let bestD = Infinity;
        for (let k = 0; k < N; k++) {
          const p = P[CARD0 + k];
          const d = (p.x - hit.point.x) ** 2 + (p.y - hit.point.y) ** 2 + (p.z - hit.point.z) ** 2;
          if (d < bestD) { bestD = d; best = CARD0 + k; }
        }
        const pp = P[PTR];
        pp.x = hit.point.x; pp.y = hit.point.y; pp.z = 0;
        pp.px = pp.x; pp.py = pp.y; pp.pz = pp.z;
        want.set(pp.x, pp.y, pp.z);
        dragLink = { a: best, b: PTR, rest: 0, k: HOLD };
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (!pressed) {
        if (!reduce) setCursor(!!pickCard(e));
        return;
      }
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
      if (!toNdc(e)) return;
      ray.setFromCamera(ptr, camera);
      if (ray.ray.intersectPlane(dragPlane, hitPt)) want.copy(hitPt);
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (!pressed) return;
      pressed = false;

      const quick = performance.now() - downAt < 400 && moved < 6;
      if (dragLink) {
        dragLink = null;
        // Keep a share of the drag velocity, so a release throws.
        for (let k = 0; k < N; k++) {
          const p = P[CARD0 + k];
          p.px = p.x - (p.x - p.px) * THROW;
          p.py = p.y - (p.y - p.py) * THROW;
          p.pz = p.z - (p.z - p.pz) * THROW;
        }
      }
      if (quick) {
        // Turn away from the side that was clicked, which is how a real card
        // behaves when you flick its edge.
        cardBasis();
        const hit = pickCard(e);
        let dir = 1;
        if (hit) {
          tmp.subVectors(hit.point, cen);
          dir = tmp.dot(right) >= 0 ? 1 : -1;
        }
        startFlip(dir);
      }
      hovering = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // ── Simulation ──────────────────────────────────────────────────────────
    const G = GRAVITY * DT * DT;
    let clock = 0;
    let puffIn = 2.5;

    const integrate = () => {
      clock += DT;
      const breezeX = Math.sin(clock * 0.73) * BREEZE;
      const breezeZ = Math.cos(clock * 0.41) * BREEZE * 0.7;

      let puffX = 0;
      let puffZ = 0;
      puffIn -= DT;
      if (puffIn <= 0) {
        puffIn = 3 + Math.random() * 7;
        puffX = (Math.random() - 0.5) * PUFF;
        puffZ = (Math.random() - 0.5) * PUFF;
      }

      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        if (!p.w) { p.px = p.x; p.py = p.y; p.pz = p.z; continue; }
        let vx = (p.x - p.px) * DAMP;
        let vy = (p.y - p.py) * DAMP;
        let vz = (p.z - p.pz) * DAMP;
        const sp = Math.hypot(vx, vy, vz);
        if (sp > VMAX) { const s = VMAX / sp; vx *= s; vy *= s; vz *= s; }
        p.px = p.x; p.py = p.y; p.pz = p.z;
        p.x += vx + breezeX + puffX;
        p.y += vy - G;
        p.z += vz + breezeZ + puffZ;
      }
    };

    const solveLink = (c: Link) => {
      const a = P[c.a];
      const b = P[c.b];
      const ws = a.w + b.w;
      if (ws === 0) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 1e-9) return;
      const f = ((d - c.rest) / d) * c.k;
      const fa = (a.w / ws) * f;
      const fb = (b.w / ws) * f;
      a.x += dx * fa; a.y += dy * fa; a.z += dz * fa;
      b.x -= dx * fb; b.y -= dy * fb; b.z -= dz * fb;
    };

    const solve = () => {
      for (let k = 0; k < ITERS; k++) {
        // Alternating sweep direction. A one-way Gauss-Seidel pass propagates
        // the load one link per iteration, so the strap visibly stretches
        // under the card; sweeping both ways reaches the anchor in half the
        // passes for the same cost.
        if (k & 1) {
          for (let i = cons.length - 1; i >= 0; i--) solveLink(cons[i]);
        } else {
          for (let i = 0; i < cons.length; i++) solveLink(cons[i]);
        }
        if (dragLink) solveLink(dragLink);
      }
    };

    const turnAndFace = () => {
      cardBasis();

      if (flipSteps > 0) {
        flipSteps--;
        if (nrm.dot(flipStart) < FLIP_PAST) {
          // Over the top. Brake, and let the facing pull land it.
          flipSteps = 0;
          for (let k = 0; k < N; k++) {
            const p = P[CARD0 + k];
            p.px = p.x - (p.x - p.px) * BRAKE;
            p.py = p.y - (p.y - p.py) * BRAKE;
            p.pz = p.z - (p.z - p.pz) * BRAKE;
          }
        } else {
          for (let k = 0; k < N; k++) {
            const s = Math.sign(rx[k]) * flipDir;
            if (!s) continue;
            const p = P[CARD0 + k];
            p.x += nrm.x * s * FLIP;
            p.y += nrm.y * s * FLIP;
            p.z += nrm.z * s * FLIP;
          }
          return; // the facing pull would only fight the push
        }
      }

      // Face the viewer, whichever side is currently out. Because the target
      // follows the sign of the current normal, the same pull that holds the
      // front out also holds the back out once the card is over.
      const sgn = nrm.z >= 0 ? 1 : -1;
      target.set(0, TILT * sgn, sgn).normalize();
      const k = dragLink ? FACE * FACE_HELD : FACE;
      qTo.setFromUnitVectors(nrm, target);
      qStep.copy(qId).slerp(qTo, k);

      for (let i = 0; i < N; i++) {
        const p = P[CARD0 + i];
        tmp.set(p.x - cen.x, p.y - cen.y, p.z - cen.z).applyQuaternion(qStep);
        p.x = cen.x + tmp.x;
        p.y = cen.y + tmp.y;
        p.z = cen.z + tmp.z;
      }
    };

    const step = () => {
      for (let s2 = 0; s2 < 2; s2++) {
        const a = anchors[s2];
        const p = P[s2 * ROPE_N];
        p.x = a.x; p.y = a.y; p.z = a.z;
      }
      integrate();
      if (dragLink) {
        // The pointer particle approaches the cursor rather than teleporting
        // to it. That one lerp is most of the difference between a hand and
        // a magnet.
        const pp = P[PTR];
        pp.x += (want.x - pp.x) * FOLLOW;
        pp.y += (want.y - pp.y) * FOLLOW;
        pp.z += (want.z - pp.z) * FOLLOW;
      }
      solve();
      turnAndFace();
    };

    // ── Mesh building ───────────────────────────────────────────────────────
    const lat = (i: number, j: number) => P[ci(Math.min(CX - 1, Math.max(0, i)), Math.min(CY - 1, Math.max(0, j)))];
    const nx = new Float32Array(N);
    const ny = new Float32Array(N);
    const nz = new Float32Array(N);

    const buildCard = () => {
      // Mid-surface normals from the lattice, then offset front and back by
      // half the card's thickness along them.
      for (let j = 0; j < CY; j++) {
        for (let i = 0; i < CX; i++) {
          const k = j * CX + i;
          const a = lat(i + 1, j);
          const b = lat(i - 1, j);
          const t = lat(i, j - 1);
          const u = lat(i, j + 1);
          right.set(a.x - b.x, a.y - b.y, a.z - b.z);
          upv.set(t.x - u.x, t.y - u.y, t.z - u.z);
          tmp.crossVectors(right, upv);
          if (tmp.lengthSq() < 1e-12) tmp.set(0, 0, 1); else tmp.normalize();
          nx[k] = tmp.x; ny[k] = tmp.y; nz[k] = tmp.z;
        }
      }

      const h = CARD_T / 2;
      for (let k = 0; k < N; k++) {
        const p = P[CARD0 + k];
        const f = k * 3;
        const b = (N + k) * 3;
        vpos[f] = p.x + nx[k] * h;
        vpos[f + 1] = p.y + ny[k] * h;
        vpos[f + 2] = p.z + nz[k] * h;
        vnrm[f] = nx[k]; vnrm[f + 1] = ny[k]; vnrm[f + 2] = nz[k];

        vpos[b] = p.x - nx[k] * h;
        vpos[b + 1] = p.y - ny[k] * h;
        vpos[b + 2] = p.z - nz[k] * h;
        vnrm[b] = -nx[k]; vnrm[b + 1] = -ny[k]; vnrm[b + 2] = -nz[k];
      }

      for (let r = 0; r < R; r++) {
        const k = ring[r];
        const p = P[CARD0 + k];
        // Outward: away from the card centre, flattened into the card plane.
        tmp.set(p.x - cen.x, p.y - cen.y, p.z - cen.z);
        const dot = tmp.x * nx[k] + tmp.y * ny[k] + tmp.z * nz[k];
        tmp.x -= nx[k] * dot; tmp.y -= ny[k] * dot; tmp.z -= nz[k] * dot;
        if (tmp.lengthSq() < 1e-12) tmp.set(0, -1, 0); else tmp.normalize();

        const f = (RF + r) * 3;
        const b = (RB + r) * 3;
        const kf = k * 3;
        const kb = (N + k) * 3;
        vpos[f] = vpos[kf]; vpos[f + 1] = vpos[kf + 1]; vpos[f + 2] = vpos[kf + 2];
        vpos[b] = vpos[kb]; vpos[b + 1] = vpos[kb + 1]; vpos[b + 2] = vpos[kb + 2];
        vnrm[f] = tmp.x; vnrm[f + 1] = tmp.y; vnrm[f + 2] = tmp.z;
        vnrm[b] = tmp.x; vnrm[b + 1] = tmp.y; vnrm[b + 2] = tmp.z;
      }

      cardGeo.attributes.position.needsUpdate = true;
      cardGeo.attributes.normal.needsUpdate = true;
      cardGeo.computeBoundingSphere();
    };

    const buildStrap = (st: Strap, base: number) => {
      for (let i = 0; i < ROPE_N; i++) {
        const p = P[base + i];
        st.curve.points[i].set(p.x, p.y, p.z);
      }

      let arc = 0;
      for (let i = 0; i < BAND_N; i++) {
        const t = i / (BAND_N - 1);
        st.curve.getPoint(t, pt);
        st.curve.getPoint(Math.min(1, t + 0.01), nxt);
        tan.subVectors(nxt, pt);
        if (tan.lengthSq() < 1e-12) tan.set(0, -1, 0); else tan.normalize();
        if (i > 0) arc += pt.distanceTo(prevPt);
        prevPt.copy(pt);

        // The strap's own twist: flat to camera at the neck, turning into the
        // card's plane over the lower stretch. When the card turns over, the
        // sign flips with it and the twist runs the other way, which is what
        // sells the whole move.
        const a = THREE.MathUtils.smoothstep(t, 0.3, 1);
        const o = nrm.z < 0 ? -a : a;
        bn.copy(DEF_N).multiplyScalar(1 - a).addScaledVector(nrm, o);
        bn.addScaledVector(tan, -bn.dot(tan));
        if (bn.lengthSq() < 1e-12) bn.copy(DEF_N); else bn.normalize();
        side.crossVectors(tan, bn).normalize();

        const k = i * 6;
        const hw = BAND_W / 2;
        st.pos[k] = pt.x - side.x * hw;
        st.pos[k + 1] = pt.y - side.y * hw;
        st.pos[k + 2] = pt.z - side.z * hw;
        st.pos[k + 3] = pt.x + side.x * hw;
        st.pos[k + 4] = pt.y + side.y * hw;
        st.pos[k + 5] = pt.z + side.z * hw;
        st.nor[k] = st.nor[k + 3] = bn.x;
        st.nor[k + 1] = st.nor[k + 4] = bn.y;
        st.nor[k + 2] = st.nor[k + 5] = bn.z;

        // UVs run off accumulated arc length, so the webbing print neither
        // stretches nor crawls as the strap takes up load.
        // v runs 1 -> 0 from the first vertex to the second. The first vertex
        // is on the strap's right, and uv-v grows *up* the image, so putting
        // v=0 there would map the print's up-direction to screen-left: a
        // reflection, not a rotation, and the webbing print comes out
        // mirrored. This way round it is a clean quarter turn.
        const v = arc / (BAND_W * 4);
        st.uv[i * 4] = v; st.uv[i * 4 + 1] = 1;
        st.uv[i * 4 + 2] = v; st.uv[i * 4 + 3] = 0;
      }
      st.geo.attributes.position.needsUpdate = true;
      st.geo.attributes.normal.needsUpdate = true;
      st.geo.attributes.uv.needsUpdate = true;
    };

    const buildStraps = () => {
      buildStrap(straps[0], 0);
      buildStrap(straps[1], ROPE_N);

      // The clip sits where the two runs meet, and points back up the strap
      // from the card's slot. Taking its axis from the card rather than from
      // either curve's tangent keeps it steady: the two tangents disagree by
      // the full angle of the V, so picking one made it twitch.
      const endA = P[ROPE_N - 1];
      const endB = P[ROPE_N * 2 - 1];
      clip.position.set(
        (endA.x + endB.x) / 2,
        (endA.y + endB.y) / 2,
        (endA.z + endB.z) / 2,
      );

      const slot = P[ci((CX - 1) / 2, 0)];
      upv.set(
        clip.position.x - slot.x,
        clip.position.y - slot.y,
        clip.position.z - slot.z,
      );
      if (upv.lengthSq() < 1e-12) upv.set(0, 1, 0); else upv.normalize();
      bn.copy(nrm).addScaledVector(upv, -nrm.dot(upv));
      if (bn.lengthSq() < 1e-12) bn.copy(DEF_N); else bn.normalize();
      side.crossVectors(upv, bn).normalize();
      basis.makeBasis(side, upv, bn);
      clip.quaternion.setFromRotationMatrix(basis);
    };

    // ── Frame ───────────────────────────────────────────────────────────────
    let acc = 0;
    let lastT = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastT) / 1000, MAX_FRAME);
      lastT = now;
      if (document.hidden) { acc = 0; return; }

      if (!reduce) {
        acc += dt;
        let n = 0;
        while (acc >= DT && n < MAX_SUB) { step(); acc -= DT; n++; }
        if (n === MAX_SUB) acc = 0;
      } else {
        cardBasis();
      }

      buildCard();
      buildStraps();
      renderer.render(scene, camera);
    };

    const onVisible = () => { acc = 0; lastT = performance.now(); };
    document.addEventListener("visibilitychange", onVisible);

    // ── Theme ───────────────────────────────────────────────────────────────
    // next-themes writes the class on <html>. The badge sits over the page, so
    // it has to sit right on both grounds.
    const applyTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      ambient.intensity = dark ? 0.5 : 0.78;
      key.intensity = dark ? 1.7 : 2.1;
      renderer.toneMappingExposure = dark ? 1.02 : 1.14;
    };
    applyTheme();
    const themeObs = new MutationObserver(applyTheme);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // ── Resize ──────────────────────────────────────────────────────────────
    const tanHalf = Math.tan((FOV * Math.PI) / 360);
    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;

      // Frame the whole assembly when there is room. When there is not — a
      // short container on a phone — frame the card instead and let the strap
      // run off the top, rather than shrinking the badge to a stamp.
      const bottom = CLIP_Y - GAP - CARD_H;
      const fit = (spanY: number, spanX: number, centreY: number) => {
        const z = Math.max(spanY / (2 * tanHalf), spanX / (2 * tanHalf * aspect)) * 1.01;
        camera.position.set(0, centreY, z);
        return z;
      };

      // The strap runs off the top edge rather than floating below it, the
      // way it does when a pass is hung on something above the window.
      const top = ANCHOR_Y + 0.06;
      const bot = bottom - 0.3;
      let z = fit(top - bot, CARD_W * 1.3, (top + bot) / 2);
      const cardFrac = CARD_W / (2 * z * tanHalf * aspect);
      if (cardFrac < 0.42) {
        fit(CARD_H * 1.45, CARD_W * 1.3, bottom + CARD_H / 2);
      }
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      cardGeo.dispose();
      straps.forEach((st) => { st.geo.dispose(); scene.remove(st.mesh); });
      bandMat.dispose();
      bandTex.dispose();
      cardMats.forEach((m) => {
        const mm = m as THREE.MeshStandardMaterial;
        mm.map?.dispose();
        mm.dispose();
      });
      metal.dispose();
      body.geometry.dispose();
      stem.geometry.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="w-full h-full" aria-hidden />;
}
