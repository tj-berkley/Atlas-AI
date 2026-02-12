import { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { navigationService } from './services/navigationService';
import { communityService } from './services/communityService';
import { ChatMessage, UserLocation } from './types';
import { GroundingLinks } from './components/GroundingLink';
import NavigationPanel from './components/NavigationPanel';
import CommunityReportPanel from './components/CommunityReportPanel';
import GoogleDrivePanel from './components/GoogleDrivePanel';
import { Navigation2, MessageSquare, AlertCircle, Cloud, Menu, X, Volume2, VolumeX } from 'lucide-react';

type PanelType = 'chat' | 'navigation' | 'reports' | 'drive';

const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Welcome to Atlas AI Navigation! I can help you find routes, explore places, and navigate safely. Where would you like to go today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<UserLocation | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activePanel, setActivePanel] = useState<PanelType>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [nearbyReportsCount, setNearbyReportsCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    startLocationTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (location) {
      loadNearbyReportsCount();
    }
  }, [location]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(newLocation);
        setLocationStatus('success');

        navigationService.setUserId('demo-user');
        communityService.setUserId('demo-user');
      },
      () => {
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const loadNearbyReportsCount = async () => {
    if (!location) return;
    const reports = await communityService.getNearbyReports(
      { lat: location.latitude, lng: location.longitude },
      5
    );
    setNearbyReportsCount(reports.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await geminiService.exploreArea(userMsg, location);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        grounding: response.groundingChunks
      }]);

      if (voiceEnabled) {
        speak(response.text);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRouteSelect = (route: any) => {
    setCurrentRoute(route);
    if (voiceEnabled) {
      speak(`Route calculated. Distance: ${route.distance_km.toFixed(1)} kilometers. Estimated time: ${route.duration_minutes} minutes.`);
    }
  };

  const panels = [
    { id: 'chat' as PanelType, label: 'Chat', icon: MessageSquare },
    { id: 'navigation' as PanelType, label: 'Navigate', icon: Navigation2 },
    { id: 'reports' as PanelType, label: 'Reports', icon: AlertCircle, badge: nearbyReportsCount },
    { id: 'drive' as PanelType, label: 'Drive', icon: Cloud },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className={`
        fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Navigation2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">Atlas AI</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activePanel === 'chat' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2">AI Assistant</h3>
                <p className="text-sm text-gray-600">
                  Ask me about routes, places, traffic conditions, or anything else!
                </p>
              </div>

              {locationStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Location Active</span>
                  </div>
                  <p className="text-green-600 text-xs mt-1">
                    {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              {currentRoute && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Active Route</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Distance: {currentRoute.distance_km.toFixed(1)} km</p>
                    <p>Time: {currentRoute.duration_minutes} minutes</p>
                    <p className="capitalize">Traffic: {currentRoute.traffic_level}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'navigation' && (
            <NavigationPanel
              currentLocation={location ? { lat: location.latitude, lng: location.longitude } : null}
              onRouteSelect={handleRouteSelect}
            />
          )}

          {activePanel === 'reports' && (
            <CommunityReportPanel
              currentLocation={location ? { lat: location.latitude, lng: location.longitude } : null}
              onReportCreated={loadNearbyReportsCount}
            />
          )}

          {activePanel === 'drive' && <GoogleDrivePanel />}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md">
                <Navigation2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Atlas AI Navigation</h1>
                <p className="text-xs text-gray-500">Powered by Gemini & Supabase</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-all ${
                voiceEnabled
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={voiceEnabled ? 'Voice On' : 'Voice Off'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
              locationStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : locationStatus === 'loading'
                ? 'bg-gray-100 text-gray-400'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                locationStatus === 'success' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="hidden sm:inline">
                {locationStatus === 'success' ? 'Live' : locationStatus === 'loading' ? 'Connecting' : 'No GPS'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                  {msg.grounding && <GroundingLinks chunks={msg.grounding} />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 flex items-center gap-3 shadow-md border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {panels.map(panel => (
                <button
                  key={panel.id}
                  onClick={() => {
                    setActivePanel(panel.id);
                    setIsSidebarOpen(true);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    activePanel === panel.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <panel.icon className="w-4 h-4" />
                  <span>{panel.label}</span>
                  {panel.badge !== undefined && panel.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {panel.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about routes, places, or traffic..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
