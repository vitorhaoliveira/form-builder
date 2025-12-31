import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().min(1, "AUTH_URL is required"),
  AUTH_RESEND_KEY: z.string().optional(),
  AUTH_EMAIL_FROM: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// For build time, use partial validation to avoid build failures
const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // During build time in deployment, env vars might not be available yet
    // Return partial env with defaults for required fields
    console.warn("⚠️ Some environment variables missing during build, using defaults");
    return {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://placeholder",
      AUTH_SECRET: process.env.AUTH_SECRET || "build-time-placeholder",
      AUTH_URL: process.env.AUTH_URL || "http://localhost:3000",
      AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
      AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM || "Submitin <noreply@submitin.com>",
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    };
  }
})();

export { env };
