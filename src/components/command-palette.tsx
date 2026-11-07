"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { THEME } from "@/data/theme";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { INSTRUMENTS } from "@/data/instruments";

/**
 * The command bar.
 *
 * Half of it is the palette every site has: jump to a route, open a post,
 * flip the theme. The other half is the part worth having - it speaks to
 * this site's own public API. Type an instrument and it fetches the quote
 * and prints it inline; type `session` and it reads the NSE/MCX clock. So
 * the shortcut that navigates the site is also a small terminal onto the
 * thing the site is actually about, and it is doing it against the same
 * endpoints a stranger can curl.
 *
 * Animation is CSS only - keyframes on the backdrop, the panel and the rows.
 * This mounts on every route, so it is not worth an animation library.
 */

export interface PaletteDoc {
  title: string;
  slug: string;
}

type Kind = "page" | "post" | "action" | "quote";

interface Item {
  id: string;
  kind: Kind;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void | Promise<void>;
}

const PAGES: { label: string; path: string; hint: string }[] = [
  { label: "Home", path: "/", hint: "The hero and the tearsheet" },
  { label: "Journey", path: "/book-journey", hint: "Career as a trade blotter" },
  { label: "Blog", path: "/blog", hint: "Everything written" },
  { label: "Projects", path: "/projects", hint: "Work, and the earlier stuff" },
  { label: "Backtest", path: "/backtest", hint: "Run a strategy" },
  { label: "API", path: "/api-docs", hint: "The public endpoints" },
  { label: "Contact", path: "/contact", hint: "Email, LinkedIn, GitHub" },
  { label: "Resume", path: "/cv", hint: "One page, as a PDF" },
  { label: "Colophon", path: "/colophon", hint: "How this site is built" },
];

/** "bkt" finds "Backtest". */
function subsequence(hay: string, needle: string) {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

/**
 * Ranked, not just filtered. Subsequence matching on its own is far too
 * generous on long strings - "nifty" is a subsequence of "Format Uniform
 * Response Structure in Elysia.js", so the post outranked the NIFTY quote
 * and Enter took you to the wrong place. Exact and prefix hits have to beat
 * a loose match, and the loose match is the last resort it was meant to be.
 *
 * Returns -1 for no match.
 */
function score(label: string, keywords: string, q: string) {
  if (!q) return 0;
  const l = label.toLowerCase();
  const k = keywords.toLowerCase();
  const n = q.toLowerCase();

  if (l === n) return 1000;
  if (l.startsWith(n)) return 900 - l.length;
  if (l.includes(n)) return 700 - l.indexOf(n);
  if (k.includes(n)) return 500;
  if (subsequence(l, n)) return 200 - l.length;
  if (subsequence(k, n)) return 100 - k.length;
  return -1;
}

const KIND_LABEL: Record<Kind, string> = {
  page: "Page",
  post: "Writing",
  action: "Action",
  quote: "Live",
};

export default function CommandPalette({
  docs,
  onClose,
}: {
  docs: PaletteDoc[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<Element | null>(null);

  useEffect(() => {
    restoreTo.current = document.activeElement;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  const go = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose],
  );

  /** Runs against this site's own API, and prints what comes back. */
  const quote = useCallback(async (symbol: string) => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/v1/quotes?symbols=${symbol}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const row = (await res.json())?.data?.[0];
      if (!row) throw new Error("no row");
      const sign = row.change >= 0 ? "+" : "";
      setNote(
        `${row.symbol}  ${row.price}  ${sign}${row.change} (${sign}${row.changePercent}%)  ${row.exchange} ${row.currency}`,
      );
    } catch {
      setNote(`Could not reach /api/v1/quotes for ${symbol}.`);
    } finally {
      setBusy(false);
    }
  }, []);

  const session = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/v1/session", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json())?.data;
      setNote(
        `NSE ${d.nse.state} (${d.nse.next}) · MCX ${d.mcx.state} (${d.mcx.next}) · ${d.istTime} IST`,
      );
    } catch {
      setNote("Could not reach /api/v1/session.");
    } finally {
      setBusy(false);
    }
  }, []);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    for (const p of PAGES) {
      out.push({
        id: `page:${p.path}`,
        kind: "page",
        label: p.label,
        hint: p.hint,
        keywords: p.path,
        run: () => go(p.path),
      });
    }

    for (const d of docs) {
      out.push({
        id: `post:${d.slug}`,
        kind: "post",
        label: d.title,
        hint: `/blog/${d.slug}`,
        run: () => go(`/blog/${d.slug}`),
      });
    }

    for (const ins of INSTRUMENTS) {
      out.push({
        id: `q:${ins.symbol}`,
        kind: "quote",
        label: ins.symbol,
        hint: `${ins.name} · live from /api/v1/quotes`,
        keywords: `${ins.name} quote price ${ins.segment}`,
        run: () => quote(ins.symbol),
      });
    }

    out.push({
      id: "q:session",
      kind: "quote",
      label: "session",
      hint: "NSE and MCX clock · live from /api/v1/session",
      keywords: "market open closed clock nse mcx",
      run: session,
    });

    out.push(
      {
        id: "a:theme",
        kind: "action",
        label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"}`,
        hint: "Theme",
        keywords: "dark light mode theme toggle",
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          onClose();
        },
      },
      {
        id: "a:email",
        kind: "action",
        label: "Copy email address",
        hint: PORTFOLIO_CONFIG.email,
        keywords: "mail contact copy",
        run: async () => {
          try {
            await navigator.clipboard.writeText(PORTFOLIO_CONFIG.email);
            setNote(`Copied ${PORTFOLIO_CONFIG.email}`);
          } catch {
            setNote(PORTFOLIO_CONFIG.email);
          }
        },
      },
      {
        id: "a:resume",
        kind: "action",
        label: "Download resume",
        hint: PORTFOLIO_CONFIG.resumeFileName,
        keywords: "cv pdf download",
        run: () => {
          window.location.href = PORTFOLIO_CONFIG.resume;
          onClose();
        },
      },
      {
        id: "a:github",
        kind: "action",
        label: "Open GitHub",
        hint: "github.com/sharmaketann",
        keywords: "code repos",
        run: () => {
          window.open(PORTFOLIO_CONFIG.socials.github, "_blank", "noopener");
          onClose();
        },
      },
    );

    return out;
  }, [docs, go, quote, session, resolvedTheme, setTheme, onClose]);

  const shown = useMemo(() => {
    const scored = items
      .map((it, i) => ({ it, s: score(it.label, it.keywords ?? "", q), i }))
      .filter((r) => r.s >= 0);

    // Stable: ties keep the order the groups were built in, so an empty
    // query still reads Pages, Writing, Live, Actions.
    scored.sort((a, b) => b.s - a.s || a.i - b.i);
    return scored.map((r) => r.it).slice(0, 40);
  }, [items, q]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (shown.length ? (s + 1) % shown.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (shown.length ? (s - 1 + shown.length) % shown.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      shown[sel]?.run();
    }
  };

  // Group headings, in the order the groups first appear.
  let lastKind: Kind | null = null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default bg-black/50 backdrop-blur-[3px] animate-[ckFade_160ms_ease-out]"
      />

      <div
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[600px] rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-[ckRise_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 border-b border-gray-100 dark:border-zinc-800">
          <span
            className="font-mono text-sm shrink-0"
            style={{ color: THEME.accent }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a page, or type NIFTY for a live quote"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
            aria-label="Search pages, posts and commands"
          />
          {busy && (
            <span
              className="h-3 w-3 shrink-0 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
            />
          )}
          <kbd className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-gray-600">
            esc
          </kbd>
        </div>

        {/* Output from a live command */}
        {note && (
          <div
            className="px-4 py-2.5 font-mono text-[11.5px] border-b border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-gray-300 animate-[ckFade_200ms_ease-out] break-all"
            style={{ backgroundColor: THEME.accentWash }}
          >
            {note}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[48vh] overflow-y-auto py-1.5">
          {shown.length === 0 && (
            <div className="px-4 py-8 text-center animate-[ckFade_200ms_ease-out]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nothing matches &ldquo;{q}&rdquo;
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
                Try a page name, a post title, or an instrument like GOLD.
              </p>
            </div>
          )}

          {shown.map((it, i) => {
            const head = it.kind !== lastKind ? KIND_LABEL[it.kind] : null;
            lastKind = it.kind;
            const active = i === sel;
            return (
              <div key={it.id}>
                {head && !q && (
                  <div className="px-4 pt-2.5 pb-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">
                    {head}
                  </div>
                )}
                <button
                  data-i={i}
                  onMouseMove={() => setSel(i)}
                  onClick={() => it.run()}
                  className="w-full text-left px-4 py-2 flex items-baseline gap-3 transition-colors"
                  style={{
                    backgroundColor: active ? THEME.accentWash : "transparent",
                    // Rows fade in on a short stagger, so the list assembles
                    // instead of appearing all at once.
                    animation: `ckRow 220ms ease-out both`,
                    animationDelay: `${Math.min(i, 12) * 18}ms`,
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full shrink-0 translate-y-[-2px] transition-opacity"
                    style={{
                      backgroundColor: THEME.accent,
                      opacity: active ? 1 : 0,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] text-gray-900 dark:text-gray-100 truncate">
                      {it.label}
                    </span>
                    {it.hint && (
                      <span className="block text-[11px] text-gray-400 dark:text-gray-600 truncate">
                        {it.hint}
                      </span>
                    )}
                  </span>
                  {active && (
                    <kbd className="shrink-0 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-gray-600">
                      &crarr;
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[9.5px] text-gray-400 dark:text-gray-600">
          <span>&uarr;&darr; move · &crarr; run · esc close</span>
          <span className="truncate">live rows hit this site&apos;s own API</span>
        </div>
      </div>
    </div>
  );
}
