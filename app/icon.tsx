import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

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
          background:
            "linear-gradient(160deg, #f9f6ef 0%, #efe8dc 55%, #d8e6de 100%)"
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            border: "10px solid rgba(255,255,255,0.8)",
            background: "#1f2937",
            color: "#faf7f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 180,
            fontWeight: 700
          }}
        >
          G
        </div>
      </div>
    ),
    size
  );
}
