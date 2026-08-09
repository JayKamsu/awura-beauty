import { ImageResponse } from "next/og";
import { resolveTransparentBrandLogo } from "@/lib/seo/brand-icon";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Image Open Graph / partage social. */
export default async function OpenGraphImage() {
  const logo = await resolveTransparentBrandLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #FAF3EC 0%, #E8DFD4 50%, #D4C4B0 100%)",
          padding: 64,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          width={280}
          height={280}
          alt=""
          style={{ objectFit: "contain", marginBottom: 32 }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#0F3D2E",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.35,
            fontWeight: 500,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
