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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          All posts
        </h1>
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
