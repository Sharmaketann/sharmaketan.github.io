import React from "react";
import Link from "next/link";
import { generatePageMetadata } from "../seo";
import { PositionBoard } from "@/components/position-board";
import { THEME } from "@/data/theme";

export const metadata = generatePageMetadata({
  title: "The board",
  description:
    "Every position I've held, hanging off a rail on its own string. Drag one to swing it, strike one to hear it.",
});

export default function BoardPage() {
  return (
    <React.Fragment>
      <section className="mb-10">
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
          The same four roles the blotter lists, hung off a rail instead of
          ruled into a table. Each one swings on its own pendulum and rings at
          its own pitch &mdash; the notes are a pentatonic scale, so any two
          struck together still agree.
        </p>
      </section>

      <PositionBoard />

      <p className="mt-10 text-[12px] text-gray-400 dark:text-gray-600">
        The sound is generated in the browser, not played from a file &mdash;
        three sine partials with a slightly sharp second, which is roughly what
        makes metal sound like metal.{" "}
        <Link
          href="/book-journey"
          className="border-b border-gray-300 dark:border-zinc-700 hover:text-[#c08a3e] hover:border-[#c08a3e] transition-colors"
        >
          The blotter has the same data in rows
        </Link>
        .
      </p>
    </React.Fragment>
  );
}
