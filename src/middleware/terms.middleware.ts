import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TERMS_COOKIE_KEY, TERMS_VERSION } from "@/lib/constants/legal";

const EXEMPT_PATHS = new Set([
  "/terms",
  "/privacy",
  "/terms-of-service",
  "/account-deletion",
]);

export function handleTermsMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EXEMPT_PATHS.has(pathname)) {
    return null;
  }

  const termsCookie = request.cookies.get(TERMS_COOKIE_KEY)?.value;
  if (termsCookie === `v${TERMS_VERSION}`) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/terms";
  return NextResponse.redirect(url);
}
