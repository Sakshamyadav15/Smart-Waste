import { Leaf } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="bg-white shadow-sm border-b border-green-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {}
          <div className="w-32 hidden md:block"></div>
          
          {}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{t('appName')}</h1>
            </div>
            <p className="text-center text-sm text-gray-600 mt-1">
              {t('tagline')}
            </p>
          </div>

          {}
          <div className="flex justify-end w-32">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
