"use client";

import { motion } from "framer-motion";
import React from "react";

// ── Career data (real resume — newest first) ──────────────────────────────────

const stages = [
  {
    id: 1,
    period: "Aug 2018 – Jun 2021",
    location: "Christ College, Pune University",
    title: "BBA (Computer Application)",
    icon: "🎓",
    description:
      "Three years learning the intersection of business and technology. Graduated with a 7.38 CGPA while building side projects and discovering a love for full-stack development.",
    achievements: [
      "7.38 CGPA across the full programme",
      "Built first MERN stack projects during coursework",
      "Explored UI/UX and frontend fundamentals hands-on",
    ],
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"],
  },
  {
    id: 2,
    period: "Jul 2021 – Oct 2021",
    location: "Ushyaku Software Solution · Remote",
    title: ".NET Developer Intern",
    icon: "💻",
    description:
      "First professional role. Revamped legacy interfaces, built database components, and got deep into SQL Profiler. A crash course in real-world engineering under tight deadlines.",
    achievements: [
      "Revamped and improved existing user interfaces for an ongoing project",
      "Developed database tables, stored procedures, and functions in MS SQL",
      "Used MS SQL SSRS for reporting needs",
      "Mastered ASP.NET, BI tools, and event tracking in SQL using Profiler",
    ],
    tags: ["ASP.NET", "MS SQL", "SQL Profiler", "SSRS", "BI Tools"],
  },
  {
    id: 3,
    period: "Sept 2022 – Oct 2023",
    location: "Sapio Analytics · Mumbai",
    title: "Full Stack Developer",
    icon: "🚀",
    description:
      "Scaled up fast — integrating hundreds of APIs, leading small teams, and mentoring developers. Learned that good code and good communication go hand in hand.",
    achievements: [
      "Integrated 200+ APIs, enhancing project functionality and data integration",
      "Optimised codebases to improve performance, scalability, and maintainability",
      "Led development teams through task delegation and code reviews",
      "Managed and mentored developers, maintaining high-quality standards",
      "Active in debugging, issue resolution, and cross-team communication",
    ],
    tags: ["React", "Node.js", "Express", "REST API", "MySQL", "Leadership"],
  },
  {
    id: 4,
    period: "Nov 2023 – Dec 2025",
    location: "Insure Efficient · Mumbai",
    title: "Full Stack Lead Developer",
    icon: "🌟",
    description:
      "Led a team to build insurance technology that actually works. From a scalable POS portal to deep API integrations across 13+ companies — shipped features that matter.",
    achievements: [
      "Led development of a scalable Point of Sale portal, boosting engagement by 20%",
      "Successfully integrated 200+ APIs from 13+ insurance companies",
      "Responsible for security and integrity of all backend systems",
      "Collaborating with Risk team and DevOps for smooth deployments",
      "Awarded for outstanding performance on the new POS portal",
    ],
    tags: ["Node.js", "React", "Redux", "Express", "TailwindCSS", "MySQL", "AWS EC2"],
  },
  {
    id: 5,
    period: "Jan 2025 – Present",
    location: "Acme Corp · Mumbai",
    title: "Senior Full Stack Engineer",
    icon: "🚀",
    description:
      "Building scalable products and contributing to high-impact engineering initiatives across the stack.",
    achievements: [
      "Joined as a senior engineer to drive product development",
      "Collaborating with cross-functional teams on core platform features",
      "Contributing to architecture decisions and code quality improvements",
    ],
    tags: ["Node.js", "React", "TypeScript", "PostgreSQL", "AWS"],
  },
];

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookJourney() {
  return (
    <section>
      {/* ── Header ── */}
      <div className="mb-16">
        <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-3">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "#b86440" }}
          />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Journey
          </span>
        </motion.div>
        <motion.h1
          {...fadeUp(0.08)}
          className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3"
        >
          The story so far
        </motion.h1>
        <motion.p
          {...fadeUp(0.16)}
          className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed"
        >
          From a BBA classroom in Pune to leading full-stack teams in Mumbai —
          the real chapters, straight from the resume.
        </motion.p>
      </div>

      {/* ── Timeline ── */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100 dark:bg-zinc-800" />

        <div className="flex flex-col gap-12">
          {[...stages].reverse().map((stage, i) => (
            <motion.div
              key={stage.id}
              {...fadeUp(i * 0.07)}
              className="flex gap-6"
            >
              {/* ── Dot ── */}
              <div className="relative shrink-0 mt-1">
                <div
                  className="w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center text-[10px] bg-white dark:bg-zinc-950"
                  style={{ borderColor: "#b86440" }}
                >
                  {stage.icon}
                </div>
              </div>

              {/* ── Content ── */}
              <div className="flex-1 pb-2">
                {/* Meta row */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: "#b86440" }}
                  >
                    {stage.period}
                  </span>
                  <span className="text-xs text-gray-300 dark:text-zinc-700">
                    ·
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {stage.location}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
                  {stage.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-prose">
                  {stage.description}
                </p>

                {/* Achievements */}
                <ul className="space-y-1 mb-4">
                  {stage.achievements.map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                    >
                      <span
                        className="mt-[5px] h-1 w-1 rounded-full shrink-0"
                        style={{ backgroundColor: "#b86440" }}
                      />
                      {a}
                    </li>
                  ))}
                </ul>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {stage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
