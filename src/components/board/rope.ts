/**
 * A hanging string, solved as a verlet chain.
 *
 * The model: n point masses in a row. The two ends are pinned to whatever is
 * holding the string up; every point between them falls, drifts, and is then
 * pulled back towards its neighbours a few times per frame until the whole
 * line settles into a curve.
 *
 * The one idea worth understanding here is `rest`. A string sags because it is
 * longer than the gap it spans. Rather than fix a length and let the sag drift
 * as the cards move, the rest length is recomputed every frame as the current
 * span plus five percent. The sag then stays proportional: two cards an inch
 * apart and two cards a foot apart droop by the same relative amount, which is
 * what makes it read as one continuous piece of string rather than as a set of
 * independently tuned curves.
 *
 * No physics library. A rope is ~40 lines of arithmetic and a library would be
 * larger than the whole feature.
 */

export interface Pt {
  x: number;
  y: number;
  /** Previous position. Velocity is implied by (x - ox), which is what makes
   *  this verlet rather than euler: there is no separate velocity to drift. */
  ox: number;
  oy: number;
}

/** Where the cursor is, so strings can be pushed out of its way. */
export interface Pointer {
  x: number;
  y: number;
  active: boolean;
}

/** Radius inside which the cursor pushes a string, in px. */
const PUSH_R = 70;
/** How hard it pushes at the very centre. */
const PUSH_F = 20;

export class Rope {
  readonly n: number;
  readonly pts: Pt[] = [];
  /** Per-rope, so no two strings in a scene ever move in step. */
  private readonly phase: number;
  private readonly windAmp: number;
  private started = false;

  constructor(n: number, phase?: number) {
    this.n = n;
    this.phase = phase ?? Math.random() * 100;
    this.windAmp = 0.005 + Math.random() * 0.01;
    for (let i = 0; i < n; i++) this.pts.push({ x: 0, y: 0, ox: 0, oy: 0 });
  }

  /**
   * Advance one frame.
   *
   * @param t      elapsed ms, only used to phase the wind
   * @param damp   velocity retained per frame; 0.986 is a slow, heavy string
   * @param iters  constraint passes; more is stiffer. 4 is plenty at n=16
   */
  update(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    t: number,
    damp: number,
    iters: number,
    pointer?: Pointer,
  ) {
    const p = this.pts;

    // First frame: lay the string out straight between its anchors, with zero
    // velocity, so it falls into place instead of whipping in from (0,0).
    if (!this.started) {
      for (let i = 0; i < this.n; i++) {
        const u = i / (this.n - 1);
        const x = ax + (bx - ax) * u;
        const y = ay + (by - ay) * u;
        p[i].x = p[i].ox = x;
        p[i].y = p[i].oy = y;
      }
      this.started = true;
    }

    p[0].x = ax;
    p[0].y = ay;
    p[this.n - 1].x = bx;
    p[this.n - 1].y = by;

    // Both of these breathe, on different periods, so the scene never looks
    // like it is running on a loop.
    const wind = Math.sin(t / 150 + this.phase) * this.windAmp;
    const grav = 0.08 + Math.cos(t / 230 + this.phase) * 0.008;

    for (let i = 1; i < this.n - 1; i++) {
      const q = p[i];
      const vx = (q.x - q.ox) * damp;
      const vy = (q.y - q.oy) * damp;
      q.ox = q.x;
      q.oy = q.y;
      q.x += vx + wind;
      q.y += vy + grav;

      if (pointer?.active) {
        const dx = q.x - pointer.x;
        const dy = q.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < PUSH_R) {
          // Squared falloff: a firm nudge at the centre that fades to nothing
          // at the rim, rather than a hard edge you can see the string cross.
          const safe = Math.max(d, 0.001);
          const f = Math.pow(1 - d / PUSH_R, 2);
          q.x += (dx / safe) * f * PUSH_F;
          q.y += (dy / safe) * f * PUSH_F;
        }
      }
    }

    // Five percent longer than the gap it spans. See the note above.
    const span = Math.hypot(bx - ax, by - ay);
    const rest = Math.max((span / (this.n - 1)) * 1.05, 3);

    for (let k = 0; k < iters; k++) {
      for (let i = 0; i < this.n - 1; i++) {
        const a = p[i];
        const b = p[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-4;
        // Split the correction between the two points, half each.
        const s = ((rest - d) / d) * 0.5;
        const ox = dx * s;
        const oy = dy * s;
        if (i !== 0) {
          a.x -= ox;
          a.y -= oy;
        }
        if (i + 1 !== this.n - 1) {
          b.x += ox;
          b.y += oy;
        }
      }
      // Relaxation drags the pinned ends; put them back before the next pass.
      p[0].x = ax;
      p[0].y = ay;
      p[this.n - 1].x = bx;
      p[this.n - 1].y = by;
    }
  }

  /**
   * Stroke the string.
   *
   * Drawn as quadratics through the midpoints of consecutive segments, which
   * is the cheap way to get a smooth curve out of a polyline: each point
   * becomes a control handle rather than a visible corner. At 16 points a
   * polyline would show every joint.
   */
  draw(ctx: CanvasRenderingContext2D, color: string, width: number) {
    const p = this.pts;
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < this.n - 2; i++) {
      const a = p[i];
      const b = p[i + 1];
      ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    ctx.lineTo(p[this.n - 1].x, p[this.n - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}
