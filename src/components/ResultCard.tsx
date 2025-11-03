import { CheckCircle, AlertCircle, RotateCcw, Flag } from 'lucide-react';
import { useState } from 'react';
import { reportIncorrect } from '../services/api';
import type { ClassificationResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultCardProps {
  result: ClassificationResult;
  city: string;
  onReset: () => void;
}

const WASTE_ICONS: Record<string, string> = {
  plastic: '♻️',
  paper: '📄',
  metal: '🔩',
  glass: '🍾',
  organic: '🌿',
  ewaste: '💻',
  hazardous: '⚠️'
};

export default function ResultCard({ result, city, onReset }: ResultCardProps) {
  const { t } = useLanguage();
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await reportIncorrect({
        originalLabel: result.label,
        correctLabel: result.label, 
        city: city,
        notes: 'Incorrect classification reported by user'
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to report:', error);
    } finally {
      setIsReporting(false);
    }
  };

  const confidencePercentage = Math.round(result.confidence * 100);
  const wasteIcon = WASTE_ICONS[result.label.toLowerCase()] || '🗑️';

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-slideUp">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('result')}
          </h2>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{t('wasteType')}</span>
            <span className="text-3xl">{wasteIcon}</span>
          </div>

          <div className="text-center py-2">
            <h3 className="text-3xl font-bold text-gray-800 capitalize mb-2">
              {t(`wasteTypes.${result.label}`)}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${confidencePercentage}%` }}
                ></div>
              </div>
              <span className="text-lg font-semibold text-green-700">
                {confidencePercentage}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('confidence')}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                {t('disposal')}
              </h4>
              <p className="text-sm text-blue-800">
                {result.action}
              </p>
            </div>
          </div>
        </div>

        {reportSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 animate-fadeIn">
            <p className="text-sm text-green-700 text-center font-medium">
              {t('thankYou')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReset}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('tryAnother')}
          </button>

          <button
            onClick={handleReport}
            disabled={isReporting || reportSuccess}
            className="bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-gray-400 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4" />
            {isReporting ? t('sending') : t('report')}
          </button>
        </div>
      </div>
    </div>
  );
}
