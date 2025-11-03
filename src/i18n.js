import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import překladů
import translationEN from './locales/en/translation.json';
import translationCS from './locales/cs/translation.json';
import translationES from './locales/es/translation.json';
// ... další importy pro ostatní jazyky

const resources = {
  en: {
    translation: translationEN
  },
  cs: {
    translation: translationCS
  },
  es: {
    translation: translationES
  }
  // ... další jazyky
};

i18n
  .use(LanguageDetector) // Detekuje jazyk prohlížeče
  .use(initReactI18next) // Propojí i18next s Reactem
  .init({
    resources,
    fallbackLng: 'en', // Jazyk, který se použije, pokud detekce selže
    interpolation: {
      escapeValue: false // React již chrání proti XSS
    }
  });

export default i18n;
