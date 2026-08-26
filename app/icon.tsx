import { ImageResponse } from "next/og";

import { BOLT_PATH_D, BRAND_COLOR, CART_PATH_D } from "@/lib/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: BRAND_COLOR,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
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
