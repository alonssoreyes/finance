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
            "radial-gradient(circle at top left, rgba(16,152,247,0.28), transparent 28%), radial-gradient(circle at bottom right, rgba(20,200,178,0.2), transparent 24%), linear-gradient(160deg, #f8fbff 0%, #edf4fb 100%)"
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            border: "10px solid rgba(255,255,255,0.82)",
            background:
              "linear-gradient(145deg, #0b1628 0%, #102342 52%, #1098f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <svg
            fill="none"
            viewBox="0 0 32 32"
            style={{ width: 180, height: 180 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 25V7.5H17.8C22.1 7.5 24.8 10 24.8 13.7C24.8 17.6 22 20 17.7 20H14.8"
              stroke="rgba(255,255,255,0.97)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.8"
            />
            <path
              d="M13 25L22.5 15.5"
              stroke="rgba(20,200,178,0.95)"
              strokeLinecap="round"
              strokeWidth="2.8"
            />
          </svg>
        </div>
      </div>
    ),
    size
  );
}
