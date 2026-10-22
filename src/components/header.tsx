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
    <header className="relative z-30 py-6 mb-8 border-b border-gray-100 dark:border-zinc-800">
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
        {/* Scrollable on narrow screens so a seventh item never breaks it. */}
        <ul className="flex items-center gap-[15px] sm:gap-6 md:gap-7 overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 sm:order-2">
          {NAV.map(({ path, name }) => {
            const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <li key={path} className="shrink-0">
                <Link
                  href={path}
                  className={cn(
                    "relative text-[13.5px] sm:text-sm pb-0.5 transition-colors whitespace-nowrap",
                    active
                      ? "text-gray-900 dark:text-gray-100 font-medium"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {name}
                  {active && (
                    <span
                      className="absolute -bottom-[1px] left-0 w-full h-px"
                      style={{ backgroundColor: "#c08a3e" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

      </nav>
    </header>
  );
}
