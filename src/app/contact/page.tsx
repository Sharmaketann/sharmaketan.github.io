import React from "react";
import { generatePageMetadata } from "../seo";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import { THEME } from "@/data/theme";

export const metadata = generatePageMetadata({
  title: "Contact",
  description:
    "Get in touch with Sharma Ketan — Senior Backend Developer working on market-data and trading infrastructure in Mumbai.",
});

/**
 * Deliberately no form. A form needs an endpoint, a spam story and a reason
 * to trust it; a mailto needs none of those and lands in the same inbox.
 * The site said "open to opportunities" for months without putting an
 * address anywhere a human could find one.
 */
const CHANNELS = [
  {
    label: "Email",
    value: PORTFOLIO_CONFIG.email,
    href: `mailto:${PORTFOLIO_CONFIG.email}`,
    note: "Best for anything that needs a reply",
    primary: true,
  },
  {
    label: "LinkedIn",
    value: "in/sharmaketann",
    href: PORTFOLIO_CONFIG.socials.linkedin,
    note: "Roles, introductions, the usual",
  },
  {
    label: "GitHub",
    value: "sharmaketann",
    href: PORTFOLIO_CONFIG.socials.github,
    note: "Code, and whatever I have left public",
  },
  {
    label: "X",
    value: "@sharmaketan",
    href: PORTFOLIO_CONFIG.socials.x,
    note: "Occasionally",
  },
];

export default function ContactPage() {
  return (
    <React.Fragment>
      <section className="max-w-[62ch]">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: THEME.accent }}
            />
            <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
              Contact
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
            Get in touch
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            I&apos;m open to backend and platform roles, and happy to talk about
            market-data pipelines, trading infrastructure or anything in the
            insurance-tech corner. Email is the one I actually read.
          </p>
        </div>

        <ul className="border-t border-gray-100 dark:border-zinc-800">
          {CHANNELS.map((c) => (
            <li
              key={c.label}
              className="border-b border-gray-100 dark:border-zinc-800"
            >
              <a
                href={c.href}
                {...(c.href.startsWith("mailto:")
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex items-baseline justify-between gap-4 py-4 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600 mb-1">
                    {c.label}
                  </span>
                  <span
                    className={
                      c.primary
                        ? "block text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-[#c08a3e] transition-colors break-all"
                        : "block text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#c08a3e] transition-colors break-all"
                    }
                  >
                    {c.value}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-600">
                    {c.note}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: THEME.accent }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: THEME.accent }}
            />
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tracking-wide">
            Open to opportunities &middot; Mumbai, IST
          </span>
        </div>
      </section>
    </React.Fragment>
  );
}
