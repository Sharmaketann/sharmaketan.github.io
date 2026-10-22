"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A badge on a lanyard, in WebGL.
 *
 * three.js does the rendering — perspective, lights, a real ribbon mesh that
 * twists, and a card textured from a canvas I draw the badge into. The physics
 * is a verlet rope solved here rather than pulling in a full physics engine:
 * a rope with distance constraints is a hundred lines, and rapier would add
 * another megabyte of WASM for the same visible result.
 *
 * The card face is drawn once into a 2D canvas and uploaded as a texture, so
 * the badge artwork is ordinary canvas drawing rather than DOM in 3D space.
 *
 * Loaded through next/dynamic with ssr:false, so three never enters the shared
 * bundle or any other route.
 */

const SEG = 12;              // rope points
const SEG_LEN = 0.24;        // world units between points
const GRAVITY = -0.0062;
const DAMP = 0.94;
const ITER = 18;

const CARD_W = 1.95;
const CARD_H = 2.76;
const CARD_T = 0.045;
const BAND_W = 0.21;

/** canvas letterSpacing ships in Chrome but is not in TS's DOM lib yet. */
type Ctx2D = CanvasRenderingContext2D & { letterSpacing: string };

const BRASS = "#c08a3e";
const UP = "#1fa97a";

/**
 * Draw the badge face into a canvas and hand it back as a texture.
 *
 * Laid out like the reference: a cream card, a small mono header rule, the
 * portrait centred as a rounded tile, the name and role centred under it, and
 * a mono footer rule. Light card against the dark strap is what gives it the
 * contrast the brass-on-dark version was missing.
 */
function makeCardTexture(photo: HTMLImageElement | null): THREE.CanvasTexture {
  const W = 600;
  const H = 848;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")! as Ctx2D;

  const INK = "#17171a";
  const MUTED = "#8b8880";
  const RULE = "rgba(23,23,26,.14)";

  // Card stock
  const bg = x.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, "#f4f1ea");
  bg.addColorStop(0.55, "#ece8df");
  bg.addColorStop(1, "#e2ddd2");
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);

  // Punch slot
  x.fillStyle = "rgba(23,23,26,.82)";
  x.beginPath();
  x.roundRect(W / 2 - 54, 34, 108, 20, 10);
  x.fill();

  // Header rule
  x.fillStyle = MUTED;
  x.font = "600 16px ui-monospace, monospace";
  x.letterSpacing = "3px";
  x.textBaseline = "alphabetic";
  x.fillText("STUDIO", 42, 108);
  const yr = "2026";
  x.textAlign = "right";
  x.fillText(yr, W - 42, 108);
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

  // Name + role, centred
  x.textAlign = "center";
  x.fillStyle = INK;
  x.letterSpacing = "0px";
  x.font = "600 46px ui-sans-serif, system-ui, sans-serif";
  x.fillText("Sharma Ketan", W / 2, 506);
  x.fillStyle = MUTED;
  x.font = "20px ui-sans-serif, system-ui, sans-serif";
  x.fillText("Senior Backend Developer", W / 2, 540);

  // Accent rule
  x.fillStyle = BRASS;
  x.fillRect(W / 2 - 30, 568, 60, 2.5);

  // Detail pairs
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

  // Footer rule
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

  // Barcode
  let bx = 42;
  const heights = [26, 10, 32, 8, 20, 14, 30, 11, 18, 32, 8, 24, 14, 28, 10, 22, 32, 9, 19, 27];
  heights.forEach((h, i) => {
    x.fillStyle = "rgba(23,23,26,.4)";
    const w = i % 3 === 0 ? 6 : 3;
    x.fillRect(bx, 806 - h, w, h);
    bx += w + 5;
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Repeating webbing texture — black strap with light print, as in the
 *  reference, rather than the brass ribbon this started as. */
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

  // Weave: fine vertical threads plus a faint twill.
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

  // Stitched edges
  x.fillStyle = "rgba(255,255,255,.1)";
  x.fillRect(0, 3, W, 1);
  x.fillRect(0, H - 4, W, 1);

  x.fillStyle = "rgba(226,230,236,.5)";
  x.font = "600 15px ui-monospace, monospace";
  x.letterSpacing = "6px";
  x.textBaseline = "middle";
  x.fillText("SHARMAKETANN.IN", 30, H / 2 + 1);
  x.fillText("SHARMAKETANN.IN", 290, H / 2 + 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

export default function Lanyard3D() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 10.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc08a3e, 1.5);
    rim.position.set(-4, 1, 2);
    scene.add(rim);

    // ── Rope ────────────────────────────────────────────────────────────────
    const anchor = new THREE.Vector3(0, 2.75, 0);
    const pos: THREE.Vector3[] = [];
    const prev: THREE.Vector3[] = [];
    for (let i = 0; i < SEG; i++) {
      const p = new THREE.Vector3(anchor.x, anchor.y - i * SEG_LEN, 0);
      pos.push(p);
      prev.push(p.clone());
    }

    // ── Band: a ribbon built per frame from the rope ────────────────────────
    const bandGeo = new THREE.BufferGeometry();
    const bandVerts = new Float32Array(SEG * 2 * 3);
    const bandUV = new Float32Array(SEG * 2 * 2);
    const bandIdx: number[] = [];
    for (let i = 0; i < SEG - 1; i++) {
      const a = i * 2;
      bandIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    for (let i = 0; i < SEG; i++) {
      const v = i / (SEG - 1);
      bandUV[i * 4 + 0] = 0; bandUV[i * 4 + 1] = v * 3;
      bandUV[i * 4 + 2] = 1; bandUV[i * 4 + 3] = v * 3;
    }
    bandGeo.setAttribute("position", new THREE.BufferAttribute(bandVerts, 3));
    bandGeo.setAttribute("uv", new THREE.BufferAttribute(bandUV, 2));
    bandGeo.setIndex(bandIdx);
    const bandTex = makeBandTexture();
    const band = new THREE.Mesh(
      bandGeo,
      new THREE.MeshStandardMaterial({
        map: bandTex,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.12,
      }),
    );
    scene.add(band);

    // ── Clip ────────────────────────────────────────────────────────────────
    const clip = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xc3c9d1, roughness: 0.3, metalness: 0.95 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.06), metal);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.05), metal);
    stem.position.y = -0.17;
    clip.add(body, stem);
    scene.add(clip);

    // ── Card ────────────────────────────────────────────────────────────────
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    const edge = () => new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.85 });
    const cardMat = [
      edge(), edge(), edge(), edge(),
      new THREE.MeshStandardMaterial({ map: makeCardTexture(null), roughness: 0.52, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.8 }),
    ];
    img.onload = () => {
      cardMat[4].map?.dispose();
      cardMat[4].map = makeCardTexture(img);
      cardMat[4].needsUpdate = true;
    };
    img.src = "/_static/me1.jpg";

    const card = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T), cardMat);
    scene.add(card);

    // ── Interaction ─────────────────────────────────────────────────────────
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    let dragging = false;

    const setPtr = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      setPtr(e);
      ray.setFromCamera(ptr, camera);
      if (ray.intersectObject(card).length) {
        dragging = true;
        renderer.domElement.setPointerCapture(e.pointerId);
        renderer.domElement.style.cursor = "grabbing";
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setPtr(e);
      ray.setFromCamera(ptr, camera);
      if (ray.ray.intersectPlane(dragPlane, hit)) {
        const last = pos[SEG - 1];
        last.set(hit.x, hit.y + CARD_H / 2, 0);
        prev[SEG - 1].copy(last);
      }
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      try {
        if (renderer.domElement.hasPointerCapture(e.pointerId)) {
          renderer.domElement.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* nothing captured */
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    // ── Frame ───────────────────────────────────────────────────────────────
    const tmp = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion();

    const simulate = () => {
      for (let i = 1; i < SEG; i++) {
        const p = pos[i];
        const pr = prev[i];
        tmp.subVectors(p, pr).multiplyScalar(DAMP);
        pr.copy(p);
        p.add(tmp);
        p.y += GRAVITY;
      }
      for (let k = 0; k < ITER; k++) {
        pos[0].copy(anchor);
        for (let i = 0; i < SEG - 1; i++) {
          const a = pos[i];
          const b = pos[i + 1];
          tmp.subVectors(b, a);
          const d = tmp.length() || 1e-6;
          tmp.multiplyScalar((d - SEG_LEN) / d / 2);
          if (i === 0) {
            b.sub(tmp.clone().multiplyScalar(2));
          } else {
            a.add(tmp);
            b.sub(tmp);
          }
        }
        if (dragging) prev[SEG - 1].copy(pos[SEG - 1]);
      }
    };

    const build = () => {
      const last = pos[SEG - 1];
      const beforeLast = pos[SEG - 2];
      const dir = tmp.subVectors(last, beforeLast).normalize();
      const angle = Math.atan2(dir.x, -dir.y);

      for (let i = 0; i < SEG; i++) {
        const a = pos[Math.max(0, i - 1)];
        const b = pos[Math.min(SEG - 1, i + 1)];
        const t = new THREE.Vector3().subVectors(b, a).normalize();
        const side = new THREE.Vector3().crossVectors(t, up).normalize().multiplyScalar(BAND_W / 2);
        // Gather into the clip over the last fifth, like real webbing.
        const f = i / (SEG - 1);
        const w = f < 0.8 ? 1 : 1 - ((f - 0.8) / 0.2) * 0.62;
        bandVerts[i * 6 + 0] = pos[i].x + side.x * w;
        bandVerts[i * 6 + 1] = pos[i].y + side.y * w;
        bandVerts[i * 6 + 2] = pos[i].z + side.z * w;
        bandVerts[i * 6 + 3] = pos[i].x - side.x * w;
        bandVerts[i * 6 + 4] = pos[i].y - side.y * w;
        bandVerts[i * 6 + 5] = pos[i].z - side.z * w;
      }
      bandGeo.attributes.position.needsUpdate = true;
      bandGeo.computeVertexNormals();

      clip.position.copy(last);
      clip.rotation.z = angle;

      q.setFromAxisAngle(up, angle);
      card.quaternion.copy(q);
      card.position.set(
        last.x + Math.sin(angle) * (CARD_H / 2 + 0.2),
        last.y - Math.cos(angle) * (CARD_H / 2 + 0.2),
        0,
      );
      // A little lean so it reads as a solid object rather than a decal.
      card.rotation.x = -0.12;
    };

    let raf = 0;
    const loop = () => {
      if (!reduce) simulate();
      build();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull the camera back on narrow viewports so the badge still fits.
      camera.position.z = THREE.MathUtils.clamp(11.8 - (w - 300) / 190, 9.4, 13.4);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      bandGeo.dispose();
      bandTex.dispose();
      cardMat.forEach((m) => { m.map?.dispose(); m.dispose(); });
      card.geometry.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="w-full h-full" aria-hidden />;
}
