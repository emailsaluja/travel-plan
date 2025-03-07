import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Itinerary {
  id: string;
  title: string;
  duration: number;
  country?: string;
  cities: string[];
  imageUrl: string;
  description: string;
  likes: number;
  createdAt: string;
  tags?: string[];
  dayByDay?: DayPlan[];
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  activities?: string[];
  imageUrl?: string;
}

export interface User extends Omit<SupabaseUser, 'email'> {
  email: string;
  id: string;
  name: string;
  profilePicture?: string;
  savedItineraries: string[];
  createdItineraries: string[];
}