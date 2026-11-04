import { generatePageMetadata } from "../seo";
import { ProjectCard } from "../../components/project-card";
import React from "react";
import { WEB_APPS, WORK } from "@/data/projects";
import { POSITIONS, label } from "@/data/career";
import { THEME } from "@/data/theme";

export const metadata = generatePageMetadata({
  title: "Projects",
  description:
    "Trading and insurance platforms built at work, plus the earlier side projects — what each one does and what it was built with.",
});

/**
 * Dates and job titles are not written here. They are looked up from
 * POSITIONS, which is the single source for every date on the site — the
 * same reason the resume and the blotter stopped disagreeing about whether
 * a month was "Sept" or "Sep".
 */
function held(org: string) {
  const p = POSITIONS.find((x) => x.org === org);
  if (!p) return null;
  return {
    role: p.role,
    period: `${label(p.start)} — ${p.end ? label(p.end) : "present"}`,
  };
}

/** Only two of the old side projects stay on the page; the rest fold away. */
const VISIBLE_EARLIER = 2;

export default function Projects() {
  const shown = WEB_APPS.slice(0, VISIBLE_EARLIER);
  const folded = WEB_APPS.slice(VISIBLE_EARLIER);

  return (
    <React.Fragment>
      {/* ── Work ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: THEME.accent }}
            />
            <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
              Work
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[58ch] leading-relaxed">
            The platforms I&apos;ve been paid to build. These are private
            codebases, so there is nothing to link to but the product — what
            follows is what each system does and what it runs on.
          </p>
        </div>

        <div className="space-y-10">
          {WORK.map((w) => {
            const meta = held(w.org);
            return (
              <article
                key={w.org}
                className="border-t border-gray-100 dark:border-zinc-800 pt-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {w.title}
                  </h2>
                  {meta && (
                    <span className="font-mono text-[10.5px] text-gray-400 dark:text-gray-600 whitespace-nowrap">
                      {meta.period}
                    </span>
                  )}
                </div>

                <p className="text-[13px] mb-4">
                  {w.href ? (
                    <a
                      href={w.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium border-b transition-colors"
                      style={{ color: THEME.accent, borderColor: THEME.accent }}
                    >
                      {w.org} &#8599;
                    </a>
                  ) : (
                    <span
                      className="font-medium"
                      style={{ color: THEME.accent }}
                    >
                      {w.org}
                    </span>
                  )}
                  {meta && (
                    <span className="text-gray-400 dark:text-gray-600">
                      {" "}
                      &middot; {meta.role}
                    </span>
                  )}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-[62ch] mb-4">
                  {w.summary}
                </p>

                <ul className="space-y-2 mb-5 max-w-[64ch]">
                  {w.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <span className="mt-[7px] h-1 w-1 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
                      <span className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        {pt}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5">
                  {w.stack.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] px-2 py-1 rounded border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Earlier ───────────────────────────────────────────────────── */}
      <section className="mt-20">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-gray-300 dark:bg-zinc-700" />
            <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
              Earlier
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
            Side projects
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[58ch] leading-relaxed">
            Built while I was learning, mostly in college. Kept here because
            they were how I got the reps in, not because they represent the
            work. Every one still runs and links to its repo.
          </p>
        </div>

        <div
          role="list"
          className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2"
        >
          {shown.map((project, idx) => (
            <ProjectCard project={project} key={idx} />
          ))}
        </div>

        {folded.length > 0 && (
          /* <details> rather than React state: it needs no JS, it is keyboard
             accessible for free, and the contents stay in the DOM for search. */
          <details className="group mt-12">
            <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-xs tracking-wide text-gray-400 dark:text-gray-600 hover:text-[#c08a3e] dark:hover:text-[#c08a3e] transition-colors">
              <span className="font-mono text-[10px]">
                [ + ] {folded.length} more
              </span>
              <span className="group-open:hidden">show</span>
              <span className="hidden group-open:inline">hide</span>
            </summary>
            <div
              role="list"
              className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 mt-10"
            >
              {folded.map((project, idx) => (
                <ProjectCard project={project} key={idx} />
              ))}
            </div>
          </details>
        )}
      </section>
    </React.Fragment>
  );
}
