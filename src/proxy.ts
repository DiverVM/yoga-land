import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Pages and API routes that require an admin session.
// All other paths are guest-accessible (landing, checkout, payment, auth).
const ADMIN_PAGE_PREFIXES = ["/admin"];
const ADMIN_API_PREFIXES = [
  "/api/admin",
  "/api/qr-records",
  "/api/transactions",
  "/api/email",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /admin (exact) to /admin/dashboard
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  const isAdminPage = ADMIN_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminApi = ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== "admin") {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/qr-records/:path*",
    "/api/transactions/:path*",
    "/api/email/:path*",
  ],
};
