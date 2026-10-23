import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_ROW_ID = "default";
// commentThreads.list는 youtube.readonly만으로는 "insufficient authentication scopes"가 나서 force-ssl도 필요
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

function createOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri,
  });
}

export function getAuthUrl(redirectUri: string): string {
  const client = createOAuth2Client(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: YOUTUBE_SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<void> {
  const client = createOAuth2Client(redirectUri);
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
    throw new Error(
      "구글이 refresh_token을 내려주지 않았습니다. 기존 연동을 해제한 뒤 다시 시도해주세요.",
    );
  }

  await prisma.googleAuth.upsert({
    where: { id: GOOGLE_AUTH_ROW_ID },
    create: {
      id: GOOGLE_AUTH_ROW_ID,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? YOUTUBE_SCOPES.join(" "),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? YOUTUBE_SCOPES.join(" "),
    },
  });
}

export type GoogleConnectionStatus = "connected" | "expired" | "disconnected";

/**
 * DB에 행이 있다고 "연동됨"이라고 보면 안 된다 — 리프레시 토큰이 구글 쪽에서 무효화돼도
 * (테스트 모드 7일 만료, 권한 해제 등) 행은 그대로 남아있어서 화면엔 계속 연동된 것처럼
 * 보이는 문제가 있었다. 실제로 토큰을 한 번 갱신해봐서 진짜 살아있는지 확인한다.
 */
export async function getGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  const row = await prisma.googleAuth.findUnique({ where: { id: GOOGLE_AUTH_ROW_ID } });
  if (!row) return "disconnected";

  const client = createOAuth2Client("");
  client.setCredentials({
    refresh_token: row.refreshToken,
    expiry_date: row.expiryDate.getTime(),
  });

  try {
    await client.getAccessToken();
    return "connected";
  } catch {
    return "expired";
  }
}

export async function disconnectGoogle(): Promise<void> {
  await prisma.googleAuth.deleteMany({ where: { id: GOOGLE_AUTH_ROW_ID } });
}

/** DB에 저장된 토큰으로 인증된 youtube 클라이언트 반환. 연동 안 되어 있으면 null */
export async function getAuthenticatedYoutubeClient() {
  const row = await prisma.googleAuth.findUnique({ where: { id: GOOGLE_AUTH_ROW_ID } });
  if (!row) return null;

  // 이 클라이언트는 redirect_uri가 필요 없는 토큰 갱신 용도이므로 빈 값으로 생성
  const client = createOAuth2Client("");
  client.setCredentials({
    access_token: row.accessToken,
    refresh_token: row.refreshToken,
    expiry_date: row.expiryDate.getTime(),
    scope: row.scope,
  });

  client.on("tokens", (tokens) => {
    if (!tokens.access_token || !tokens.expiry_date) return;
    prisma.googleAuth
      .update({
        where: { id: GOOGLE_AUTH_ROW_ID },
        data: {
          accessToken: tokens.access_token,
          expiryDate: new Date(tokens.expiry_date),
          ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        },
      })
      .catch(() => {
        // 토큰 갱신 저장 실패는 다음 요청에서 재시도되므로 무시
      });
  });

  return google.youtube({ version: "v3", auth: client });
}
