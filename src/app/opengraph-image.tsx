import { ImageResponse } from "next/og";

export const alt = "Poornima University — Previous Year Question Papers (PYQP)";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#05488B",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#FFC107",
              color: "#05488B",
              fontWeight: 800,
              fontSize: 24,
              padding: "10px 20px",
              borderRadius: "8px",
              letterSpacing: "1px",
            }}
          >
            POORNIMA UNIVERSITY
          </div>
          <div
            style={{
              color: "#FFFFFF",
              opacity: 0.85,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Central Library Archive
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.15,
            }}
          >
            Previous Year Question Papers
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#FFC107",
              fontWeight: 600,
            }}
          >
            Official Mid-Term (MSE) & End-Term (ESE) Digital Archive
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "2px solid rgba(255, 255, 255, 0.2)",
            paddingTop: "24px",
          }}
        >
          <div style={{ color: "#E2E8F0", fontSize: 20, fontWeight: 500 }}>
            B.Tech • BCA • MCA • MBA • BBA • B.Sc • B.Des • All Programs
          </div>
          <div style={{ color: "#FFC107", fontSize: 20, fontWeight: 700 }}>
            Instant PDF Access & AI Assistant
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
