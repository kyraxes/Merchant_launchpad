type VerifiedLineIdentity = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

const lineChannelId = process.env.LINE_LOGIN_CHANNEL_ID
  || process.env.NEXT_PUBLIC_LIFF_ID?.split("-")[0]
  || "2011546347";

export async function verifyLineIdToken(authorization: string | null): Promise<VerifiedLineIdentity> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("LINE_TOKEN_REQUIRED");

  if (process.env.ALLOW_MOCK_LINE_AUTH === "true" && token.startsWith("mock-line:")) {
    const userId = token.slice("mock-line:".length).trim();
    if (!userId) throw new Error("INVALID_LINE_TOKEN");
    return { userId: `mock-${userId}`, displayName: `Mock ${userId}` };
  }

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: token, client_id: lineChannelId }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("INVALID_LINE_TOKEN");
  const payload = await response.json() as { sub?: string; name?: string; picture?: string };
  if (!payload.sub) throw new Error("INVALID_LINE_TOKEN");
  return { userId: payload.sub, displayName: payload.name || "LINE user", pictureUrl: payload.picture };
}
