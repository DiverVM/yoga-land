import { headers } from "next/headers";

export function resolveOrigin(host: string | null): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (!host) {
    return "http://localhost:3000";
  }

  // Reject hosts with unexpected characters to prevent header injection.
  if (!/^[a-zA-Z0-9._:-]+$/.test(host)) {
    return "http://localhost:3000";
  }

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return `http://${host}`;
  }

  return `https://${host}`;
}

export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return resolveOrigin(requestHeaders.get("host"));
}
