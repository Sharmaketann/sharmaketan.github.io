import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { Arcade } from "./arcade";
import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <Arcade />
      <div className="flex flex-col items-center gap-1.5 pt-6 pb-5">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()}&nbsp;
          <a
            href={PORTFOLIO_CONFIG.socials.x}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PORTFOLIO_CONFIG.name}.
          </a>
          &nbsp; All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="text-xs text-gray-400 dark:text-gray-600 hover:text-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors"
          >
            Contact
          </Link>
          <span className="h-2.5 w-px bg-gray-200 dark:bg-zinc-800" />
          <Link
            href="/colophon"
            className="text-xs text-gray-400 dark:text-gray-600 hover:text-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors"
          >
            Colophon
          </Link>
        </div>
      </div>
    </footer>
  );
}
