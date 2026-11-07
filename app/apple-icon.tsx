import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed square on purpose: iOS applies its own corner mask.
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
          background: "#2e5fdb",
          color: "#f8faff",
          fontSize: 94,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        HT
      </div>
    ),
    { ...size },
  );
}
