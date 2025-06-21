import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'et' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 text-sm text-dark-400 p-2 rounded-lg hover:bg-dark-200 transition-colors ${className}`}
    >
      <Globe className="w-4 h-4" />
      <span className="bg-accent text-white px-2 py-1 rounded text-xs font-medium">
        {i18n.language.toUpperCase()}
      </span>
      <span className="text-dark-500">|</span>
      <span>{i18n.language === 'en' ? 'ET' : 'EN'}</span>
    </button>
  );
};