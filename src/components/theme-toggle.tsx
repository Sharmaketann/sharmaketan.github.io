"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "./icons";

/**
 * Theme toggle.
 *
 * Two things this has to get right, both of which it previously got wrong:
 *
 * 1. The server has no idea what theme the browser will resolve to, so
 *    rendering an icon during SSR guarantees a mismatch — the server picked
 *    the moon, the client hydrated to the sun, and React logged a prop
 *    mismatch on every single page load. The icon is only rendered after
 *    mount, with a same-sized placeholder holding the space so the header
 *    does not shift.
 *
 * 2. `theme` is the *preference*, which is "system" by default with
 *    enableSystem on — so comparing it to "dark" is wrong for anyone who has
 *    never clicked the toggle. `resolvedTheme` is the theme actually in
 *    effect, and is what both the icon and the click should read.
 */
export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded p-1 hover:bg-gray-200 hover:dark:bg-[#313131] transition-colors"
    >
      {!mounted ? (
        <span className="block h-[25px] w-[25px]" aria-hidden />
      ) : isDark ? (
        <span className="sun-icon">
          <SunIcon height={25} width={25} />
        </span>
      ) : (
        <span className="moon-icon">
          <MoonIcon height={25} width={25} />
        </span>
      )}
    </button>
  );
}
