import { PORTFOLIO_CONFIG } from "./portfolio.config";

/**
 * Derived, never typed twice. The Twitter card creator used to be hardcoded
 * as "@sharmaketann" in three files while the profile URL said something
 * else; deriving it means the card can only ever credit the account the
 * site actually links to.
 */
const xHandle = `@${PORTFOLIO_CONFIG.socials.x.replace(/\/+$/, "").split("/").pop()}`;

export const siteMetadata = {
  xHandle,
  title: PORTFOLIO_CONFIG.site.title,
  author: PORTFOLIO_CONFIG.name,
  siteUrl: PORTFOLIO_CONFIG.site.url,
  socialBanner: PORTFOLIO_CONFIG.site.socialBanner,
  description: PORTFOLIO_CONFIG.site.description,
  keywords: PORTFOLIO_CONFIG.site.keywords,
  social: {
    email: PORTFOLIO_CONFIG.email,
    x: PORTFOLIO_CONFIG.socials.x,
    linkedinLink: PORTFOLIO_CONFIG.socials.linkedin,
    githubLink: PORTFOLIO_CONFIG.socials.github,
  },
};
