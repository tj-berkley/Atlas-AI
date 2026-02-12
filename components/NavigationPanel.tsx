import { useState, useEffect } from 'react';
import { Navigation, MapPin, Clock, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { navigationService, RouteData } from '../services/navigationService';
import { Route } from '../lib/supabase';

interface NavigationPanelProps {
  currentLocation: { lat: number; lng: number } | null;
  onRouteSelect: (route: RouteData) => void;
}

export default function NavigationPanel({ currentLocation, onRouteSelect }: NavigationPanelProps) {
  const [destination, setDestination] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [recentRoutes, setRecentRoutes] = useState<Route[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'recent'>('search');

  useEffect(() => {
    loadRecentRoutes();
  }, []);

  const loadRecentRoutes = async () => {
    const routes = await navigationService.getUserRoutes(10);
    setRecentRoutes(routes);
  };

  const handleNavigate = async () => {
    if (!currentLocation || !destination) return;

    setIsCalculating(true);
    try {
      const destCoords = await geocodeAddress(destination);
      if (!destCoords) {
        alert('Could not find destination');
        return;
      }

      const route = await navigationService.calculateRoute(currentLocation, destCoords);
      onRouteSelect(route);

      await navigationService.saveRoute({
        user_id: 'temp-user',
        name: destination,
        origin: { ...currentLocation, address: 'Current Location' },
        destination: { ...destCoords, address: destination },
        waypoints: [],
        distance_km: route.distance_km,
        duration_minutes: route.duration_minutes,
        traffic_level: route.traffic_level,
        is_favorite: false,
      });

      await loadRecentRoutes();
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Failed to calculate route');
    } finally {
      setIsCalculating(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          resolve(null);
        }
      });
    });
  };

  const handleRecentRouteSelect = async (route: Route) => {
    if (!currentLocation) return;

    setIsCalculating(true);
    try {
      const routeData = await navigationService.calculateRoute(
        currentLocation,
        route.destination
      );
      onRouteSelect(routeData);
    } catch (error) {
      console.error('Route select error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleFavorite = async (routeId: string, isFavorite: boolean) => {
    await navigationService.toggleFavoriteRoute(routeId, !isFavorite);
    await loadRecentRoutes();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold">Navigation</h2>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            activeTab === 'search'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            activeTab === 'recent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where to?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
              />
            </div>
          </div>

          <button
            onClick={handleNavigate}
            disabled={!currentLocation || !destination || isCalculating}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isCalculating ? 'Calculating...' : 'Start Navigation'}
          </button>

          {!currentLocation && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>Enable location to start navigation</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentRoutes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent routes</p>
            </div>
          ) : (
            recentRoutes.map((route) => (
              <div
                key={route.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRecentRouteSelect(route)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-500">{route.destination.address}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(route.id, route.is_favorite);
                    }}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        route.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span>{route.distance_km?.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{route.duration_minutes} min</span>
                  </div>
                  {route.traffic_level && (
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        className={`w-4 h-4 ${
                          route.traffic_level === 'heavy'
                            ? 'text-red-500'
                            : route.traffic_level === 'moderate'
                            ? 'text-amber-500'
                            : 'text-green-500'
                        }`}
                      />
                      <span className="capitalize">{route.traffic_level}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
