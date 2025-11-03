import { useState } from 'react';
import Navbar from './components/Navbar';
import UploadCard from './components/UploadCard';
import ResultCard from './components/ResultCard';
import Loader from './components/Loader';
import { classifyWasteImage } from './services/aiClassifier';
import type { ClassificationResult } from './types';

// City-specific waste taxonomy (simplified from backend)
const CITY_ACTIONS: Record<string, Record<string, string>> = {
  default: {
    Plastic: 'Rinse and place in recycling bin',
    Paper: 'Keep dry and recycle',
    Cardboard: 'Flatten and recycle',
    Glass: 'Rinse and recycle',
    Metal: 'Clean and recycle',
    Organic: 'Compost if possible',
    'E-waste': 'Take to e-waste collection center',
    General: 'Dispose in general waste bin',
  }
};

function App() {
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
      // Use browser-based AI classification
      const aiResult = await classifyWasteImage(image);
      
      // Get city-specific action
      const action = CITY_ACTIONS.default[aiResult.label] || 
                     'Please check with your local waste management';
      
      // Format result to match expected type
      const data: ClassificationResult = {
        label: aiResult.label,
        confidence: aiResult.confidence,
        action: action,
      };
      
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

      <main className="container mx-auto px-4 py-6 max-w-md">
        {isLoading && <Loader />}

        {!isLoading && !result && (
          <UploadCard onClassify={handleClassify} error={error} />
        )}

        {!isLoading && result && (
          <ResultCard result={result} city={selectedCity} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
