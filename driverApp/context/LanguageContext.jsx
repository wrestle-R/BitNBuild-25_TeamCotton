import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
  };

  const getLanguageName = (code) => {
    const names = {
      en: 'English',
      hi: 'हिंदी',
      mr: 'मराठी'
    };
    return names[code] || code;
  };

  const getSupportedLanguages = () => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  ];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        getLanguageName,
        getSupportedLanguages,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};