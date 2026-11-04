"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggler } from "./theme-toggle";
import { MarketStatusPill } from "./market-status";

const NAV = [
  { path: "/",             name: "Home"     },
  { path: "/book-journey", name: "Journey"  },
  { path: "/blog",         name: "Blog"     },
  { path: "/projects",     name: "Projects" },
  { path: "/backtest",     name: "Backtest" },
  { path: "/api-docs",     name: "API"      },
];

export function Header() {
  const rawPath   = usePathname() ?? "/";
  const pathname  = rawPath.startsWith("/blog/") ? "/blog" : rawPath;

  // z-30 keeps the nav and session clock above the hanging pass, which is a
  // fixed overlay at z-20. Chrome stays legible; the strap passes behind it.
  return (
    <header className="relative z-30 py-4 sm:py-6 mb-6 sm:mb-8 border-b border-gray-100 dark:border-zinc-800">
      <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">

        {/* On small screens the logo and the toggle share the top row. */}
        <div className="flex items-center justify-between sm:contents">

        {/* ── Logo / site name ─────────────────────────────────── */}
        <Link href="/" aria-label="Home" className="inline-block shrink-0">
          <Image
            src="/_static/favicons/logo-mark.png"
            alt="Sharma Ketan"
            width={236}
            height={160}
            className="h-8 w-auto sm:h-10 md:h-11 [mix-blend-mode:multiply] dark:invert dark:[mix-blend-mode:screen] transition-[filter] duration-300"
            priority
          />
        </Link>

        {/* The session clock has no room on a phone; it reappears at lg. */}
        <div className="flex items-center gap-3 sm:order-3">
          <span className="hidden lg:inline-flex">
            <MarketStatusPill />
          </span>
          <ThemeToggler />
        </div>
        </div>

        {/* ── Nav links ────────────────────────────────────────── */}
        {/* Wraps below sm, never scrolls. It used to be an overflow-x-auto
            track with no-scrollbar, which hid "API" entirely at 360px - the
            commonest Android width - with nothing on screen to suggest the
            link was there. A row that wraps is always fully reachable; one
            that scrolls without a scrollbar is a link you cannot find. */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-0.5 sm:flex-nowrap sm:gap-x-6 md:gap-x-7 sm:order-2">
          {NAV.map(({ path, name }) => {
            const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <li key={path} className="shrink-0">
                <Link
                  href={path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // py-1.5 is the tap target, not decoration: the bare text
                    // was a ~20px-tall hit area on a touch screen.
                    "relative block py-1.5 text-[13.5px] sm:text-sm transition-colors whitespace-nowrap",
                    active
                      ? "text-gray-900 dark:text-gray-100 font-medium"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {/* The underline hangs off this span, so padding on the
                      link can grow the tap area without dragging the rule
                      away from the word. */}
                  <span className="relative inline-block pb-0.5">
                    {name}
                    {active && (
                      <span
                        className="absolute -bottom-[1px] left-0 w-full h-px"
                        style={{ backgroundColor: "#c08a3e" }}
                      />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

      </nav>
    </header>
  );
}
