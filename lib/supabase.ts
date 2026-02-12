import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  google_drive_connected: boolean;
  google_drive_token?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  created_at: string;
}

export interface Route {
  id: string;
  user_id: string;
  name: string;
  origin: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  waypoints: Array<{
    lat: number;
    lng: number;
    address?: string;
  }>;
  distance_km?: number;
  duration_minutes?: number;
  traffic_level?: 'light' | 'moderate' | 'heavy';
  is_favorite: boolean;
  created_at: string;
  completed_at?: string;
}

export interface CommunityReport {
  id: string;
  user_id?: string;
  report_type: 'accident' | 'hazard' | 'police' | 'traffic' | 'construction' | 'road_closure';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  upvotes: number;
  downvotes: number;
  status: 'active' | 'resolved' | 'expired';
  image_url?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  place_type: 'home' | 'work' | 'custom';
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  icon: string;
  created_at: string;
  updated_at: string;
}
