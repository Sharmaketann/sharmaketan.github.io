/**
 * The sound a card makes when it lands in the frame.
 *
 * The reference board plays real records — Billie Jean, Blinding Lights. That
 * is a licensing problem, not a technical one, so these are synthesised in the
 * browser instead: nothing to host and nothing to clear.
 *
 * Three sine partials stacked at 1x, 2.01x and 2.99x the fundamental. The
 * slightly sharp second partial is most of what separates a struck metal bar
 * from a flute: real bars are inharmonic, and a perfect 2x octave sounds
 * synthetic. Each partial decays faster than the one below it, which is also
 * what metal does — the high overtones die first and leave the fundamental
 * ringing.
 */

const PARTIALS = [
  { mult: 1, gain: 1, decay: 1 },
  { mult: 2.01, gain: 0.32, decay: 0.62 },
  { mult: 2.99, gain: 0.12, decay: 0.4 },
];

/** C major pentatonic, two octaves up. No two cards can clash. */
export const SCALE = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
];

let ctx: AudioContext | null = null;

/**
 * Browsers refuse to start an AudioContext outside a user gesture, so this is
 * only ever called from a click or a drag release.
 */
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Strike one note. `hold` is the fundamental's decay in seconds. */
export function strike(freq: number, hold = 2.6, level = 0.16) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;

  const out = ac.createGain();
  out.gain.value = level;
  out.connect(ac.destination);

  for (const p of PARTIALS) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * p.mult;

    const g = ac.createGain();
    // A 4ms ramp in: instant is a click, anything slower is a swell.
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(p.gain, t0 + 0.004);
    // Exponential, because loudness is perceived logarithmically — a linear
    // fade sounds like it stops dead near the end.
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + hold * p.decay);

    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + hold * p.decay + 0.05);
  }
}

/** Whether the browser will give us sound at all. */
export function audioAvailable() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.AudioContext ??
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext,
  );
}
