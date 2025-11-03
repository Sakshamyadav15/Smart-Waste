import { useState } from 'react';
import Navbar from './components/Navbar';
import UploadCard from './components/UploadCard';
import ResultCard from './components/ResultCard';
import Loader from './components/Loader';
import ImpactDashboard from './components/ImpactDashboard';
import Leaderboard from './components/Leaderboard';
import LocationFinder from './components/LocationFinder';
import InstallPrompt from './components/InstallPrompt';
import { classifyWasteImage } from './services/aiClassifier';
import { useLanguage } from './contexts/LanguageContext';
import { calculatePoints, getUserImpact } from './services/impactCalculator';
import { updateLeaderboard } from './services/leaderboard';
import type { ClassificationResult } from './types';

function App() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  const handleClassify = async (image: File, city: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSelectedCity(city);

    try {
      
      const aiResult = await classifyWasteImage(image);

      const action = t(`disposalActions.${aiResult.label}`) || 
                     t('disposalActions.General');

      const data: ClassificationResult = {
        label: aiResult.label,
        confidence: aiResult.confidence,
        action: action,
      };

      const history = JSON.parse(localStorage.getItem('classificationHistory') || '[]');
      history.push({
        label: aiResult.label,
        confidence: aiResult.confidence,
        city: city,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('classificationHistory', JSON.stringify(history));

      const impact = getUserImpact();
      const totalPoints = history.reduce((sum: number, item: { label: string }) => 
        sum + calculatePoints(item.label), 0
      );
      updateLeaderboard(totalPoints, impact.totalItems, impact.co2Saved, city);
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedCity('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 space-y-6">
            {isLoading && <Loader />}

            {!isLoading && !result && (
              <UploadCard onClassify={handleClassify} error={error} />
            )}

            {!isLoading && result && (
              <ResultCard result={result} city={selectedCity} onReset={handleReset} />
            )}

            {}
            {!isLoading && result && selectedCity && (
              <LocationFinder city={selectedCity} wasteType={result.label} />
            )}
          </div>

          {}
          <div className="space-y-6">
            <ImpactDashboard />
            <Leaderboard city={selectedCity || undefined} />
          </div>
        </div>
      </main>

      {}
      <InstallPrompt />
    </div>
  );
}

export default App;
