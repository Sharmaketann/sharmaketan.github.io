import type { Metadata } from "next";
import { siteMetadata } from "@/data/siteMetadata";

/**
 * The paper edition is a second presentation of the homepage, not new
 * content, so it points its canonical at the homepage. Without that, two
 * URLs carrying the same words compete with each other in search.
 */
export const metadata: Metadata = {
  title: "Paper edition",
  description:
    "Sharma Ketan's portfolio, set as a printed spec sheet — positions held, what was built, and the public API behind it.",
  alternates: { canonical: siteMetadata.siteUrl },
  openGraph: {
    title: `Paper edition | ${siteMetadata.title}`,
    description:
      "The same data as the terminal site, set on paper: positions, work, and a public API you can curl.",
    url: `${siteMetadata.siteUrl}/paper`,
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: "en_US",
    type: "website",
  },
};

export default function PaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
