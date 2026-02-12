import { supabase, Route, CommunityReport } from '../lib/supabase';

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
}

export interface RouteData {
  distance_km: number;
  duration_minutes: number;
  steps: NavigationStep[];
  traffic_level: 'light' | 'moderate' | 'heavy';
  polyline: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

class NavigationService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }> = []
  ): Promise<RouteData> {
    const distance = this.calculateDistance(origin, destination);
    const baseTime = (distance / 60) * 60;

    const nearbyReports = await this.getNearbyReports(origin, destination);
    const trafficMultiplier = this.calculateTrafficMultiplier(nearbyReports);

    const duration = baseTime * trafficMultiplier;
    const traffic_level = trafficMultiplier > 1.5 ? 'heavy' : trafficMultiplier > 1.2 ? 'moderate' : 'light';

    return {
      distance_km: distance,
      duration_minutes: Math.round(duration),
      steps: this.generateSteps(origin, destination),
      traffic_level,
      polyline: this.generatePolyline(origin, destination, waypoints),
      bounds: {
        north: Math.max(origin.lat, destination.lat),
        south: Math.min(origin.lat, destination.lat),
        east: Math.max(origin.lng, destination.lng),
        west: Math.min(origin.lng, destination.lng),
      },
    };
  }

  async saveRoute(route: Omit<Route, 'id' | 'created_at'>): Promise<Route | null> {
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('routes')
      .insert([route])
      .select()
      .single();

    if (error) {
      console.error('Error saving route:', error);
      return null;
    }

    return data;
  }

  async getUserRoutes(limit = 20): Promise<Route[]> {
    if (!this.userId) return [];

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching routes:', error);
      return [];
    }

    return data || [];
  }

  async toggleFavoriteRoute(routeId: string, isFavorite: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('routes')
      .update({ is_favorite: isFavorite })
      .eq('id', routeId);

    return !error;
  }

  async getNearbyReports(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
    radiusKm = 5
  ): Promise<CommunityReport[]> {
    const { data, error } = await supabase
      .from('community_reports')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    if (error || !data) return [];

    return data.filter((report: CommunityReport) => {
      const distance1 = this.calculateDistance(point1, report.location);
      const distance2 = this.calculateDistance(point2, report.location);
      return distance1 <= radiusKm || distance2 <= radiusKm;
    });
  }

  private calculateTrafficMultiplier(reports: CommunityReport[]): number {
    if (reports.length === 0) return 1.0;

    const trafficReports = reports.filter(r =>
      ['accident', 'traffic', 'construction', 'road_closure'].includes(r.report_type)
    );

    if (trafficReports.length === 0) return 1.0;

    const highSeverity = trafficReports.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    const mediumSeverity = trafficReports.filter(r => r.severity === 'medium').length;

    return 1.0 + (highSeverity * 0.3) + (mediumSeverity * 0.15);
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private generateSteps(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): NavigationStep[] {
    const totalDistance = this.calculateDistance(origin, destination);
    const bearing = this.calculateBearing(origin, destination);

    return [
      {
        instruction: this.getDirectionText(bearing),
        distance: totalDistance * 1000,
        duration: (totalDistance / 60) * 3600,
        maneuver: 'turn-right',
      },
      {
        instruction: 'Continue straight',
        distance: totalDistance * 800,
        duration: (totalDistance / 60) * 2880,
        maneuver: 'straight',
      },
      {
        instruction: 'Arrive at destination',
        distance: 0,
        duration: 0,
        maneuver: 'arrive',
      },
    ];
  }

  private calculateBearing(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): number {
    const startLat = this.deg2rad(start.lat);
    const startLng = this.deg2rad(start.lng);
    const endLat = this.deg2rad(end.lat);
    const endLng = this.deg2rad(end.lng);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    const bearing = Math.atan2(y, x);
    return (bearing * 180) / Math.PI;
  }

  private getDirectionText(bearing: number): string {
    const normalizedBearing = ((bearing + 360) % 360);

    if (normalizedBearing >= 337.5 || normalizedBearing < 22.5) return 'Head north';
    if (normalizedBearing >= 22.5 && normalizedBearing < 67.5) return 'Head northeast';
    if (normalizedBearing >= 67.5 && normalizedBearing < 112.5) return 'Head east';
    if (normalizedBearing >= 112.5 && normalizedBearing < 157.5) return 'Head southeast';
    if (normalizedBearing >= 157.5 && normalizedBearing < 202.5) return 'Head south';
    if (normalizedBearing >= 202.5 && normalizedBearing < 247.5) return 'Head southwest';
    if (normalizedBearing >= 247.5 && normalizedBearing < 292.5) return 'Head west';
    return 'Head northwest';
  }

  private generatePolyline(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>
  ): string {
    const points = [origin, ...waypoints, destination];
    return points.map(p => `${p.lat},${p.lng}`).join('|');
  }

  async completeRoute(routeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('routes')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', routeId);

    return !error;
  }
}

export const navigationService = new NavigationService();
