import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Social card.
 *
 * Previously a blue gradient left over from the original template, which no
 * longer matched anything on the site. Redrawn in the site's own palette:
 * graphite ground, faint price grid, brass rule, and the same equity curve
 * that closes the homepage — so a shared link looks like it came from here.
 *
 * Everything is plain divs and an inline SVG because Satori (what next/og
 * renders with) supports only a subset of CSS — no box-shadow blur tricks,
 * no background-image shorthand with multiple layers, and every element in a
 * flex container needs an explicit display.
 */

const INK = "#0b0e12";
const BRASS = "#c08a3e";
const MUTED = "#79828f";
const UP = "#1fa97a";

const CURVE =
  "M0,96 L40,92 L80,97 L120,86 L160,80 L200,84 L240,70 L280,62 L320,66 " +
  "L360,52 L400,44 L440,48 L480,34 L520,26 L560,30 L600,14";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const title = searchParams.get("title")?.slice(0, 110) || "Sharma Ketan";
    const kicker = searchParams.get("kicker")?.slice(0, 48) || "sharmaketann.in";

    const grotesk = await fetch(
      new URL("../../../public/_static/fonts/SpaceGrotesk-Regular.ttf", import.meta.url),
    ).then((r) => r.arrayBuffer());

    // Grid drawn as explicit lines — Satori has no repeating-linear-gradient.
    const vLines = Array.from({ length: 13 }, (_, i) => i * 100);
    const hLines = Array.from({ length: 7 }, (_, i) => i * 105);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: INK,
            fontFamily: "SpaceGrotesk",
            position: "relative",
          }}
        >
          {/* Price grid */}
          {vLines.map((x) => (
            <div
              key={`v${x}`}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: 1,
                height: 630,
                backgroundColor: "rgba(148,163,184,0.07)",
              }}
            />
          ))}
          {hLines.map((y) => (
            <div
              key={`h${y}`}
              style={{
                position: "absolute",
                left: 0,
                top: y,
                width: 1200,
                height: 1,
                backgroundColor: "rgba(148,163,184,0.07)",
              }}
            />
          ))}

          {/* Equity curve, bottom-right, bleeding off the edge */}
          <div style={{ position: "absolute", right: 0, bottom: 0, display: "flex" }}>
            <svg width="600" height="110" viewBox="0 0 600 110">
              <path d={CURVE} fill="none" stroke={BRASS} strokeWidth="3" strokeOpacity="0.55" />
              <circle cx="600" cy="14" r="6" fill={UP} />
            </svg>
          </div>

          {/* Kicker */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 72, marginLeft: 84 }}>
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, backgroundColor: BRASS }} />
            <div
              style={{
                display: "flex",
                marginLeft: 14,
                fontSize: 22,
                letterSpacing: 4,
                color: MUTED,
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              marginLeft: 84,
              marginRight: 180,
              fontSize: title.length > 60 ? 54 : 66,
              lineHeight: 1.15,
              color: "#f2f5f8",
            }}
          >
            {title}
          </div>

          {/* Footer rule + byline */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 64 }}>
            <div
              style={{
                display: "flex",
                marginLeft: 84,
                marginBottom: 20,
                width: 120,
                height: 3,
                backgroundColor: BRASS,
              }}
            />
            <div style={{ display: "flex", marginLeft: 84, fontSize: 24, color: MUTED }}>
              Sharma Ketan &nbsp;·&nbsp; Senior Backend Developer
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: "SpaceGrotesk", data: grotesk, style: "normal" }],
      },
    );
  } catch (e: any) {
    console.log(`og: ${e.message}`);
    return new Response("Failed to generate the image", { status: 500 });
  }
}
