import { GitHubIcon, LinkedInIcon, XIcon } from "../components/icons";
import { PORTFOLIO_CONFIG } from "./portfolio.config";

export const SOCIALS = [
  {
    label: "GitHub",
    href: PORTFOLIO_CONFIG.socials.github,
    icon: GitHubIcon,
  },
  {
    label: "X",
    href: PORTFOLIO_CONFIG.socials.x,
    icon: XIcon,
  },
  {
    label: "LinkedIn",
    href: PORTFOLIO_CONFIG.socials.linkedin,
    icon: LinkedInIcon,
  },
];
