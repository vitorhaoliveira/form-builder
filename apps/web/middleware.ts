import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "never", // Never add locale prefix to URLs
});

export const config = {
  // Match all routes except API routes and static files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

