"use client";

import Image from "next/image";
import { SOCIALS } from "../data/socials";
import { SocialLink } from "@/components/social-link";
import { allBlogs } from "contentlayer/generated";
import { BlogCard } from "@/components/blog-card";
import React, { useState } from "react";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";
import Link from "next/link";
import { motion } from "framer-motion";
import { ResumeModal } from "@/components/resume-modal";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

// ── What I focus on ──────────────────────────────────────────────────────────

const FOCUS = [
  "Full-stack web application development",
  "API design, integration & backend architecture",
  "Insurance technology & scalable product teams",
];

const TECH = [
  "TypeScript", "React", "Next.js", "Node.js",
  "MongoDB", "PostgreSQL", "Express", "AWS",
];

const STATS = [
  { value: "3+",  label: "Years exp."       },
  { value: "13+", label: "Projects shipped" },
  { value: "3",   label: "Industry domains" },
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
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pb-10">

        {/* ── Main block: text left, photo right ── */}
        <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-8 md:gap-14 pt-2">

          {/* ── Left: editorial text ── */}
          <div className="flex-1 min-w-0">

            {/* Role label */}
            <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6">
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: "#b86440" }}
              />
              <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
                Full Stack Developer
              </span>
            </motion.div>

            {/* Name — editorial split */}
            <div className="mb-7 leading-[0.92]">
              <motion.div
                {...fadeUp(0.08)}
                className="text-[clamp(3rem,9vw,5.5rem)] font-bold tracking-tight text-gray-900 dark:text-gray-100 select-none"
              >
                SHARMA
              </motion.div>

              {/* Terracotta rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.48, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ transformOrigin: "left", backgroundColor: "#b86440", height: "2px" }}
                className="my-2 w-full"
              />

              <motion.div
                {...fadeUp(0.24)}
                className="text-[clamp(3rem,9vw,5.5rem)] font-bold tracking-tight select-none"
                style={{ color: "#b86440" }}
              >
                KETAN
              </motion.div>
            </div>

            {/* Bio */}
            <motion.p
              {...fadeUp(0.32)}
              className="text-gray-600 dark:text-gray-300 max-w-sm mb-7 leading-relaxed text-sm md:text-base"
            >
              Building scalable web apps with JavaScript & the MERN stack.
              Currently shaping insurance tech at{" "}
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
                  <span
                    className="mt-[7px] h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#b86440" }}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </motion.ul>

            {/* Stats row */}
            <motion.div
              {...fadeUp(0.44)}
              className="flex w-fit items-center gap-6 mb-8 py-4 border-y border-gray-100 dark:border-zinc-800"
            >
              {STATS.map(({ value, label }, i) => (
                <React.Fragment key={label}>
                  <div className="text-center">
                    <div
                      className="text-xl font-bold tracking-tight"
                      style={{ color: "#b86440" }}
                    >
                      {value}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 tracking-wide mt-0.5">
                      {label}
                    </div>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="h-7 w-px bg-gray-100 dark:bg-zinc-800" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* Social icons + Resume CTA */}
            <motion.div
              {...fadeUp(0.50)}
              className="flex items-center gap-3 flex-wrap"
            >
              {SOCIALS.map((social) => (
                <SocialLink
                  key={social.label}
                  aria-label={`Follow on ${social.label}`}
                  href={social.href}
                  icon={social.icon}
                />
              ))}

              <button
                onClick={() => setResumeOpen(true)}
                className="ml-1 text-xs tracking-wide px-4 py-2 rounded-lg border transition-colors duration-200
                           border-gray-300 dark:border-gray-700
                           text-gray-700 dark:text-gray-300
                           hover:border-[#b86440] hover:text-[#b86440]
                           dark:hover:border-[#b86440] dark:hover:text-[#b86440]"
              >
                Resume&nbsp;→
              </button>
            </motion.div>
          </div>

          {/* ── Right: photo + availability badge ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-shrink-0 self-start flex flex-col items-center gap-3"
          >
            <Image
              src="/_static/me1.jpg"
              width={224}
              height={224}
              alt={`${PORTFOLIO_CONFIG.name} — avatar`}
              priority
              className="rounded-2xl object-cover w-36 h-36 md:w-56 md:h-56"
            />

            {/* Availability badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: "#b86440" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: "#b86440" }}
                />
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 tracking-wide whitespace-nowrap">
                Open to opportunities
              </span>
            </div>

            {/* Floating code card */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:block w-56 mt-1 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-3.5"
            >
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="h-2 w-2 rounded-full bg-red-400/70" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                <span className="h-2 w-2 rounded-full bg-green-400/70" />
              </div>
              {/* Code lines */}
              <div className="font-mono text-[11px] space-y-1 leading-relaxed">
                <p>
                  <span style={{ color: "#c792ea" }}>const</span>{" "}
                  <span style={{ color: "#82aaff" }}>dev</span>{" "}
                  <span className="text-gray-400">=</span>{" "}
                  <span className="text-gray-400">{"{"}</span>
                </p>
                <p className="pl-3">
                  <span style={{ color: "#c3e88d" }}>name</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span style={{ color: "#f78c6c" }}>&quot;Ketan&quot;</span>
                  <span className="text-gray-400">,</span>
                </p>
                <p className="pl-3">
                  <span style={{ color: "#c3e88d" }}>role</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span style={{ color: "#f78c6c" }}>&quot;FullStack&quot;</span>
                  <span className="text-gray-400">,</span>
                </p>
                <p className="pl-3">
                  <span style={{ color: "#c3e88d" }}>open</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span style={{ color: "#82aaff" }}>true</span>
                  <span className="text-gray-400">,</span>
                </p>
                <p className="text-gray-400">{"}"}</p>
              </div>
              {/* Blinking cursor */}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block mt-1 h-3 w-1.5 rounded-sm"
                style={{ backgroundColor: "#b86440" }}
              />
            </motion.div>
          </motion.div>
        </div>

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
                  style={{ backgroundColor: "#b86440" }}
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
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#b86440] dark:hover:text-[#b86440] transition-colors tracking-wide"
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
