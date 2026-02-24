import { BlogCard } from "@/components/blog-card";
import { allBlogs } from "contentlayer/generated";
import { generatePageMetadata } from "../seo";
import Link from "next/link";
import { ENV } from "@/lib/env";

export const metadata = generatePageMetadata({
  title: "Blog",
  description: "Read my blogs on web development, design and more.",
});

const isProd = ENV.NODE_ENV === "production";

export default function Blog() {
  const blogs = allBlogs.sort((a, b) => {
    if (new Date(a.publishedAt) > new Date(b.publishedAt)) {
      return -1;
    }
    return 1;
  });

  const undraftedBlogs = isProd ? blogs.filter((blog) => !blog.draft) : blogs;

  return (
    <section>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "#b86440" }}
          />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Writing
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            All posts
          </h1>
          <a
            href="/feed.xml"
            title="RSS Feed"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#b86440] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
            </svg>
          </a>
        </div>
      </div>
      <ul>
        {undraftedBlogs.map((blog) => (
          <li key={blog.slug}>
            <Link href={`/blog/${blog.slug}`}>
              <BlogCard blog={blog} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
