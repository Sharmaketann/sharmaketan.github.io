import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteMetadata } from "@/data/siteMetadata";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const hasTitle = searchParams.has("title");
    const postTitle = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "Blog";

    const groteskRegular = await fetch(
      new URL(
        "../../../public/_static/fonts/SpaceGrotesk-Regular.ttf",
        import.meta.url,
      ),
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            color: "white",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          <div
            style={{
              marginLeft: 100,
              marginRight: 100,
              display: "flex",
              fontSize: 65,
              fontFamily: "SpaceGrotesk",
              fontStyle: "normal",
              color: "white",
              whiteSpace: "pre-wrap",
            }}
          >
            {postTitle}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "SpaceGrotesk",
            data: groteskRegular,
            style: "normal",
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
