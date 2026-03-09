import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations as defaultTranslations, type Language } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [dbTranslations, setDbTranslations] = useState<Record<string, Record<string, string>>>({});

  // Load translations from DB
  useEffect(() => {
    const loadDbTranslations = async () => {
      try {
        const { data, error } = await supabase
          .from("translations")
          .select("language, key, value");
        if (error || !data) return;
        const map: Record<string, Record<string, string>> = {};
        data.forEach((row: any) => {
          if (!map[row.language]) map[row.language] = {};
          map[row.language][row.key] = row.value;
        });
        setDbTranslations(map);
      } catch {
        // Silently fail - use defaults
      }
    };
    loadDbTranslations();
  }, []);

  const t = useCallback((key: string): string => {
    // DB translations take priority, then defaults, then key itself
    return dbTranslations[language]?.[key] || defaultTranslations[language]?.[key] || key;
  }, [language, dbTranslations]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === "pt-BR" ? "en" : "pt-BR");
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
