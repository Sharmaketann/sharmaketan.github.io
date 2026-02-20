import { GitHubIcon, LinkIcon } from "@/components/icons";
import { WEB_APPS } from "@/data/projects";
import Image from "next/image";
import Link from "next/link";

type Props = {
  project: (typeof WEB_APPS)[number];
};

export const ProjectCard = ({ project }: Props) => {
  return (
    <div className="group flex flex-col" key={project.title}>
      {/* Thumbnail */}
      <div className="overflow-hidden rounded-lg mb-4 border border-gray-100 dark:border-zinc-800">
        <Image
          src={project.thumbnail}
          alt={`Screenshot of ${project.title}`}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          width={600}
          height={340}
          unoptimized
        />
      </div>

      {/* Title + links row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {project.title}
        </h3>
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          <Link
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source code"
            className="text-gray-400 dark:text-gray-500 hover:text-[#b86440] dark:hover:text-[#b86440] transition-colors"
          >
            <GitHubIcon className="h-4 w-4" />
          </Link>
          <Link
            href={project.external}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Live site"
            className="text-gray-400 dark:text-gray-500 hover:text-[#b86440] dark:hover:text-[#b86440] transition-colors"
          >
            <LinkIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-3">
        {project.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
