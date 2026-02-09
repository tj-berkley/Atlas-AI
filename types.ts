
export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  uri?: string;
  type: 'restaurant' | 'landmark' | 'activity' | 'general';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  grounding?: GroundingChunk[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
