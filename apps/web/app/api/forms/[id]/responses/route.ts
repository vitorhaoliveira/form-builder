import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { NewResponseEmail } from "@submitin/email/templates/new-response";
import {
  sanitizeFormValues,
  checkRateLimit,
  getClientIP,
  isValidEmail,
  MAX_FIELD_VALUE_LENGTH,
  MAX_RESPONSES_PER_FORM,
} from "@/lib/security";
import { verifyCaptchaToken } from "@/lib/turnstile";

// GET - Fetch responses (protected)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: { formId: id },
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ error: "Erro ao buscar respostas" }, { status: 500 });
  }
}

// POST - Submit response (public)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Rate limiting - 10 submissões por minuto por IP
    const clientIP = getClientIP(request);
    const rateLimitKey = `submit:${id}:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        published: true,
      },
      include: {
        fields: true,
        settings: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    // Verifica limite de respostas por formulário
    if (form._count.responses >= MAX_RESPONSES_PER_FORM) {
      return NextResponse.json(
        { error: "Este formulário atingiu o limite máximo de respostas." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Verificar CAPTCHA se habilitado
    if (
      form.settings?.captchaEnabled &&
      form.settings?.captchaSecretKey &&
      form.settings?.captchaProvider
    ) {
      const captchaToken = body?.captchaToken as string | undefined;

      if (!captchaToken) {
        console.log("🔒 CAPTCHA habilitado mas token não fornecido");
        return NextResponse.json(
          { error: "Verificação anti-spam necessária. Por favor, complete o CAPTCHA." },
          { status: 400 }
        );
      }

      console.log("🔒 Verificando CAPTCHA...");
      console.log("  → Provider:", form.settings.captchaProvider);

      const captchaResult = await verifyCaptchaToken(
        captchaToken,
        form.settings.captchaSecretKey,
        form.settings.captchaProvider as "turnstile" | "hcaptcha"
      );

      if (!captchaResult.success) {
        console.error("❌ Verificação de CAPTCHA falhou:", captchaResult.errorCodes);
        return NextResponse.json(
          { error: "Verificação anti-spam falhou. Por favor, tente novamente." },
          { status: 400 }
        );
      }

      console.log("✅ CAPTCHA verificado com sucesso");
    }

    const rawValues = body?.values as Record<string, string> | undefined;

    if (!rawValues || typeof rawValues !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Sanitiza todos os valores de entrada
    const values = sanitizeFormValues(rawValues);

    // Obtém os IDs válidos dos campos do formulário
    const validFieldIds = new Set(form.fields.map((f: (typeof form.fields)[number]) => f.id));

    // Validate required fields and field types
    for (const field of form.fields) {
      const value = values[field.id];

      if (field.required && !value) {
        return NextResponse.json(
          { error: `Campo "${field.label}" é obrigatório` },
          { status: 400 }
        );
      }

      // Verifica tamanho máximo
      if (value && value.length > MAX_FIELD_VALUE_LENGTH) {
        return NextResponse.json(
          { error: `Campo "${field.label}" excede o tamanho máximo` },
          { status: 400 }
        );
      }

      // Valida email no backend
      if (field.type === "email" && value && !isValidEmail(value)) {
        return NextResponse.json(
          { error: `Email inválido no campo "${field.label}"` },
          { status: 400 }
        );
      }
    }

    // Create response with field values (apenas campos válidos do formulário)
    const response = await prisma.response.create({
      data: {
        formId: id,
        fieldValues: {
          create: Object.entries(values)
            .filter(([fieldId, value]: [string, string]) => value && validFieldIds.has(fieldId))
            .map(([fieldId, value]: [string, string]) => ({
              fieldId,
              value: String(value),
            })),
        },
      },
      include: {
        fieldValues: true,
      },
    });

    // Coletar todos os emails de notificação (principal + múltiplos)
    const emailsToNotify: string[] = [];

    if (form.settings?.notifyEmail) {
      emailsToNotify.push(form.settings.notifyEmail);
    }

    if (form.settings?.notifyEmails && form.settings.notifyEmails.length > 0) {
      // Adiciona emails múltiplos, evitando duplicatas
      for (const email of form.settings.notifyEmails) {
        if (email && !emailsToNotify.includes(email)) {
          emailsToNotify.push(email);
        }
      }
    }

    // Enviar notificações para todos os destinatários
    if (emailsToNotify.length > 0) {
      console.log("📧 Enviando emails de notificação...");
      console.log("  → Destinatários:", emailsToNotify.join(", "));
      console.log("  → Formulário:", form.name);
      console.log("  → AUTH_RESEND_KEY configurada:", !!process.env.AUTH_RESEND_KEY);
      console.log("  → AUTH_EMAIL_FROM:", process.env.AUTH_EMAIL_FROM || "não configurado");

      const emailPromises = emailsToNotify.map(async (email) => {
        try {
          const emailResult = await sendEmail({
            to: email,
            subject: `Nova resposta em ${form.name}`,
            react: NewResponseEmail({
              formName: form.name,
              formUrl: `${process.env.AUTH_URL || "http://localhost:3000"}/dashboard/forms/${form.id}/responses`,
              responseCount: form._count.responses + 1,
              submittedAt: new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }),
          });
          console.log(`✅ Email enviado para ${email}:`, emailResult);
          return { email, success: true };
        } catch (emailError) {
          console.error(`❌ Falha ao enviar email para ${email}:`);
          console.error("  → Erro:", emailError instanceof Error ? emailError.message : emailError);
          return { email, success: false, error: emailError };
        }
      });

      // Executa todos os envios em paralelo
      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success
      ).length;
      console.log(`📧 Emails enviados: ${successCount}/${emailsToNotify.length}`);
    } else {
      console.log("📧 Nenhum email de notificação configurado para este formulário");
    }

    // Send webhook if configured
    if (form.settings?.webhookUrl) {
      try {
        await fetch(form.settings.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: form.id,
            formName: form.name,
            responseId: response.id,
            submittedAt: response.submittedAt,
            values,
          }),
        });
        console.log("✅ Webhook enviado para:", form.settings.webhookUrl);
      } catch (webhookError) {
        console.error("❌ Falha ao enviar webhook:", webhookError);
      }
    }

    return NextResponse.json({ success: true, id: response.id }, { status: 201 });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json({ error: "Erro ao enviar resposta" }, { status: 500 });
  }
}
