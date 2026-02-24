import { generatePageMetadata } from "../seo";

export const metadata = generatePageMetadata({
  title: "Colophon",
  description: "How this site is built — the stack, tools, and decisions behind sharmaketan.dev.",
});

const stack = [
  {
    category: "Framework",
    items: [
      { name: "Next.js 14", note: "App Router, server components, static generation" },
      { name: "React 18", note: "UI library" },
      { name: "TypeScript", note: "Throughout the entire codebase" },
    ],
  },
  {
    category: "Styling",
    items: [
      { name: "TailwindCSS", note: "Utility-first CSS" },
      { name: "Space Grotesk", note: "Primary typeface, served via Google Fonts" },
    ],
  },
  {
    category: "Content",
    items: [
      { name: "MDX", note: "Blog posts authored in Markdown with JSX support" },
      { name: "Contentlayer", note: "Transforms MDX files into type-safe data" },
      { name: "rehype-pretty-code", note: "Syntax highlighting powered by Shiki (one-dark-pro)" },
    ],
  },
  {
    category: "Animations",
    items: [
      { name: "Framer Motion", note: "Page transitions, timeline, floating card, footer game" },
    ],
  },
  {
    category: "Features",
    items: [
      { name: "Giscus", note: "Blog comments via GitHub Discussions" },
      { name: "next-themes", note: "Dark / light mode without flash" },
      { name: "RSS Feed", note: "Blog feed at /feed.xml" },
      { name: "Open Graph images", note: "Dynamically generated per blog post via Edge runtime" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "Vercel", note: "Hosting, edge network, and preview deployments" },
      { name: "Vercel Analytics", note: "Privacy-friendly page view tracking" },
      { name: "Google Analytics", note: "Additional visitor insights" },
    ],
  },
];

export default function Colophon() {
  return (
    <section>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "#b86440" }}
          />
          <span className="text-xs tracking-[0.22em] uppercase text-gray-500 dark:text-gray-400">
            Meta
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Colophon
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xl">
          A note on how this site is made. The stack is chosen for speed,
          simplicity, and good developer experience — nothing more than what the
          job needs.
        </p>
      </div>

      <div className="space-y-10">
        {stack.map((section) => (
          <div key={section.category}>
            <h2 className="text-xs tracking-[0.18em] uppercase text-gray-400 dark:text-gray-500 mb-4">
              {section.category}
            </h2>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-gray-100 dark:border-zinc-800 pb-3"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100 shrink-0 text-sm">
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

    </section>
  );
}
