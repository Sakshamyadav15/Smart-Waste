import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-12 text-center animate-fadeIn">
      <div className="space-y-6">
        <div className="flex justify-center">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Classifying Waste...
          </h3>
          <p className="text-sm text-gray-600">
            Our AI is analyzing your image
          </p>
          <p className="text-xs text-gray-500 mt-2">
            First use? The AI model (~90MB) will download and be cached in your browser
          </p>
        </div>

        <div className="max-w-xs mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
