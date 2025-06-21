import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import et from './locales/et.json';

const resources = {
  en: { translation: en },
  et: { translation: et }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || (navigator.language.startsWith('et') ? 'et' : 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;