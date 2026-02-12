/*
  # Atlas AI Navigation Platform - Initial Schema

  ## Overview
  This migration creates the complete database schema for the Atlas AI Navigation Platform,
  a Waze-like navigation app with AI chat capabilities and community features.

  ## New Tables

  ### `users`
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email address
  - `name` (text) - User display name
  - `avatar_url` (text) - Profile picture URL
  - `google_drive_connected` (boolean) - Whether Google Drive is connected
  - `google_drive_token` (text) - Encrypted Google Drive access token
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `chat_history`
  - `id` (uuid, primary key) - Chat message unique identifier
  - `user_id` (uuid, foreign key) - References users table
  - `role` (text) - Message role (user/assistant/system)
  - `content` (text) - Message content
  - `location` (jsonb) - Location data when message was sent
  - `created_at` (timestamptz) - Message timestamp

  ### `routes`
  - `id` (uuid, primary key) - Route unique identifier
  - `user_id` (uuid, foreign key) - References users table
  - `name` (text) - Route name/description
  - `origin` (jsonb) - Starting point with lat/lng
  - `destination` (jsonb) - End point with lat/lng
  - `waypoints` (jsonb) - Array of intermediate points
  - `distance_km` (numeric) - Total distance in kilometers
  - `duration_minutes` (integer) - Estimated duration
  - `traffic_level` (text) - Traffic condition (light/moderate/heavy)
  - `is_favorite` (boolean) - User marked as favorite
  - `created_at` (timestamptz) - Route creation timestamp
  - `completed_at` (timestamptz) - Route completion timestamp

  ### `community_reports`
  - `id` (uuid, primary key) - Report unique identifier
  - `user_id` (uuid, foreign key) - Reporter user ID
  - `report_type` (text) - Type: accident, hazard, police, traffic, construction, road_closure
  - `location` (jsonb) - Report location with lat/lng and address
  - `description` (text) - Report details
  - `severity` (text) - Severity level: low, medium, high, critical
  - `upvotes` (integer) - Number of confirmations
  - `downvotes` (integer) - Number of disputes
  - `status` (text) - Status: active, resolved, expired
  - `image_url` (text) - Optional photo of incident
  - `expires_at` (timestamptz) - When report becomes inactive
  - `created_at` (timestamptz) - Report creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `saved_places`
  - `id` (uuid, primary key) - Saved place unique identifier
  - `user_id` (uuid, foreign key) - References users table
  - `place_type` (text) - Type: home, work, custom
  - `name` (text) - Place name
  - `address` (text) - Full address
  - `location` (jsonb) - Location with lat/lng
  - `icon` (text) - Icon identifier
  - `created_at` (timestamptz) - Place save timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `traffic_data`
  - `id` (uuid, primary key) - Traffic data point identifier
  - `road_segment_id` (text) - Identifier for road segment
  - `location` (jsonb) - Segment location data
  - `speed_kmh` (numeric) - Current average speed
  - `congestion_level` (text) - Level: free_flow, light, moderate, heavy, standstill
  - `incident_count` (integer) - Number of incidents on segment
  - `created_at` (timestamptz) - Data timestamp

  ### `report_votes`
  - `id` (uuid, primary key) - Vote identifier
  - `report_id` (uuid, foreign key) - References community_reports
  - `user_id` (uuid, foreign key) - References users table
  - `vote_type` (text) - Type: upvote, downvote
  - `created_at` (timestamptz) - Vote timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Community reports are publicly readable but only owners can update
  - Traffic data is publicly readable
  - Report votes are tracked per user to prevent duplicate voting
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  google_drive_connected boolean DEFAULT false,
  google_drive_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  location jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  origin jsonb NOT NULL,
  destination jsonb NOT NULL,
  waypoints jsonb DEFAULT '[]'::jsonb,
  distance_km numeric,
  duration_minutes integer,
  traffic_level text CHECK (traffic_level IN ('light', 'moderate', 'heavy')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('accident', 'hazard', 'police', 'traffic', 'construction', 'road_closure')),
  location jsonb NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  image_url text,
  expires_at timestamptz DEFAULT (now() + interval '4 hours'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_places table
CREATE TABLE IF NOT EXISTS saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  place_type text NOT NULL CHECK (place_type IN ('home', 'work', 'custom')),
  name text NOT NULL,
  address text NOT NULL,
  location jsonb NOT NULL,
  icon text DEFAULT 'pin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create traffic_data table
CREATE TABLE IF NOT EXISTS traffic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  road_segment_id text NOT NULL,
  location jsonb NOT NULL,
  speed_kmh numeric NOT NULL,
  congestion_level text NOT NULL CHECK (congestion_level IN ('free_flow', 'light', 'moderate', 'heavy', 'standstill')),
  incident_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create report_votes table
CREATE TABLE IF NOT EXISTS report_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES community_reports(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_created_at ON community_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_data_segment ON traffic_data(road_segment_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_report_id ON report_votes(report_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for chat_history table
CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for routes table
CREATE POLICY "Users can view own routes"
  ON routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
  ON routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for community_reports table
CREATE POLICY "Anyone can view active community reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can insert community reports"
  ON community_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own community reports"
  ON community_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for saved_places table
CREATE POLICY "Users can view own saved places"
  ON saved_places FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved places"
  ON saved_places FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved places"
  ON saved_places FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved places"
  ON saved_places FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for traffic_data table (public read)
CREATE POLICY "Anyone can view traffic data"
  ON traffic_data FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for report_votes table
CREATE POLICY "Users can view own votes"
  ON report_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own votes"
  ON report_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON report_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON report_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_reports_updated_at BEFORE UPDATE ON community_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_places_updated_at BEFORE UPDATE ON saved_places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();