import { ImageResponse } from "next/og";

import { BOLT_PATH_D, BRAND_COLOR, CART_PATH_D } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLOR,
        }}
      >
        <svg
          width="104"
          height="104"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" fill="white" stroke="none" />
          <circle cx="19" cy="21" r="1" fill="white" stroke="none" />
          <path d={CART_PATH_D} />
          <path d={BOLT_PATH_D} fill="white" stroke="none" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
