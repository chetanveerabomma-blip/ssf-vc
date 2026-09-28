import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Floor Manager Squad Invite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ roomId: string }> }) {
  const resolved = await params;
  const roomId = decodeURIComponent(resolved.roomId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#FFF8E7",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "monospace",
          border: "16px solid #0A0A0A",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              backgroundColor: "#FFD93D",
              color: "#0A0A0A",
              border: "4px solid #0A0A0A",
              padding: "8px 20px",
              fontSize: "24px",
              fontWeight: 900,
              boxShadow: "6px 6px 0px #0A0A0A",
            }}
          >
            SQUAD ROOM INVITE
          </div>
          <div
            style={{
              backgroundColor: "#0A0A0A",
              color: "#FFFFFF",
              padding: "8px 16px",
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            SRM TRICHY • EEE
          </div>
        </div>

        {/* Center Room Display */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#374151" }}>
            HEAD TO ROOM
          </div>
          <div
            style={{
              fontSize: "96px",
              fontWeight: 900,
              color: "#0A0A0A",
              letterSpacing: "-2px",
            }}
          >
            {roomId.replace(/-/g, " ")}
          </div>
          <div
            style={{
              backgroundColor: "#6BCB77",
              color: "#0A0A0A",
              border: "4px solid #0A0A0A",
              padding: "12px 24px",
              fontSize: "32px",
              fontWeight: 900,
              width: "fit-content",
              boxShadow: "6px 6px 0px #0A0A0A",
            }}
          >
            STATUS: FREE NOW
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "4px solid #0A0A0A",
            paddingTop: "24px",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1F2937" }}>
            Real-time Floor Manager • Call the Squad
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#0A0A0A" }}>
            ssf-vc.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
