"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

import {
  translations,
  type Language,
  type Translations,
} from "./translations";

interface LanguageContextType {
  language: Language;

  t: Translations;

  toggleLanguage: () => void;

  setLanguage: (
    lang: Language
  ) => void;
}

const LanguageContext =
  createContext<
    LanguageContextType | undefined
  >(undefined);

interface Props {
  children: ReactNode;
}

export function LanguageProvider({
  children,
}: Props) {
  /*
   * SOLO ESPAÑOL
   */

  const language: Language =
    "es";

  /*
   * TRADUCCIONES
   */

  const t = useMemo(() => {
    return translations.es;
  }, []);

  /*
   * FUNCIONES BLOQUEADAS
   * PARA EVITAR CAMBIOS A INGLÉS
   */

  const setLanguage = () => {
    return;
  };

  const toggleLanguage = () => {
    return;
  };

  /*
   * CONTEXTO
   */

  const value = useMemo(
    () => ({
      language,

      t,

      toggleLanguage,

      setLanguage,
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage debe usarse dentro de LanguageProvider"
    );
  }

  return context;
}