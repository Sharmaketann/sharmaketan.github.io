import Link from "next/link";
import { allBlogs } from "contentlayer/generated";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { POSITIONS, label, heldMonths, heldLabel } from "@/data/career";
import { WORK } from "@/data/projects";
import { INSTRUMENTS } from "@/data/instruments";
import { VersionSwitch } from "@/components/version-switch";
import { PaperBody } from "@/components/site-shell";

/**
 * The paper edition.
 *
 * Same data as the terminal site - the positions, the work, the posts all
 * come out of the same modules - set as a printed spec sheet instead: a
 * numbered document on paper stock, with catalogue codes, figure captions
 * and rivets in the panel corners.
 *
 * It is deliberately light-only. "Paper with a dark mode" is a contradiction,
 * and writing every rule twice to honour a toggle nobody expects here would
 * be work spent arguing with the premise.
 */

const INK = "#14110c";
const MUTED = "#6f6a60";
const RULE = "#cfcabe";
const PANEL = "#f3f1ec";
const BRASS = "#c08a3e";

/** WIZZER + 2026 -> WI-26. Derived, so a new role needs no new code. */
function catalogue(symbol: string, year: number) {
  return `${symbol.slice(0, 2).toUpperCase()}–${String(year).slice(2)}`;
}

function Rivets() {
  const at = ["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"];
  return (
    <>
      {at.map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute ${pos} h-2.5 w-2.5 rounded-full`}
          style={{ border: `1px solid ${RULE}`, background: "#e8e6e0" }}
        />
      ))}
    </>
  );
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-8">
      <span
        className="font-mono text-[42px] leading-none font-bold tabular-nums"
        style={{ color: BRASS }}
      >
        {n}
      </span>
      <span
        className="font-mono text-[11px] tracking-[0.3em] uppercase pb-1.5"
        style={{ color: MUTED }}
      >
        {title}
      </span>
      <span className="flex-1 h-px" style={{ background: RULE }} />
    </div>
  );
}

export default function PaperPage() {
  const now = new Date();

  const posts = allBlogs
    .filter((b) => !b.draft)
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 4);

  const months = POSITIONS.map((p) => heldMonths(p.start, p.end, now) ?? 0);
  const maxMonths = Math.max(...months, 1);
  const totalMonths = months.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen" style={{ background: "#e8e6e0", color: INK }}>
      <PaperBody />
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="mx-auto max-w-5xl px-5 sm:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold tracking-tight">
              {PORTFOLIO_CONFIG.name}
            </span>
            <span
              className="font-mono text-[9.5px] tracking-[0.25em] uppercase"
              style={{ color: MUTED }}
            >
              Spec sheet &middot; Ed. 01
            </span>
          </div>
          <VersionSwitch to="terminal" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8 pb-24">
        {/* ── Panel ──────────────────────────────────────────────── */}
        <div
          className="relative rounded-xl px-6 sm:px-12 py-12 sm:py-16"
          style={{ background: PANEL, border: `1px solid ${RULE}` }}
        >
          <Rivets />

          <p
            className="font-mono text-[10px] tracking-[0.3em] uppercase mb-5"
            style={{ color: MUTED }}
          >
            Senior Backend Developer &middot; Mumbai, IST
          </p>

          <h1 className="text-[clamp(2.4rem,7vw,4.6rem)] font-bold leading-[0.95] tracking-[-0.03em] max-w-[16ch]">
            I build the backend for{" "}
            {/* Highlighter as a background gradient with box-decoration-break,
                not an absolutely positioned bar. The bar spanned the inline
                block's whole box, so it ran on past "money." into the empty
                tail of the last line. A gradient is drawn per line fragment,
                which is what a real marker does. */}
            <span
              style={{
                backgroundImage: `linear-gradient(transparent 62%, ${BRASS}59 62%)`,
                WebkitBoxDecorationBreak: "clone",
                boxDecorationBreak: "clone",
              }}
            >
              systems that move money.
            </span>
          </h1>

          <p
            className="mt-8 text-[15px] leading-relaxed max-w-[58ch]"
            style={{ color: MUTED }}
          >
            Four years across insurance and capital markets. I led the team
            behind an insurance Point of Sale platform and wired up 200+
            carrier APIs &mdash; now I&apos;m building trading infrastructure at{" "}
            <a
              href={PORTFOLIO_CONFIG.currentEmployer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b"
              style={{ color: INK, borderColor: BRASS }}
            >
              {PORTFOLIO_CONFIG.currentEmployer.name}
            </a>
            .
          </p>

          {/* The annotation. rameerez has a speech bubble; this is a rubber
              stamp, which suits a spec sheet better than a comic aside. */}
          <div className="mt-10 inline-block">
            <div
              className="-rotate-[3deg] px-4 py-2.5 rounded-sm"
              style={{ border: `2px solid ${BRASS}`, color: BRASS }}
            >
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase block">
                Open to opportunities
              </span>
              <Link
                href="/contact"
                className="font-mono text-[11px] tracking-wide underline underline-offset-2"
              >
                {PORTFOLIO_CONFIG.email}
              </Link>
            </div>
          </div>
        </div>

        {/* ── 01 Positions ───────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead n="01" title="Positions held" />

          <div style={{ borderTop: `1px solid ${RULE}` }}>
            {POSITIONS.map((p, i) => (
              <article
                key={p.symbol}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[110px_1fr_auto] gap-x-5 gap-y-1 py-6"
                style={{ borderBottom: `1px solid ${RULE}` }}
              >
                <span
                  className="font-mono text-[12px] tracking-widest self-start pt-1"
                  style={{ color: BRASS }}
                >
                  {catalogue(p.symbol, p.start[0])}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[19px] font-semibold tracking-tight">
                    {p.org}
                  </h3>
                  <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
                    {p.role} &middot; {p.sector}
                  </p>
                  <p
                    className="text-[13.5px] mt-3 leading-relaxed max-w-[62ch]"
                    style={{ color: MUTED }}
                  >
                    {p.note}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                    {p.tags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px]"
                        style={{ color: MUTED }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 sm:text-right mt-2 sm:mt-0">
                  <p className="font-mono text-[11px]" style={{ color: MUTED }}>
                    {label(p.start)} &mdash; {p.end ? label(p.end) : "present"}
                  </p>
                  <p
                    className="font-mono text-[11px] mt-0.5"
                    style={{ color: INK }}
                  >
                    {heldLabel(months[i])}
                  </p>
                  {p.result && (
                    <p
                      className="font-mono text-[11px] mt-0.5"
                      style={{ color: BRASS }}
                    >
                      {p.result}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* FIG. 1 — months held, drawn from the same numbers */}
          <figure className="mt-10">
            <div
              className="rounded-lg p-6"
              style={{ background: PANEL, border: `1px solid ${RULE}` }}
            >
              <div className="flex items-end gap-3 h-[120px]">
                {POSITIONS.map((p, i) => (
                  <div key={p.symbol} className="flex-1 flex flex-col justify-end h-full">
                    <span
                      className="font-mono text-[10px] mb-1.5 text-center"
                      style={{ color: MUTED }}
                    >
                      {months[i]}
                    </span>
                    <div
                      className="rounded-sm w-full"
                      style={{
                        height: `${(months[i] / maxMonths) * 100}%`,
                        background: p.end ? `${BRASS}66` : BRASS,
                        border: `1px solid ${BRASS}`,
                      }}
                    />
                    <span
                      className="font-mono text-[9.5px] mt-2 text-center tracking-wider"
                      style={{ color: MUTED }}
                    >
                      {p.symbol.slice(0, 6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption
              className="font-mono text-[9.5px] tracking-[0.2em] uppercase mt-3"
              style={{ color: MUTED }}
            >
              Fig. 1 &mdash; Months held per position. {totalMonths} months in
              market, solid bar is the open position.
            </figcaption>
          </figure>
        </section>

        {/* ── 02 Built ───────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead n="02" title="What I built there" />
          <div className="grid gap-10 sm:grid-cols-2">
            {WORK.map((w) => (
              <article key={w.org}>
                <h3 className="text-[17px] font-semibold tracking-tight mb-1">
                  {w.title}
                </h3>
                <p className="font-mono text-[10.5px] mb-3" style={{ color: BRASS }}>
                  {w.org}
                </p>
                <p
                  className="text-[13.5px] leading-relaxed mb-4"
                  style={{ color: MUTED }}
                >
                  {w.summary}
                </p>
                <ul className="space-y-1.5">
                  {w.points.map((pt) => (
                    <li
                      key={pt}
                      className="text-[12.5px] leading-relaxed pl-3.5 -indent-3.5"
                      style={{ color: MUTED }}
                    >
                      <span style={{ color: BRASS }}>&mdash; </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── 03 The desk ────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead n="03" title="The desk is open" />
          <p
            className="text-[14px] leading-relaxed max-w-[62ch] mb-6"
            style={{ color: MUTED }}
          >
            This site runs a public, read-only API over {INSTRUMENTS.length}{" "}
            instruments, plus a long-only backtester that charges costs and
            always draws buy-and-hold next to the strategy. No key, CORS open.
            You are welcome to check the numbers rather than take my word for
            them.
          </p>

          <div
            className="rounded-lg p-5 font-mono text-[11.5px] overflow-x-auto"
            style={{ background: "#14110c", color: "#e8e6e0" }}
          >
            <p style={{ color: BRASS }}>
              $ curl -s {PORTFOLIO_CONFIG.site.url}/api/v1/quotes
            </p>
            <p className="mt-1 opacity-70">
              {"{ \"data\": [ { \"symbol\": \"NIFTY\", \"price\": …, \"exchange\": \"NSE\" } ] }"}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
            {["/session", "/quotes", "/instruments", "/backtest"].map((e) => (
              <span key={e} className="font-mono text-[11px]" style={{ color: MUTED }}>
                <span style={{ color: BRASS }}>GET</span> /api/v1{e}
              </span>
            ))}
          </div>

          <Link
            href="/api-docs"
            className="inline-block mt-6 font-mono text-[11px] border-b"
            style={{ color: INK, borderColor: BRASS }}
          >
            Read the docs &rarr;
          </Link>
        </section>

        {/* ── 04 Writing ─────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead n="04" title="Writing" />
          <div style={{ borderTop: `1px solid ${RULE}` }}>
            {posts.map((b) => (
              <Link
                key={b.slug}
                href={`/blog/${b.slug}`}
                className="group block py-5"
                style={{ borderBottom: `1px solid ${RULE}` }}
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-mono text-[10.5px] shrink-0 tabular-nums"
                    style={{ color: BRASS }}
                  >
                    {new Date(b.publishedAt)
                      .toLocaleDateString("en-GB", { year: "numeric", month: "short" })
                      .toUpperCase()}
                  </span>
                  <span className="text-[16px] font-medium tracking-tight group-hover:underline underline-offset-4">
                    {b.title}
                  </span>
                </div>
                <p
                  className="text-[13px] mt-1.5 leading-relaxed max-w-[70ch]"
                  style={{ color: MUTED }}
                >
                  {b.summary}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/blog"
            className="inline-block mt-6 font-mono text-[11px] border-b"
            style={{ color: INK, borderColor: BRASS }}
          >
            All posts &rarr;
          </Link>
        </section>

        {/* ── Colophon ───────────────────────────────────────────── */}
        <footer
          className="mt-24 pt-8 flex flex-wrap items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${RULE}` }}
        >
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            &copy; {now.getFullYear()} {PORTFOLIO_CONFIG.name} &middot; Set on
            paper, same data as the terminal
          </p>
          <VersionSwitch to="terminal" />
        </footer>
      </main>
    </div>
  );
}
