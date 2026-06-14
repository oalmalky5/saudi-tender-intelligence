export const SESSION_COOKIE = "etimad_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  expiresAt: number;
};

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV !== "production") {
    return "local-development-session-secret-change-before-deploying";
  }
  throw new Error("SESSION_SECRET is required in production.");
}

function encode(value: string | Uint8Array): string {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decode(value: string): ArrayBuffer {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(
    atob(padded),
    (character) => character.charCodeAt(0),
  ).buffer as ArrayBuffer;
}

async function signingKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "expiresAt">,
): Promise<string> {
  const encodedPayload = encode(
    JSON.stringify({
      ...payload,
      expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    }),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${encode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) {
    return null;
  }

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      decode(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!valid) {
      return null;
    }
    const payload = JSON.parse(
      new TextDecoder().decode(decode(encodedPayload)),
    ) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
