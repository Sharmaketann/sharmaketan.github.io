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
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }

    // Rewrite clean paths to internal /blog/* routes
    // blog.sharmaketann.in/         → /blog
    // blog.sharmaketann.in/my-post  → /blog/my-post
    const rewritePath = pathname === "/" ? "/blog" : `/blog${pathname}`;
    return NextResponse.rewrite(new URL(rewritePath, req.url));
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
