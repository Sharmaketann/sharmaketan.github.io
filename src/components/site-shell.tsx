"use client";

import { usePathname } from "next/navigation";

/**
 * Decides whether a route gets the terminal chrome.
 *
 * The paper edition is a different object - no ticker, no session clock, no
 * hanging pass, and no 1280px column - so it renders bare.
 *
 * This reads the path on the client rather than from middleware, on purpose.
 * The obvious server-side route was a middleware header, but this project
 * keeps its middleware at the repo root while the app lives in src/, and
 * Next only loads src/middleware.ts when a src directory is present. That
 * file has never executed. Moving it would have fixed this *and* switched on
 * blog-subdomain rewrites that have never once run in production, which is
 * not a side effect worth taking on for a layout decision.
 *
 * Server children pass straight through as props, so nothing here drags the
 * page into the client bundle.
 */
export function SiteShell({
  chrome,
  backdrop,
  footer,
  children,
}: {
  /** Ticker and header. Terminal only. */
  chrome: React.ReactNode;
  backdrop: React.ReactNode;
  /** Footer and the command palette. Terminal only. */
  footer: React.ReactNode;
  /** The page, plus anything that should run on both editions. */
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";

  // Bare: the paper edition brings its own masthead and colophon, and the
  // terminal footer would undo the whole effect.
  if (pathname.startsWith("/paper")) return <>{children}</>;

  return (
    <>
      {backdrop}
      <main className="relative z-10 max-w-7xl mx-4 px-2 md:px-0 lg:mx-auto lg:px-6 flex flex-col justify-between min-h-screen">
        {chrome}
        {children}
        {footer}
      </main>
    </>
  );
}

/**
 * Paints the paper stock on <body>.
 *
 * body's colour is set in the root layout, which is a server component and
 * cannot know the route. Rather than thread that decision all the way up,
 * the paper edition claims the background while it is mounted and hands it
 * back on the way out.
 */
export function PaperBody() {
  return (
    <style>{`body{background:#e8e6e0 !important;color:#14110c !important}`}</style>
  );
}
