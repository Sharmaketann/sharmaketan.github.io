"use client";

import { SOCIALS } from "../data/socials";
import { SocialLink } from "@/components/social-link";
import { allBlogs } from "contentlayer/generated";
import { BlogCard } from "@/components/blog-card";
import React, { useState } from "react";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import Link from "next/link";
import { motion } from "framer-motion";
import { ResumeModal } from "@/components/resume-modal";
import { CareerCurve } from "@/components/career-curve";
import { MarketStatusPill } from "@/components/market-status";
import { Tearsheet } from "@/components/tearsheet";
import { PositionsBook } from "@/components/positions-book";
import { ApiProof } from "@/components/api-proof";
import { LanyardPass } from "@/components/lanyard-pass";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

// ── What I focus on ──────────────────────────────────────────────────────────

const FOCUS = [
  "Real-time data pipelines & backend services",
  "API design, integration & data pipelines",
  "Trading infrastructure, fintech & insurance technology",
];

const TECH = [
  "TypeScript", "React", "Next.js", "Node.js",
  "MongoDB", "PostgreSQL", "Express", "AWS",
];

// ── What I'm working on right now ────────────────────────────────────────────

const CURRENT = {
  company: "Wizzer AdvisorTech",
  url: "https://wizzer.in/",
  what: "Market-data streaming and the backtesting engine behind an AI quant & algo trading terminal.",
  stack: ["TypeScript", "Python", "ClickHouse", "Redis"],
};

// ── Structured data ───────────────────────────────────────────────────────────

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Sharma Ketan",
    url: PORTFOLIO_CONFIG.site.url,
    jobTitle: "Senior Backend Developer",
    knowsAbout: ["TypeScript", "Node.js", "React", "Next.js", "MongoDB", "PostgreSQL", "AWS"],
    sameAs: [
      PORTFOLIO_CONFIG.socials.github,
      PORTFOLIO_CONFIG.socials.linkedin,
      PORTFOLIO_CONFIG.socials.x,
    ],
    email: PORTFOLIO_CONFIG.email,
    worksFor: {
      "@type": "Organization",
      name: PORTFOLIO_CONFIG.currentEmployer.name,
      url: PORTFOLIO_CONFIG.currentEmployer.url,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: PORTFOLIO_CONFIG.site.url,
    name: PORTFOLIO_CONFIG.site.title,
    description: PORTFOLIO_CONFIG.site.description,
    author: { "@type": "Person", name: "Sharma Ketan" },
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [resumeOpen, setResumeOpen] = useState(false);

  const blogs = allBlogs
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, 3);

  return (
    <React.Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pb-10">

        {/* ── Main block: text left, photo right ── */}
        <div className="grid md:grid-cols-12 lg:grid-cols-[1fr_minmax(0,500px)] gap-10 md:gap-12 pt-2 items-start">

          {/* ── Left: editorial text ── */}
          <div className="md:col-span-7 lg:col-span-1 min-w-0">

            {/* Role label */}
            <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6">
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: "#c08a3e" }}
              />
              <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
                Senior Backend Developer
              </span>
            </motion.div>

            {/* Name — wordmark */}
            <div className="mb-6 leading-[0.95]">
              <motion.h1
                {...fadeUp(0.08)}
                className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold tracking-tight text-gray-900 dark:text-gray-100 select-none"
              >
                SHARMA <span style={{ color: "#c08a3e" }}>KETAN</span>
              </motion.h1>

              {/* Terracotta rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.48, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ transformOrigin: "left", backgroundColor: "#c08a3e", height: "2px" }}
                className="mt-3.5 w-full max-w-sm"
              />
            </div>

            {/* The claim — the loudest sentence on the page */}
            <motion.p
              {...fadeUp(0.24)}
              className="text-[clamp(1.375rem,2.6vw,1.875rem)] font-medium leading-[1.25] tracking-tight text-gray-900 dark:text-gray-100 max-w-[20ch] mb-5"
            >
              I build the backend for systems that move money.
            </motion.p>

            {/* Bio */}
            <motion.p
              {...fadeUp(0.32)}
              className="text-gray-600 dark:text-gray-300 max-w-[66ch] mb-7 leading-relaxed text-sm md:text-base"
            >
              Four years across insurance and capital markets. I led the team
              behind an insurance Point of Sale platform and wired up 200+
              carrier APIs — now I&apos;m building trading infrastructure at{" "}
              <a
                href={PORTFOLIO_CONFIG.currentEmployer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-current hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {PORTFOLIO_CONFIG.currentEmployer.name}
              </a>
              .
            </motion.p>

            {/* Focus areas */}
            <motion.ul {...fadeUp(0.38)} className="space-y-2 mb-8">
              {FOCUS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1 w-1 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </motion.ul>

            {/* Tearsheet — factsheet shape, drawdown included */}
            <motion.div {...fadeUp(0.44)} className="mb-8">
              <Tearsheet />
            </motion.div>

            {/* Social icons + Resume CTA */}
            <motion.div
              {...fadeUp(0.50)}
              className="flex items-center gap-3 flex-wrap mb-5"
            >
              {SOCIALS.map((social) => (
                <SocialLink
                  key={social.label}
                  aria-label={`Follow on ${social.label}`}
                  href={social.href}
                  icon={social.icon}
                />
              ))}

              <ApiProof />

              <button
                onClick={() => setResumeOpen(true)}
                className="ml-1 text-xs tracking-wide px-4 py-2 rounded-lg border transition-colors duration-200
                           border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-300
                           hover:border-[#c08a3e] hover:text-[#c08a3e]
                           dark:hover:border-[#c08a3e] dark:hover:text-[#c08a3e]"
              >
                Resume&nbsp;→
              </button>
            </motion.div>

            {/* Availability badge.
                mb-8 matches the rhythm the rest of this column uses (mb-5
                through mb-8). This block and the one above it had no bottom
                margin at all, so the socials, the Resume button, the pill and
                the Currently card were stacked flush against each other. */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-8">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: "#c08a3e" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: "#c08a3e" }}
                />
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 tracking-wide whitespace-nowrap">
                Open to opportunities
              </span>
            </div>

            {/* ── Currently: what I'm actually building ── */}
            <motion.div
              {...fadeUp(0.34)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Currently
                </span>
                {/* An equity curve — the shape I stare at all day */}
                <svg
                  viewBox="0 0 120 32"
                  className="h-5 w-[92px] shrink-0 overflow-visible"
                  aria-hidden="true"
                >
                  <polyline
                    points="1,26.8 6.1,25.8 11.3,26.3 16.4,24.6 21.5,23.4 26.7,24.2 31.8,22.2 36.9,21 42,21.8 47.2,19.8 52.3,18.2 57.4,18.9 62.6,17.2 67.7,15.5 72.8,16.2 77.9,14.1 83.1,12.9 88.2,13.6 93.3,11.4 98.5,9.8 103.6,8.3 108.7,9 113.8,6.9 119,5.2"
                    fill="none"
                    stroke="#c08a3e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="119" cy="5.2" r="2.2" fill="#c08a3e" />
                </svg>
              </div>

              <a
                href={CURRENT.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors"
              >
                {CURRENT.company} &#8599;
              </a>

              <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
                {CURRENT.what}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {CURRENT.stack.map((s) => (
                  <span
                    key={s}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right: the pass ──
              Plain div on purpose, and it must stay plain. framer-motion
              animates with a transform, and a transformed ancestor becomes the
              containing block for positioned descendants — which would re-anchor
              the pass to this column instead of to `main`. The column itself
              still reserves its 500px track, which is the space the pass is
              sized to hang in. */}
          <div className="md:col-span-5 lg:col-span-1 w-full flex flex-col items-start gap-4">
            <LanyardPass />
          </div>
        </div>

        {/* ── Career plotted as an equity curve ── */}
        <motion.div
          {...fadeUp(0.56)}
          className="mt-12 pt-6 border-t border-gray-100 dark:border-zinc-800"
        >
          <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "#c08a3e" }}
            >
              Career curve
            </span>
            <span className="font-mono text-[9.5px] text-gray-400 dark:text-gray-600">
              Jul 2021 &rarr; today &middot; flat leg is the gap, not a rendering bug
            </span>
          </div>
          <CareerCurve />
        </motion.div>

        {/* ── Tech stack strip ── */}
        <motion.div
          {...fadeUp(0.56)}
          className="flex flex-wrap gap-x-3 gap-y-1.5 mt-10 w-fit"
        >
          {TECH.map((tech) => (
            <span
              key={tech}
              className="text-[11px] text-gray-400 dark:text-gray-600 tracking-wide"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── The book: engineering opinions as positions ─────────────────── */}
      <PositionsBook />

      {/* ── Latest posts — below the fold ───────────────────────────────── */}
      <section className="pt-16 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#c08a3e" }}
                />
                <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
                  Writing
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Latest posts
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors tracking-wide"
            >
              All posts →
            </Link>
          </div>

          <ul>
            {blogs.map((blog) => (
              <li key={blog.slug}>
                <Link href={`/blog/${blog.slug}`}>
                  <BlogCard blog={blog} />
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </React.Fragment>
  );
}
