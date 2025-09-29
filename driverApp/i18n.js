import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, NativeModules } from 'react-native';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

// Define the resources
const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  mr: {
    translation: mr,
  },
};

// Get device language
const getDeviceLanguage = () => {
  let locale = 'en';
  
  if (Platform.OS === 'ios') {
    locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
             NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en';
  } else if (Platform.OS === 'android') {
    locale = NativeModules.I18nManager?.localeIdentifier || 'en';
  }
  
  // Extract language code from locale (e.g., 'en-US' -> 'en')
  const languageCode = locale.split(/[-_]/)[0];
  
  // Return supported language or fallback to English
  return ['en', 'hi', 'mr'].includes(languageCode) ? languageCode : 'en';
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    callback(getDeviceLanguage());
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;