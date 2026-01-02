"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type CaptchaProvider = "turnstile" | "hcaptcha";

interface CaptchaProps {
  provider: CaptchaProvider;
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";
const HCAPTCHA_SCRIPT_URL = "https://js.hcaptcha.com/1/api.js";

export function Captcha({
  provider,
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = "dark",
  size = "normal",
  className,
}: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    if (!containerRef.current || !siteKey) return;

    const scriptUrl =
      provider === "turnstile" ? TURNSTILE_SCRIPT_URL : HCAPTCHA_SCRIPT_URL;
    const globalVar = provider === "turnstile" ? "turnstile" : "hcaptcha";

    // Verifica se o script já foi carregado
    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement | null;

    const renderWidget = () => {
      if (!containerRef.current) return;

      const api = window[globalVar];
      if (!api) return;

      // Remove widget anterior se existir
      if (widgetIdRef.current) {
        try {
          api.remove(widgetIdRef.current);
        } catch {
          // Ignora erro se o widget não existir
        }
      }

      // Limpa o container
      containerRef.current.innerHTML = "";

      // Renderiza o novo widget
      widgetIdRef.current = api.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleVerify,
        "error-callback": handleError,
        "expired-callback": handleExpire,
        theme: theme === "auto" ? undefined : theme,
        size,
      });
    };

    if (existingScript && window[globalVar]) {
      // Script já carregado, renderiza diretamente
      renderWidget();
    } else if (!existingScript) {
      // Carrega o script
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        // Pequeno delay para garantir que a API está disponível
        setTimeout(renderWidget, 100);
      };

      script.onerror = () => {
        console.error(`Erro ao carregar script do ${provider}`);
        handleError();
      };

      document.head.appendChild(script);
    } else {
      // Script está carregando, aguarda
      existingScript.addEventListener("load", () => {
        setTimeout(renderWidget, 100);
      });
    }

    // Cleanup
    return () => {
      if (widgetIdRef.current) {
        const api = window[globalVar];
        if (api) {
          try {
            api.remove(widgetIdRef.current);
          } catch {
            // Ignora erro
          }
        }
        widgetIdRef.current = null;
      }
    };
  }, [provider, siteKey, theme, size, handleVerify, handleError, handleExpire]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-captcha-provider={provider}
    />
  );
}

/**
 * Hook para gerenciar o estado do CAPTCHA em formulários
 */
export function useCaptcha() {
  const tokenRef = useRef<string | null>(null);

  const setToken = useCallback((token: string) => {
    tokenRef.current = token;
  }, []);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
  }, []);

  const getToken = useCallback(() => {
    return tokenRef.current;
  }, []);

  return {
    setToken,
    clearToken,
    getToken,
  };
}
