import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f3ec",
          color: "#2b241d",
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 24 }}>💬</div>
        <div style={{ fontSize: 56, fontWeight: 700, textAlign: "center" }}>
          유튜브 멤버십 댓글 수집기
        </div>
        <div style={{ fontSize: 28, marginTop: 20, color: "#78716c" }}>
          멤버십 영상의 댓글을 모으고 수정/삭제 이력까지 추적합니다
        </div>
      </div>
    ),
    { ...size },
  );
}
