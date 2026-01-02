import { prisma } from "@submitin/database";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/public-form";
import type { CustomTheme } from "@/lib/theme-utils";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!form) return { title: "Formulário não encontrado" };

  return {
    title: form.name,
    description: form.description || `Preencha o formulário ${form.name}`,
  };
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findFirst({
    where: {
      slug,
      published: true,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
      settings: true,
    },
  });

  if (!form) {
    notFound();
  }

  // Transform JsonValue options to string[] | null
  const transformedForm = {
    id: form.id,
    name: form.name,
    description: form.description,
    fields: form.fields.map((field: (typeof form.fields)[number]) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      order: field.order,
      formId: field.formId,
      options: Array.isArray(field.options) ? (field.options as string[]) : null,
    })),
    // Incluir settings para features Pro
    settings: form.settings
      ? {
          hideBranding: form.settings.hideBranding,
          customTheme: form.settings.customTheme as CustomTheme | null,
          captchaEnabled: form.settings.captchaEnabled,
          captchaProvider: form.settings.captchaProvider as "turnstile" | "hcaptcha" | null,
          // Apenas o siteKey é público, o secretKey fica no servidor
          captchaSiteKey: form.settings.captchaSiteKey,
        }
      : null,
  };

  return <PublicForm form={transformedForm} />;
}
