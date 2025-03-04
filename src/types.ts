export interface DayPlan {
  day: number;
  title: string;
  activities: string[];
  dinnerSuggestion: {
    name: string;
    cuisine: string;
    description: string;
  };
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  country: string;
  cities: string[];
  likes: number;
  createdAt: string;
  tags: string[];
  dayByDay: DayPlan[];
  rating?: number;
  reviews?: number;
  host?: string;
  destinations?: {
    city: string;
    days: number;
    highlights: string[];
    coordinates: {
      lat: number;
      lng: number;
    };
    transportToNext?: {
      type: 'train' | 'bus' | 'plane' | 'ferry';
      duration: string;
      distance: string;
      description: string;
    };
  }[];
} 