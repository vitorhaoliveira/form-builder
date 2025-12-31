import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

const hasAuthEnv = !!process.env.AUTH_SECRET;
const hasDbEnv = !!process.env.DATABASE_URL;
const hasResendEnv = !!(process.env.AUTH_RESEND_KEY && process.env.AUTH_EMAIL_FROM);

function getAdapter() {
  if (isBuildTime || !hasDbEnv) return undefined;

  try {
    const { prisma } = require("@submitin/database");
    return prisma ? PrismaAdapter(prisma) : undefined;
  } catch {
    return undefined;
  }
}

const authConfig = {
  adapter: getAdapter(),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },

  // ✅ Provider NÃO depende de DATABASE_URL
  providers: hasResendEnv
    ? [
        Resend({
          apiKey: process.env.AUTH_RESEND_KEY!,
          from: process.env.AUTH_EMAIL_FROM!, // ex: "Submitin <no-reply@submitin.com>"
        }),
      ]
    : [],

  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) token.sub = user.id;
      return token;
    },
  },

  // ✅ Secret sempre real em runtime, placeholder só em build
  secret: hasAuthEnv ? process.env.AUTH_SECRET : "build-time-placeholder-secret",
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig) as any;
