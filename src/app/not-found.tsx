import { Metadata } from "next";
import Link from "next/link";
import { THEME } from "@/data/theme";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "Page not found",
  robots: { index: false, follow: false },
};

/** A price that trades sideways and then gaps to nothing. */
const FLATLINE =
  "M0,34 L26,33 L52,35 L78,33.5 L104,34.5 L130,33 L156,34 L182,33.5 " +
  "L208,35 L234,33 L260,34 L286,33.5 L300,34 L300,34 L316,62 L420,62";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start py-16 md:py-24">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: THEME.down }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          404 &middot; no such symbol
        </span>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        Position not found.
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-8">
        Nothing trades at this address. The page was either never listed, or it
        was delisted at some point and the link outlived it.
      </p>

      <svg
        viewBox="0 0 420 80"
        className="w-full max-w-lg h-[80px] mb-8"
        role="img"
        aria-label="A flat price line that drops to zero"
      >
        {[20, 40, 60].map((y) => (
          <line key={y} x1="0" x2="420" y1={y} y2={y} stroke={THEME.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path
          d={FLATLINE}
          fill="none"
          stroke={THEME.down}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="420" cy="62" r="3" fill={THEME.down} />
        <text
          x="414"
          y="54"
          textAnchor="end"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
          fill={THEME.down}
        >
          0.00
        </text>
      </svg>

      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/"
          className="font-mono text-[11px] px-4 py-2 rounded-md border transition-colors"
          style={{ color: THEME.accent, borderColor: THEME.accent }}
        >
          &larr; Back to the desk
        </Link>
        <Link
          href="/book-journey"
          className="font-mono text-[11px] px-4 py-2 rounded-md border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors"
        >
          Open positions
        </Link>
      </div>
    </section>
  );
}
