import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disable middleware to debug MIDDLEWARE_INVOCATION_FAILED error
// Set to false to re-enable middleware
const MIDDLEWARE_ENABLED = false;

export async function middleware(request: NextRequest) {
  // If middleware is disabled, allow all requests
  if (!MIDDLEWARE_ENABLED) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  
  // Early return for static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/f/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  try {
    // Check if AUTH_SECRET is available
    if (!process.env.AUTH_SECRET) {
      // If no AUTH_SECRET, allow all requests (development mode)
      return NextResponse.next();
    }

    // In NextAuth v5, use auth() function directly
    let isLoggedIn = false;
    try {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      isLoggedIn = !!session?.user;
    } catch (authError) {
      // If auth check fails, assume not logged in
      console.warn("Auth check failed:", authError);
      isLoggedIn = false;
    }

    const isOnDashboard = pathname.startsWith("/dashboard");
    const isOnLogin = pathname.startsWith("/login");

    // Redirect logged-in users away from login page
    if (isOnLogin && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect dashboard routes
    if (isOnDashboard && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Log error for debugging
    console.error("Middleware error:", error);
    // Always allow request to proceed - let pages handle auth
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
