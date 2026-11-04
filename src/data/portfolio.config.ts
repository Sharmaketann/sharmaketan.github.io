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
    name: "wizzer.in",
    url: "https://wizzer.in/",
  },

  // ── Resume ───────────────────────────────────────────────────────────────
  /**
   * Served from /public. Self-hosted rather than a Google Doc so the file is
   * real selectable text (Google Docs held the skills section as an image,
   * which ATS parsers read as nothing) and so `download` actually works —
   * the attribute is ignored cross-origin.
   * To update: replace public/Sharma_Ketan_Resume.pdf.
   */
  resume: "/Sharma_Ketan_Resume.pdf",
  resumeFileName: "Sharma_Ketan_Resume.pdf",

  // ── Site ─────────────────────────────────────────────────────────────────
  site: {
    url: "https://sharmaketann.in",
    title: "Sharma Ketan",
    description:
      "Sharma Ketan — Senior Backend Developer specializing in TypeScript, Node.js, React and Next.js. Building algo-trading and insurance technology in Mumbai, India.",
    socialBanner: "/og?title=Sharma+Ketan",
    keywords: [
      "Sharma Ketan",
      "sharmaketan",
      "sharmaketann",
      "sharmaketann.in",
      "Senior Backend Developer",
      "Full Stack Developer",
      "React Developer",
      "Next.js Developer",
      "Node.js Developer",
      "TypeScript",
      "MERN Stack",
      "Web Developer Mumbai",
      "JavaScript Developer India",
      "Backend Developer Mumbai",
      "Fintech Developer India",
    ],
  },

  // ── Social links ─────────────────────────────────────────────────────────
  socials: {
    github: "https://github.com/sharmaketann",
    /**
     * One handle, used everywhere. There used to be two - `x` for the icon
     * links and `xProfile` for the footer - and they disagreed. The icon
     * pointed at x.com/sharmaketann, which 404s; the footer had the live
     * account. Single-valued so they cannot drift apart again.
     */
    x: "https://x.com/sharmaketan",
    linkedin: "https://www.linkedin.com/in/sharmaketann",
  },

  // ── Navigation ───────────────────────────────────────────────────────────
  /** Drives the header. Add or remove routes here to update the nav. */
  nav: [
    { path: "/", name: "Home" },
    { path: "/blog", name: "Blog" },
    { path: "/projects", name: "Projects" },
    { path: "/backtest", name: "Backtest" },
    { path: "/api-docs", name: "API" },
  ] as const,
} as const;
