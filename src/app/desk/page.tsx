import React from "react";
import { generatePageMetadata } from "../seo";
import { DeskHero } from "@/components/desk/desk-hero";

export const metadata = generatePageMetadata({
  title: "The desk",
  description:
    "The homepage hero with the furniture taken away — the same name, the same numbers, the whole screen.",
});

export default function DeskPage() {
  return (
    <React.Fragment>
      {/*
        Breaks out of the 1280px column to full viewport width.

        Same trick the ticker uses: shift the left edge to the centre of the
        containing block, then pull back by half the viewport. The layout's
        <main> keeps the column for every other route, and body's overflow-x
        clip absorbs the scrollbar's worth of overhang this creates.

        The terminal chrome stays above it on purpose. The last two full-bleed
        pages on this site were dropped for feeling like separate websites;
        this one is reachable from the header, keeps the nav, and links back.
      */}
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <DeskHero />
      </div>
    </React.Fragment>
  );
}
