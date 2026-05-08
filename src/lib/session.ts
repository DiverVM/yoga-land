// Signed-cookie session helpers.
// Uses Web Crypto (SubtleCrypto) so this module works in both
// the Node.js runtime (API routes) and the Edge runtime (middleware).
// SESSION_SECRET must be set in production via environment variable.

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

const getSecret = () =>
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

export type SessionPayload = {
  userId: string;
  role: string;
  expiresAt: number;
};

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlToBuffer(b64url: string): ArrayBuffer {
  const padded = b64url + "=".repeat((4 - (b64url.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function toBase64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(b64url: string): string {
  const padded = b64url + "=".repeat((4 - (b64url.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const payloadB64 = toBase64url(JSON.stringify(payload));
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return `${payloadB64}.${bufferToBase64url(sig)}`;
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const dotIdx = token.indexOf(".");
    if (dotIdx === -1) return null;
    const payloadB64 = token.slice(0, dotIdx);
    const sigB64 = token.slice(dotIdx + 1);

    const key = await importKey(getSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBuffer(sigB64),
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return null;

    const payload = JSON.parse(fromBase64url(payloadB64)) as SessionPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
