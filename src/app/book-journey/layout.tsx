import { generatePageMetadata } from "../seo";

/**
 * page.tsx is a client component, so it cannot export `metadata` itself.
 * The route was falling through to the site-wide title as a result, which
 * is why it needs a layout of its own.
 */
export const metadata = generatePageMetadata({
  title: "Journey",
  description:
    "Four years of backend work read as a trade blotter — every role as a position, with entry, exit, time held and what it returned.",
});

export default function BookJourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
