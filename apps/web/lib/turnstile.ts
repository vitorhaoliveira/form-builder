/**
 * Utilitários para verificação de CAPTCHA (Cloudflare Turnstile e hCaptcha)
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";

export interface CaptchaVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verifica um token do Cloudflare Turnstile
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string
): Promise<CaptchaVerifyResult> {
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    return {
      success: data.success === true,
      errorCodes: data["error-codes"],
    };
  } catch (error) {
    console.error("Erro ao verificar Turnstile:", error);
    return {
      success: false,
      errorCodes: ["verification-failed"],
    };
  }
}

/**
 * Verifica um token do hCaptcha
 */
export async function verifyHCaptchaToken(
  token: string,
  secretKey: string
): Promise<CaptchaVerifyResult> {
  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    return {
      success: data.success === true,
      errorCodes: data["error-codes"],
    };
  } catch (error) {
    console.error("Erro ao verificar hCaptcha:", error);
    return {
      success: false,
      errorCodes: ["verification-failed"],
    };
  }
}

/**
 * Verifica um token de CAPTCHA baseado no provider
 */
export async function verifyCaptchaToken(
  token: string,
  secretKey: string,
  provider: "turnstile" | "hcaptcha"
): Promise<CaptchaVerifyResult> {
  if (provider === "turnstile") {
    return verifyTurnstileToken(token, secretKey);
  }

  if (provider === "hcaptcha") {
    return verifyHCaptchaToken(token, secretKey);
  }

  return {
    success: false,
    errorCodes: ["invalid-provider"],
  };
}
