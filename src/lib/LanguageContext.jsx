import React, { createContext, useContext, useState } from 'react';
import { t as translate } from './i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('vajra-lang') || 'en');

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('vajra-lang', code);
  };

  const t = (key) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, lang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}