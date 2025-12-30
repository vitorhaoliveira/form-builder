import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@form-builder/database";

// Check if required environment variables are available
const hasRequiredEnvVars = !!(
  process.env.AUTH_SECRET &&
  process.env.DATABASE_URL
);

const authConfig = hasRequiredEnvVars ? {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  providers: process.env.AUTH_RESEND_KEY ? [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "Form Builder <noreply@formbuilder.dev>",
    }),
  ] : [],
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET,
} : {
  // Fallback config for build time when env vars are not available
  providers: [],
  secret: "build-time-placeholder-secret",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig) as any;
