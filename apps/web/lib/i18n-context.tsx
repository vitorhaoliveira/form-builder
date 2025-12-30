"use client";

import React, { createContext, useContext, useState } from "react";
import { defaultLocale, type Locale } from "@/i18n/config";
import type { Messages } from "./i18n";

interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  initialMessages: Messages;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    // Set cookie with proper encoding
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
    
    // Reload immediately - cookie is set synchronously
    window.location.reload();
  };

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useLocale(): Locale {
  const { locale } = useI18n();
  return locale;
}

export function useTranslations(namespace?: string) {
  const { messages } = useI18n();

  return (key: string): string => {
    if (namespace) {
      const namespaceMessages = messages[namespace] as Record<string, any> | undefined;
      if (namespaceMessages) {
        const keys = key.split(".");
        let value: any = namespaceMessages;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        return typeof value === "string" ? value : key;
      }
    }

    // Try nested access from root
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return typeof value === "string" ? value : key;
  };
}

