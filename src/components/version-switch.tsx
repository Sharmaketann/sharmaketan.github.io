import Link from "next/link";

/**
 * Moves between the two editions of this site.
 *
 * Same content, same data, two different arguments about how a portfolio
 * should look: the terminal one and the printed one. Each footer carries
 * the way out to the other.
 */
export function VersionSwitch({ to }: { to: "paper" | "terminal" }) {
  const paper = to === "paper";

  return (
    <Link
      href={paper ? "/paper" : "/"}
      className={
        paper
          ? "group inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-800 px-3.5 py-1.5 text-[11px] tracking-wide text-gray-500 dark:text-gray-400 hover:border-[#c08a3e] hover:text-[#c08a3e] dark:hover:border-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors"
          : "group inline-flex items-center gap-2 rounded-full border border-[#14110c]/25 px-3.5 py-1.5 text-[11px] tracking-wide text-[#6f6a60] hover:border-[#c08a3e] hover:text-[#c08a3e] transition-colors"
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125"
        style={{ backgroundColor: "#c08a3e" }}
      />
      {paper ? "Read the paper edition" : "Back to the terminal"}
      <span className="transition-transform duration-300 group-hover:translate-x-0.5">
        &rarr;
      </span>
    </Link>
  );
}
