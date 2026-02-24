import { MetadataRoute } from "next";
import { allBlogs } from "contentlayer/generated";
import { siteMetadata } from "@/data/siteMetadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl;
  const blogRoutes = allBlogs.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt,
  }));

  const routes = ["", "blog", "projects", "book-journey", "colophon"].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route === "" ? "weekly" : "monthly" as "weekly" | "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  return [...routes, ...blogRoutes];
}
