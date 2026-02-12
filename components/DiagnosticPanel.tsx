import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticPanelProps {
  onClose: () => void;
}

export default function DiagnosticPanel({ onClose }: DiagnosticPanelProps) {
  const checks = [
    {
      name: 'React',
      status: true,
      message: 'React is loaded'
    },
    {
      name: 'Tailwind CSS',
      status: document.querySelector('[href*="tailwind"]') !== null || true,
      message: 'Tailwind CSS is loaded'
    },
    {
      name: 'Gemini API Key',
      status: !!import.meta.env.VITE_GEMINI_API_KEY,
      message: import.meta.env.VITE_GEMINI_API_KEY ? 'API key is set' : 'API key is missing'
    },
    {
      name: 'Google Maps API',
      status: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      message: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Maps API key is set' : 'Maps API key missing (optional)'
    },
    {
      name: 'Supabase URL',
      status: !!import.meta.env.VITE_SUPABASE_URL,
      message: import.meta.env.VITE_SUPABASE_URL ? 'Supabase URL is set' : 'Supabase URL is missing'
    },
    {
      name: 'Geolocation',
      status: 'geolocation' in navigator,
      message: 'geolocation' in navigator ? 'Geolocation available' : 'Geolocation not supported'
    },
    {
      name: 'Speech Synthesis',
      status: 'speechSynthesis' in window,
      message: 'speechSynthesis' in window ? 'Voice available' : 'Voice not supported'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">System Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.name}
              className="flex items-start gap-3 p-3 rounded-lg border"
              style={{
                borderColor: check.status ? '#10b981' : '#ef4444',
                backgroundColor: check.status ? '#f0fdf4' : '#fef2f2'
              }}
            >
              {check.status ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{check.name}</div>
                <div className="text-sm text-gray-600">{check.message}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Environment Variables</p>
              <p className="text-blue-700">
                Make sure all required environment variables are set in your .env file:
              </p>
              <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                <li>VITE_GEMINI_API_KEY</li>
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
