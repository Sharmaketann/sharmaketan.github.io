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
 * From `lg` up it leaves the grid flow and hangs over the hero from the top of
 * the page, the way the reference does — the strap runs up behind the header
 * rather than starting inside a card. The canvas is pointer-events:none and
 * the drag is raycast from window listeners, so the page underneath stays
 * fully clickable. Below `lg` it stays inline in the hero, because an overlay
 * on a phone would simply cover the content.
 *
 * It is `absolute`, not `fixed`, and that is the whole point: positioned
 * against `main`, it hangs over the hero and then scrolls away. Fixed made it
 * follow the reader down the entire page, parked on top of the right-hand
 * column of every section below — the book, the posts list, all of it.
 *
 * The width matches the hero grid's right track (`minmax(0,500px)`), so it
 * lands exactly in the column the layout already reserves for it instead of
 * bleeding out to the viewport edge and leaving a dead gap between the text
 * and the badge. `right-6` mirrors main's `lg:px-6`: an absolute box is
 * positioned against the padding box, so the 24px inset is what puts its right
 * edge on main's content edge, level with every other section on the page.
 *
 * It used to walk further out than that, into the page margin, back when the
 * shell was max-w-5xl and there was ~440px of dead band either side at 1920.
 * The shell is max-w-7xl now, which moves this column 370px right on its own,
 * and chasing the window edge on top of that only tore a hole between the hero
 * text and the card: the grid still reserves the 500px track, so the pass has
 * to land *in* it, not past it.
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
        lg:absolute lg:top-0 lg:right-6 lg:z-20
        lg:h-[min(100vh,900px)] lg:w-[500px]
        lg:pointer-events-none
      "
    >
      <div className="flex-1 min-h-0">
        <Lanyard3D />
      </div>
      <p className="shrink-0 pt-1 lg:pb-6 text-center font-mono text-[8.5px] text-gray-400 dark:text-gray-600 pointer-events-none">
        drag it &middot; click to turn it over
      </p>
    </div>
  );
}
