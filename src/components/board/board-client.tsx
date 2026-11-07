"use client";

import dynamic from "next/dynamic";
import { Folder } from "./folder";

/**
 * The board is a few hundred lines of physics that nobody who never clicks the
 * folder should have to download, and it touches `window` on mount. Loading it
 * on demand with no SSR pass keeps it out of the shared bundle entirely.
 */
const Moodboard = dynamic(() => import("./moodboard").then((m) => m.Moodboard), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">
        stringing it up…
      </span>
    </div>
  ),
});

export function BoardClient() {
  return (
    <Folder
      leaves={[
        { label: "Positions", sub: "2021 — now" },
        { label: "What I built", sub: "four desks" },
        { label: "Where it started", sub: "Christ · Pune" },
      ]}
    >
      {(close) => <Moodboard onClose={close} />}
    </Folder>
  );
}
