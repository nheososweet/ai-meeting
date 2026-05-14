// ══════════════════════════════════════════════════════════
// Route Protection Proxy (Next.js 16)
// Runs before every route render to enforce auth.
// ══════════════════════════════════════════════════════════

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that do NOT require authentication
const PUBLIC_PATHS = ["/login"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const token = request.cookies.get("access_token")?.value

  // Not authenticated + accessing protected route → redirect to login
  if (!isPublicPath && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated + accessing login page → redirect to workspace
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/meeting", request.url))
  }

  return NextResponse.next()
}

// Only run on page routes, not static assets or API routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|svisor.svg|vpcp-ui|fonts|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
}
