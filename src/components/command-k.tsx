"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { PaletteDoc } from "./command-palette";

/**
 * The shortcut, and nothing else.
 *
 * This mounts on every route, so it stays deliberately tiny: a keydown
 * listener and a boolean. The palette itself - the list, the filtering, the
 * API calls - is pulled in only when it is first opened, so routes nobody
 * opens the palette on never pay for it.
 */
const Palette = dynamic(() => import("./command-palette"), { ssr: false });

export function CommandK({ docs }: { docs: PaletteDoc[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      if (k === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      // "/" to search, but not while the visitor is typing somewhere.
      if (k === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        const typing =
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  if (!open) return null;
  return <Palette docs={docs} onClose={close} />;
}

/**
 * The visible half of the shortcut. A palette nobody knows about is a
 * palette nobody uses, and ⌘K is not discoverable on its own.
 */
export function CommandKTrigger() {
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const open = () =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );

  return (
    <button
      onClick={open}
      aria-label="Open command palette"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-zinc-800 px-2 py-1 text-gray-400 dark:text-gray-600 hover:border-[#c08a3e] hover:text-[#c08a3e] dark:hover:border-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors"
    >
      <span className="font-mono text-[10px] leading-none">
        {mac ? "⌘" : "Ctrl"}K
      </span>
    </button>
  );
}
