import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../i18n/translations';

const languageOptions: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'te', name: 'తెలుగు' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-500"
        aria-label="Change language"
      >
        <Languages className="w-5 h-5 text-green-600" />
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {currentLanguage?.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-green-50 transition-colors ${
                language === lang.code ? 'bg-green-100 text-green-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
