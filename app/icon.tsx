import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Full-bleed square on purpose: iOS applies its own corner mask.
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
          background: "#2e5fdb",
          color: "#f8faff",
          fontSize: 266,
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
