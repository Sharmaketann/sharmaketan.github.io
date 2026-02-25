import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const isBlogSubdomain =
    hostname === "blog.sharmaketann.in" ||
    hostname.startsWith("blog.sharmaketann.in:");

  if (isBlogSubdomain) {
    const { pathname } = req.nextUrl;

    // Strip /blog prefix and redirect to clean URL
    // blog.sharmaketann.in/blog         → blog.sharmaketann.in/
    // blog.sharmaketann.in/blog/my-post → blog.sharmaketann.in/my-post
    if (pathname.startsWith("/blog")) {
      const cleanPath = pathname.replace(/^\/blog/, "") || "/";
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = cleanPath;
      return NextResponse.redirect(redirectUrl);
    }

    // Rewrite clean slug paths to internal /blog/* routes
    // blog.sharmaketann.in/my-post  → /blog/my-post
    // (/ is handled directly by page.tsx via headers())
    if (pathname !== "/") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = `/blog${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public files (e.g. robots.txt, sitemap.xml)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
  ],
};
