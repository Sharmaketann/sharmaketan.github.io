import { PORTFOLIO_CONFIG } from "./portfolio.config";

export const siteMetadata = {
  title: PORTFOLIO_CONFIG.site.title,
  author: PORTFOLIO_CONFIG.name,
  siteUrl: PORTFOLIO_CONFIG.site.url,
  socialBanner: PORTFOLIO_CONFIG.site.socialBanner,
  description: PORTFOLIO_CONFIG.site.description,
  keywords: PORTFOLIO_CONFIG.site.keywords,
  social: {
    email: PORTFOLIO_CONFIG.email,
    x: PORTFOLIO_CONFIG.socials.xProfile,
    linkedinLink: PORTFOLIO_CONFIG.socials.linkedin,
    githubLink: PORTFOLIO_CONFIG.socials.github,
  },
};
