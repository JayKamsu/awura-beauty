import { ImageResponse } from "next/og";
import { resolveTransparentBrandLogo } from "@/lib/seo/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Icône Apple Touch — logo transparent sur fond clair charte. */
export default async function AppleIcon() {
  const logo = await resolveTransparentBrandLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF3EC",
          borderRadius: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          width={140}
          height={140}
          alt=""
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
