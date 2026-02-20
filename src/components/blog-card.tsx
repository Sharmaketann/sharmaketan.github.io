import { formatDate } from "@/lib/utils";
import { Blog } from "contentlayer/generated";

type BlogCardProps = Pick<
  Blog,
  "readingTime" | "slug" | "title" | "summary" | "publishedAt"
>;

export function BlogCard({ blog }: { blog: BlogCardProps }) {
  return (
    <article className="group py-5 border-b border-gray-100 dark:border-zinc-800 cursor-pointer transition-colors">
      <div className="flex items-baseline gap-3 mb-2">
        <time
          dateTime={blog.publishedAt}
          className="text-xs text-gray-400 dark:text-gray-500 tabular-nums shrink-0"
        >
          {formatDate(blog.publishedAt)}
        </time>
        <span className="text-xs text-gray-300 dark:text-zinc-700">·</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {blog.readingTime.text}
        </span>
      </div>
      <h3 className="text-base font-semibold leading-snug tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-[#b86440] transition-colors mb-1">
        {blog.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
        {blog.summary}
      </p>
    </article>
  );
}
