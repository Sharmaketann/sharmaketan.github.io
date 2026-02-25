import { headers } from "next/headers";
import HomeClient from "./home-client";
import Blog from "./blog/page";
import CvPage from "./cv/page";

export default function Page() {
  const host = headers().get("host") ?? "";
  if (host === "blog.sharmaketann.in") return <Blog />;
  if (host === "cv.sharmaketann.in") return <CvPage />;
  return <HomeClient />;
}
