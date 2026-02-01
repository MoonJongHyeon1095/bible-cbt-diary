import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleTermsMiddleware } from "@/middleware/terms.middleware";

export function middleware(request: NextRequest) {
  const termsResponse = handleTermsMiddleware(request);
  if (termsResponse) return termsResponse;

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
