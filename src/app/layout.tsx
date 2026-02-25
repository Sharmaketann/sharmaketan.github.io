import "./global.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Space_Grotesk } from "next/font/google";
import { siteMetadata } from "@/data/siteMetadata";
import Head from "./head";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ENV } from "@/lib/env";
import { GoogleAdsense } from "@/components/google-adsense";
import { headers } from "next/headers";
import { ThemeToggler } from "@/components/theme-toggle";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";

const space_grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  keywords: [...siteMetadata.keywords],
  authors: [{ name: siteMetadata.author, url: siteMetadata.siteUrl }],
  creator: siteMetadata.author,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    siteName: siteMetadata.title,
    images: [
      {
        url: siteMetadata.socialBanner,
        width: 1200,
        height: 630,
        alt: siteMetadata.title,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    card: "summary_large_image",
    images: [siteMetadata.socialBanner],
    creator: "@sharmaketann",
  },
  alternates: {
    canonical: siteMetadata.siteUrl,
    types: {
      "application/rss+xml": `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = headers().get("host") ?? "";
  const isBlogSubdomain = host === "blog.sharmaketann.in" || host.startsWith("blog.sharmaketann.in:");
  const isCvSubdomain = host === "cv.sharmaketann.in" || host.startsWith("cv.sharmaketann.in:");

  const docId = PORTFOLIO_CONFIG.resume.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  const downloadUrl = docId
    ? `https://docs.google.com/document/d/${docId}/export?format=pdf`
    : PORTFOLIO_CONFIG.resume;

  return (
    <html lang="en" suppressHydrationWarning>
      <Head />
      <body
        className={cn(
          "mx-auto min-h-screen max-w-5xl antialiased dark:bg-zinc-950 dark:text-gray-100",
          space_grotesk.className,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {isBlogSubdomain ? (
            <main className="mx-4 px-2 md:px-0 lg:mx-auto flex flex-col min-h-screen">
              <header className="py-6 mb-8 border-b border-gray-100 dark:border-zinc-800">
                <nav className="flex items-center justify-between">
                  <a
                    href="https://sharmaketann.in"
                    className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    ← sharmaketann.in
                  </a>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-wide">
                    Writing
                  </span>
                  <ThemeToggler />
                </nav>
              </header>
              {children}
              <SpeedInsights />
              <Analytics />
              <footer className="mt-auto pt-6 pb-5 border-t border-gray-100 dark:border-zinc-800">
                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                  © {new Date().getFullYear()} Sharma Ketan
                </p>
              </footer>
            </main>
          ) : isCvSubdomain ? (
            <main className="mx-4 px-2 md:px-0 lg:mx-auto flex flex-col min-h-screen">
              <header className="py-6 mb-6 border-b border-gray-100 dark:border-zinc-800">
                <nav className="flex items-center justify-between">
                  <a
                    href="https://sharmaketann.in"
                    className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    ← sharmaketann.in
                  </a>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-wide">
                    Resume
                  </span>
                  <a
                    href={downloadUrl}
                    download="Sharma_Ketan_Resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg border transition-colors duration-200
                               border-gray-200 dark:border-zinc-700
                               text-gray-700 dark:text-gray-300
                               hover:border-[#b86440] hover:text-[#b86440]
                               dark:hover:border-[#b86440] dark:hover:text-[#b86440]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </a>
                </nav>
              </header>
              {children}
              <SpeedInsights />
              <Analytics />
            </main>
          ) : (
            <main className="mx-4 px-2 md:px-0 lg:mx-auto flex flex-col justify-between min-h-screen">
              <Header />
              {children}
              <SpeedInsights />
              <Analytics />
              <Footer />
            </main>
          )}
          <TailwindIndicator />
        </ThemeProvider>
        <GoogleAnalytics gaId={ENV.GOOGLE_ANALYTICS_ID} />
        <GoogleAdsense pId={ENV.ADSENSE_CLIENT_ID} />
      </body>
    </html>
  );
}
