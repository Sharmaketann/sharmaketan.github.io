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
 * The column it sits in is only ~390px inside a max-w-5xl page, which is too
 * small for the badge to carry the hero, so from `lg` up it bleeds past the
 * container to the right. html has overflow-x: clip, so the bleed cannot
 * produce a horizontal scrollbar.
 */
const Lanyard3D = dynamic(() => import("./lanyard-3d"), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden />,
});

export function LanyardPass() {
  return (
    <div
      className="flex flex-col w-full h-[440px] sm:h-[560px] lg:h-[760px] xl:h-[860px]"
    >
      <div className="flex-1 min-h-0">
        <Lanyard3D />
      </div>
      <p className="shrink-0 pt-1 text-center font-mono text-[8.5px] text-gray-400 dark:text-gray-600 pointer-events-none">
        drag the pass
      </p>
    </div>
  );
}
