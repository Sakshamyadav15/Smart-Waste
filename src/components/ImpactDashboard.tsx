import { TrendingUp, Droplets, Zap, TreePine, Award, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserImpact, getBadge } from '../services/impactCalculator';
import { useLanguage } from '../contexts/LanguageContext';

export default function ImpactDashboard() {
  const { t } = useLanguage();
  const [impact, setImpact] = useState({
    totalItems: 0,
    co2Saved: 0,
    waterSaved: 0,
    energySaved: 0,
    treesSaved: 0,
    itemsByType: {} as Record<string, number>,
  });

  const refreshImpact = () => {
    setImpact(getUserImpact());
  };

  useEffect(() => {
    refreshImpact();

    const handleStorageChange = () => {
      refreshImpact();
    };
    
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(refreshImpact, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const badge = getBadge(impact.totalItems);

  const stats = [
    {
      icon: TrendingUp,
      value: `${impact.co2Saved.toFixed(1)} kg`,
      label: t('impact.co2Saved'),
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      icon: Droplets,
      value: `${impact.waterSaved.toFixed(0)} L`,
      label: t('impact.waterSaved'),
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      icon: Zap,
      value: `${impact.energySaved.toFixed(1)} kWh`,
      label: t('impact.energySaved'),
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      icon: TreePine,
      value: `${impact.treesSaved.toFixed(2)}`,
      label: t('impact.treesEquivalent'),
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Award className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">{t('impact.yourImpact')}</h2>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border-2 border-green-200">
            <span className="font-semibold text-gray-700">{t(`badges.${badge.name}`)}</span>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            {impact.totalItems} {t('impact.itemsClassified')}
          </p>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {}
        {impact.totalItems > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">
                  🎉 Amazing Impact!
                </p>
                <p className="text-blue-800">
                  {impact.co2Saved > 10 && (
                    <>That's like taking a car off the road for {Math.floor(impact.co2Saved / 2.3)} days! 🚗</>
                  )}
                  {impact.co2Saved <= 10 && impact.co2Saved > 0 && (
                    <>You're making a difference! Keep recycling! 🌍</>
                  )}
                  {impact.co2Saved === 0 && (
                    <>Start recycling to see your environmental impact! 🌱</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {}
        {Object.keys(impact.itemsByType).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Your Recycling Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(impact.itemsByType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / impact.totalItems) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 min-w-[80px]">
                      {t(`wasteTypes.${type}`)} ({count})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
