import { useState, useRef } from 'react';
import { Camera, Upload, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadCardProps {
  onClassify: (image: File, city: string) => void;
  error: string | null;
}

const CITIES = [
  'Delhi',
  'Bengaluru',
  'Mumbai',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Ahmedabad'
];

export default function UploadCard({ onClassify, error }: UploadCardProps) {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('Delhi');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = () => {
    if (selectedImage && selectedCity) {
      onClassify(selectedImage, selectedCity);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t('uploadTitle')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('uploadDescription')}
          </p>
        </div>

        <div
          onClick={triggerFileInput}
          className="relative border-2 border-dashed border-green-300 rounded-2xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-200"
        >
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 mx-auto rounded-xl object-cover"
              />
              <p className="text-sm text-green-700 font-medium">
                {t('tapToChange')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  {t('tapToCapture')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('imageFormats')}
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 text-green-600" />
            {t('selectCity')}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
          >
            {CITIES.map((city) => {
              const cityKey = city.toLowerCase();
              return (
                <option key={city} value={city}>
                  {t(`cities.${cityKey}`)}
                </option>
              );
            })}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedImage}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {t('classifyButton')}
        </button>
      </div>
    </div>
  );
}
