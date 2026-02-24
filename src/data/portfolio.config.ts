/**
 * PORTFOLIO CONFIGURATION — single source of truth.
 *
 * Update this file whenever you change your personal info, social links,
 * nav items, resume URL, or site metadata. Everything else derives from here.
 */
export const PORTFOLIO_CONFIG = {
  // ── Personal ─────────────────────────────────────────────────────────────
  name: "Sharma Ketan",
  email: "sharmaketann@gmail.com",
  currentEmployer: {
    name: "acmecorp.com",
    url: "https://acmecorp.com/",
  },

  // ── Resume ───────────────────────────────────────────────────────────────
  resume:
    "https://docs.google.com/document/d/11nailFw-GIoPC6kGwui0lhpHbt2DxQBH/edit?usp=sharing&ouid=118007732148090101784&rtpof=true&sd=true",

  // ── Site ─────────────────────────────────────────────────────────────────
  site: {
    url: "https://sharmaketann.in",
    title: "Sharma Ketan",
    description:
      "Sharma Ketan - Fullstack developer passionate about creating and sharing things on internet",
    socialBanner: "/_static/default-og-card.png",
    keywords: ["Sharma Ketan", "sharmaketan", "sharmaketann", "sharmaketann.in"],
  },

  // ── Social links ─────────────────────────────────────────────────────────
  socials: {
    /** Used for the icon links on the home page */
    github: "https://github.com/sharmaketann",
    x: "https://x.com/sharmaketann",
    linkedin: "https://www.linkedin.com/in/sharmaketann",
    /** Used in the footer copyright link */
    xProfile: "https://x.com/sharmaketan",
  },

  // ── Navigation ───────────────────────────────────────────────────────────
  /** Drives the header. Add or remove routes here to update the nav. */
  nav: [
    { path: "/", name: "Home" },
    { path: "/blog", name: "Blog" },
    { path: "/projects", name: "Projects" },
  ] as const,
} as const;
