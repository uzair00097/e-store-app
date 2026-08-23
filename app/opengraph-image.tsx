import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 20,
          padding: 96,
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 40,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#fafafa",
              color: "#0a0a0a",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            {siteConfig.name.charAt(0).toUpperCase()}
          </div>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1a1", maxWidth: 900 }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
