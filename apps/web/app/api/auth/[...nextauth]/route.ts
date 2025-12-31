import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Dynamic import to avoid build-time initialization issues
async function getHandlers() {
  const { handlers } = await import("@/lib/auth");
  return handlers;
}

export async function GET(request: NextRequest) {
  try {
    const handlers = await getHandlers();
    return handlers.GET(request);
  } catch (error) {
    console.error("❌ [NextAuth GET] Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const handlers = await getHandlers();
    const response = await handlers.POST(request);
    
    // Log de erros de configuração para diagnóstico
    // Verifica se as variáveis estão configuradas quando há requisição de signin
    const url = new URL(request.url);
    const isSignInRequest = url.pathname.includes("signin") || url.searchParams.has("email");
    
    if (isSignInRequest) {
      const hasResendKey = !!(process.env.AUTH_RESEND_KEY && process.env.AUTH_RESEND_KEY.trim().length > 0);
      const hasEmailFrom = !!(process.env.AUTH_EMAIL_FROM && process.env.AUTH_EMAIL_FROM.trim().length > 0);
      
      if (!hasResendKey || !hasEmailFrom) {
        console.error("❌ [NextAuth POST] Tentativa de login detectada, mas configuração incompleta:");
        console.error("   - AUTH_RESEND_KEY:", 
          hasResendKey && process.env.AUTH_RESEND_KEY
            ? `✅ Configurado (${process.env.AUTH_RESEND_KEY.substring(0, 10)}...)` 
            : "❌ Faltando ou vazio");
        console.error("   - AUTH_EMAIL_FROM:", 
          hasEmailFrom 
            ? `✅ Configurado (${process.env.AUTH_EMAIL_FROM})` 
            : "❌ Faltando ou vazio");
        
        // Em desenvolvimento, mostra instruções
        if (process.env.NODE_ENV === "development") {
          console.error("\n   📝 Para corrigir:");
          console.error("   1. Crie/edite o arquivo .env.local na pasta apps/web/");
          console.error("   2. Adicione as variáveis:");
          console.error("      AUTH_RESEND_KEY=re_xxxxxxxxxxxx");
          console.error("      AUTH_EMAIL_FROM=\"Seu Nome <noreply@seudominio.com>\"");
          console.error("   3. Reinicie o servidor de desenvolvimento (pnpm dev)\n");
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error("❌ [NextAuth POST] Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

