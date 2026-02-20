import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { FooterGame } from "./footer-game";

export function Footer() {
  return (
    <footer>
      <FooterGame />
      <div className="flex justify-center pt-6 pb-5">
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
      </div>
    </footer>
  );
}
