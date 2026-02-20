import { generatePageMetadata } from "../seo";
import { ProjectCard } from "../../components/project-card";
import React from "react";
import { WEB_APPS } from "@/data/projects";

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
              style={{ backgroundColor: "#b86440" }}
            />
            <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
              Work
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Projects
          </h1>
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
