import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

const hasAuthEnv = !!process.env.AUTH_SECRET;
const hasDbEnv = !!process.env.DATABASE_URL;

// Validação mais rigorosa: verifica se as variáveis existem E não estão vazias
const hasResendKey = !!(process.env.AUTH_RESEND_KEY && process.env.AUTH_RESEND_KEY.trim().length > 0);
const hasEmailFrom = !!(process.env.AUTH_EMAIL_FROM && process.env.AUTH_EMAIL_FROM.trim().length > 0);
const hasResendEnv = hasResendKey && hasEmailFrom;

// Log de diagnóstico (apenas em desenvolvimento ou quando há problemas)
if (!isBuildTime && process.env.NODE_ENV !== "test") {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 [NextAuth] Diagnóstico de Configuração");
  console.log("=".repeat(60));
  
  // Verifica DATABASE_URL
  if (!hasDbEnv) {
    console.error("❌ DATABASE_URL: Não configurado");
  } else {
    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl.includes("localhost:5432")) {
      console.warn("⚠️  DATABASE_URL: Aponta para localhost:5432");
      console.warn("   Se você usa Supabase, atualize para a connection string do Supabase");
    } else if (dbUrl.includes("supabase")) {
      console.log("✅ DATABASE_URL: Configurado (Supabase)");
    } else {
      console.log("✅ DATABASE_URL: Configurado");
    }
  }
  
  // Verifica AUTH_SECRET
  if (!hasAuthEnv) {
    console.error("❌ AUTH_SECRET: Não configurado");
  } else {
    console.log("✅ AUTH_SECRET: Configurado");
  }
  
  // Verifica Resend
  if (!hasResendEnv) {
    const missing: string[] = [];
    if (!hasResendKey) missing.push("AUTH_RESEND_KEY");
    if (!hasEmailFrom) missing.push("AUTH_EMAIL_FROM");
    
    console.error(`❌ Resend: Configuração incompleta (faltando: ${missing.join(", ")})`);
    console.error("   📝 Para corrigir:");
    console.error("   1. Crie/edite o arquivo .env.local na pasta apps/web/");
    console.error("   2. Adicione:");
    console.error("      AUTH_RESEND_KEY=re_xxxxxxxxxxxx");
    console.error('      AUTH_EMAIL_FROM="Seu Nome <noreply@seudominio.com>"');
    console.error("   3. Reinicie o servidor (pnpm dev)");
  } else {
    console.log("✅ Resend: Configurado corretamente");
    if (process.env.NODE_ENV === "development") {
      console.log(`   AUTH_EMAIL_FROM: ${process.env.AUTH_EMAIL_FROM}`);
    }
  }
  
  console.log("=".repeat(60) + "\n");
}

function getAdapter() {
  if (isBuildTime || !hasDbEnv) {
    if (!isBuildTime && process.env.NODE_ENV !== "test") {
      if (!hasDbEnv) {
        console.warn("⚠️ [NextAuth] DATABASE_URL não configurado. O adapter não será usado.");
      }
    }
    return undefined;
  }

  try {
    const { prisma } = require("@submitin/database");
    return prisma ? PrismaAdapter(prisma) : undefined;
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("❌ [NextAuth] Erro ao carregar Prisma adapter:", error);
      
      // Diagnóstico específico para erros de conexão
      if (error instanceof Error) {
        if (error.message.includes("Can't reach database server") || 
            error.message.includes("localhost:5432")) {
          console.error("\n   🔍 Diagnóstico:");
          console.error("   O Prisma está tentando conectar em localhost:5432");
          console.error("   Se você usa Supabase, atualize DATABASE_URL com a connection string do Supabase");
          console.error("   Exemplo: postgresql://user:password@db.xxxxx.supabase.co:5432/postgres");
          console.error("   📝 Obtenha a connection string em: Supabase Dashboard > Project Settings > Database\n");
        }
      }
    }
    return undefined;
  }
}

const authConfig = {
  adapter: getAdapter(),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login?error=Configuration", // Redireciona erros de configuração para login
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

  // Melhor tratamento de erros
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig) as any;
