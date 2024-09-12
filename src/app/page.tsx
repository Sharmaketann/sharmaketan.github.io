"use client";
import Image from "next/image";
import { SOCIALS } from "../data/socials";
import { SocialLink } from "@/components/social-link";
import { allBlogs } from "contentlayer/generated";
import { BlogCard } from "@/components/blog-card";
import React from "react";
import { LINKS } from "@/lib/constants";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
export default function Home() {
  const blogs = allBlogs.slice(0, 2).sort((a, b) => {
    if (new Date(a.publishedAt) > new Date(b.publishedAt)) {
      return -1;
    }
    return 1;
  });

  return (
    <React.Fragment>
      <section className="mb-5">
        <div className="flex flex-row justify-between">
          <Image
            src="/_static/me1.jpg"
            width={300}
            height={300}
            alt="avatar"
            className="rounded-full cursor-pointer hover:grayscale mb-5"
            priority
          />
          {/* <div className="flex flex-col">
            <DotLottieReact src="/_static/gif1.json" loop autoplay />
          </div> */}
        </div>
        <h1 className="text-2xl font-bold">Sharma Ketan</h1>

        <div className="text-gray-700 dark:text-gray-300">
          <p className="mt-4">
            I’m a full stack developer specializing in building scalable web
            applications with rich user interfaces using JavaScript and the MERN
            stack.
          </p>
          <p className="mt-4 mb-4">
            Over the years, I&apos;ve worked on diverse projects in the
            insurance, analytics, and e-commerce domains, leading teams and
            delivering high-quality, end-to-end solutions. I&apos;ve also
            integrated complex APIs and optimized applications for performance.
            Currently, I’m focused on creating cutting-edge solutions at &nbsp;
            <a
              href="https://insureefficient.com/"
              target="_blank"
              className="border-b inline-block"
            >
              insureefficient.com
            </a>
            .
          </p>

          <p className="mb-4">
            If you&apos;d like to collaborate, please&nbsp;
            <a
              href="mailto:sharmaketann@gmail.com"
              className="border-b inline-block"
            >
              send me an email
            </a>
            &nbsp;or reach out on any of my social handles.
          </p>
        </div>

        <div className="flex space-x-4 mb-2 mt-4">
          {SOCIALS.map((social) => (
            <SocialLink
              key={social.label}
              aria-label={`Follow on ${social.label}`}
              href={social.href}
              icon={social.icon}
            />
          ))}
        </div>
        <p className="mt-4 border-b inline-block cursor-pointer">
          <a href={LINKS.RESUME} target="_blank" rel="noopener noreferrer">
            View Resume
          </a>
        </p>
      </section>

      <div className="my-8 w-full border-t border-gray-200 dark:border-gray-800" />

      <div>
        <h2 className="mb-6 text-2xl font-bold">Latest posts</h2>
        <ul>
          {blogs.map((blog) => (
            <li key={blog.slug} className="py-1">
              <Link href={`/blog/${blog.slug}`}>
                <BlogCard blog={blog} key={blog.slug} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </React.Fragment>
  );
}
