"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggler } from "./theme-toggle";

const NAV = [
  { path: "/",             name: "Home"     },
  { path: "/book-journey", name: "Journey"  },
  { path: "/blog",         name: "Blog"     },
  { path: "/projects",     name: "Projects" },
];

export function Header() {
  const rawPath   = usePathname() ?? "/";
  const pathname  = rawPath.startsWith("/blog/") ? "/blog" : rawPath;

  return (
    <header className="py-6 mb-8 border-b border-gray-100 dark:border-zinc-800">
      <nav className="flex items-center justify-between">

        {/* ── Logo / site name ─────────────────────────────────── */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-widest uppercase text-gray-900 dark:text-gray-100 hover:text-[#b86440] dark:hover:text-[#b86440] transition-colors"
        >
          SK
        </Link>

        {/* ── Nav links ────────────────────────────────────────── */}
        <ul className="flex items-center gap-7">
          {NAV.map(({ path, name }) => {
            const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <li key={path}>
                <Link
                  href={path}
                  className={cn(
                    "relative text-sm pb-0.5 transition-colors",
                    active
                      ? "text-gray-900 dark:text-gray-100 font-medium"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {name}
                  {active && (
                    <span
                      className="absolute -bottom-[1px] left-0 w-full h-px"
                      style={{ backgroundColor: "#b86440" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Theme toggle ─────────────────────────────────────── */}
        <ThemeToggler />
      </nav>
    </header>
  );
}
