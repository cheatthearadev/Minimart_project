import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import km from '../locales/km.json';

const LanguageContext = createContext(null);

const LANG_KEY = 'minimart_lang';
const translations = { en, km };

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'km' ? 'km' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === 'km' ? 'km' : 'en';
    document.documentElement.classList.toggle('lang-km', lang === 'km');
  }, [lang]);

  const t = useCallback((key, fallback) => {
    const dict = translations[lang] || en;
    const value = getNested(dict, key);
    return value !== undefined ? value : (fallback !== undefined ? fallback : key);
  }, [lang]);

  const switchLanguage = useCallback((l) => {
    if (l === 'en' || l === 'km') setLang(l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLanguage, t, isKhmer: lang === 'km' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export const useT = useLanguage;
