"use client";

import dynamic from "next/dynamic";

/**
 * Wrapper for the WebGL badge.
 *
 * three.js is loaded with ssr:false and through next/dynamic deliberately: it
 * is the heaviest thing on the site, and this keeps it out of the shared
 * bundle and off every route that is not the homepage. The placeholder
 * reserves the exact height so nothing reflows when it arrives.
 *
 * From `lg` up it leaves the grid entirely and hangs over the page as a fixed
 * overlay on the right, the way the reference does — the strap starts at the
 * top of the viewport rather than inside a card. The canvas is
 * pointer-events:none and the drag is raycast from window listeners, so the
 * page underneath stays fully clickable. Below `lg` it stays inline in the
 * hero, because an overlay on a phone would simply cover the content.
 */
const Lanyard3D = dynamic(() => import("./lanyard-3d"), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden />,
});

export function LanyardPass() {
  return (
    <div
      className="
        flex flex-col w-full h-[440px] sm:h-[560px]
        lg:fixed lg:top-0 lg:right-0 lg:z-20
        lg:h-screen lg:w-[min(44vw,560px)]
        lg:pointer-events-none
      "
    >
      <div className="flex-1 min-h-0">
        <Lanyard3D />
      </div>
      <p className="shrink-0 pt-1 lg:pb-6 text-center font-mono text-[8.5px] text-gray-400 dark:text-gray-600 pointer-events-none">
        drag the pass
      </p>
    </div>
  );
}
