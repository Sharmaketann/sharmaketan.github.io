import { generatePageMetadata } from "../seo";
import { ProjectCard } from "../../components/project-card";
import React from "react";
import { WEB_APPS } from "@/data/projects";
import { THEME } from "@/data/theme";

export const metadata = generatePageMetadata({
  title: "Projects",
  description:
    "View some of my notable open source web apps, npm packages, cli tools and more.",
});

export default function Projects() {
  return (
    <React.Fragment>
      <section>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: "#c08a3e" }}
            />
            <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
              Work
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-5">
            Things built outside work — mostly from the years before the day job
            got interesting. Every one links to its repo.
          </p>
          <div className="flex items-center gap-4 font-mono text-[10px] text-gray-400 dark:text-gray-600">
            <span>
              <span style={{ color: THEME.accent }}>{WEB_APPS.length}</span> shipped
            </span>
            <span className="h-2.5 w-px bg-gray-200 dark:bg-zinc-800" />
            <span>
              <span style={{ color: THEME.accent }}>
                {new Set(WEB_APPS.flatMap((p) => p.tags)).size}
              </span>{" "}
              tools used
            </span>
            <span className="h-2.5 w-px bg-gray-200 dark:bg-zinc-800" />
            <span>all open source</span>
          </div>
        </div>
        <div
          role="list"
          className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2"
        >
          {WEB_APPS.map((project, idx) => (
            <ProjectCard project={project} key={idx} />
          ))}
        </div>
      </section>

    </React.Fragment>
  );
}
