import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { FooterGame } from "./footer-game";
import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <FooterGame />
      <div className="flex flex-col items-center gap-1.5 pt-6 pb-5">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()}&nbsp;
          <a
            href={PORTFOLIO_CONFIG.socials.xProfile}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PORTFOLIO_CONFIG.name}.
          </a>
          &nbsp; All rights reserved.
        </p>
        <Link
          href="/colophon"
          className="text-xs text-gray-400 dark:text-gray-600 hover:text-[#b86440] dark:hover:text-[#b86440] transition-colors"
        >
          Colophon
        </Link>
      </div>
    </footer>
  );
}
