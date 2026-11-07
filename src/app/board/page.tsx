import React from "react";
import Link from "next/link";
import { generatePageMetadata } from "../seo";
import { BoardClient } from "@/components/board/board-client";
import { THEME } from "@/data/theme";

export const metadata = generatePageMetadata({
  title: "The board",
  description:
    "Every position I've held, hung off one string. Open the folder, drag a card into the frame, and it rings.",
});

export default function BoardPage() {
  return (
    <React.Fragment>
      <section className="mb-9">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: THEME.accent }}
          />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            The board
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
          Positions, on a string
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[58ch] leading-relaxed">
          The same roles the blotter rules into a table, strung across a wall
          instead. Open the folder. Drag a card into the frame in the middle
          &mdash; or just click one &mdash; and it rings at its own pitch.
        </p>
      </section>

      <BoardClient />

      <div className="mt-10 space-y-2">
        <p className="text-[12px] text-gray-400 dark:text-gray-600 max-w-[62ch] leading-relaxed">
          The strings are one verlet chain on a canvas, re-solved every frame;
          the cards are real DOM, so the text stays selectable. The sound is
          generated in the browser rather than played from a file &mdash; three
          sine partials with a slightly sharp second, which is roughly what
          separates a struck metal bar from a flute.
        </p>
        <p className="text-[12px] text-gray-400 dark:text-gray-600">
          <Link
            href="/book-journey"
            className="border-b border-gray-300 dark:border-zinc-700 hover:text-[#c08a3e] hover:border-[#c08a3e] transition-colors"
          >
            The blotter has the same data in rows
          </Link>
          .
        </p>
      </div>
    </React.Fragment>
  );
}
