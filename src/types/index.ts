export interface Itinerary {
  id: string;
  title: string;
  duration: number;
  country: string;
  cities: string[];
  imageUrl: string;
  description: string;
  likes: number;
  createdAt: string;
  tags: string[];
  dayByDay: DayPlan[];
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  activities?: string[];
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  savedItineraries: string[];
  createdItineraries: string[];
}