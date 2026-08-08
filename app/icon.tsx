import { ImageResponse } from "next/og";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon Duafe (ou asset admin). */
export default async function Icon() {
  const settings = await getSiteBrandSettings();
  if (settings.duafeUrl?.startsWith("http")) {
    return Response.redirect(settings.duafeUrl, 307);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F3D2E",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#E59136",
          }}
        >
          <div
            style={{
              width: 18,
              height: 10,
              background: "#E59136",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              width: 36,
              height: 8,
              background: "#E59136",
              borderRadius: 2,
              marginTop: 2,
            }}
          />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {[28, 30, 28, 30, 26].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: h,
                  background: "#E59136",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
