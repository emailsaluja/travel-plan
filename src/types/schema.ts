import { User as SupabaseUser } from '@supabase/supabase-js';

// User Profile Schema
export interface UserProfile {
    user_id: string;
    username: string;
    full_name: string;
    bio: string;
    measurement_system: 'metric' | 'imperial';
    privacy_setting: 'everyone' | 'approved_only';
    profile_picture_url?: string;
    hero_banner_url?: string;
    created_at?: string;
    updated_at?: string;
}

// User Itinerary Schema
export interface UserItinerary {
    id: string;
    user_id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    passengers: number;
    is_private: boolean;
    tags?: string[];
    created_at: string;
}

// User Itinerary Destination Schema
export interface UserItineraryDestination {
    id: string;
    itinerary_id: string;
    destination: string;
    nights: number;
    discover: string;
    transport: string;
    notes: string;
    food: string;
    manual_hotel: string;
    manual_hotel_desc: string;
    manual_discover: string;
    manual_discover_desc: string;
    order_index: number;
}

// User Itinerary Day Attraction Schema
export interface UserItineraryDayAttraction {
    id: string;
    itinerary_id: string;
    day_index: number;
    attractions: string[];
}

// User Itinerary Day Hotel Schema
export interface UserItineraryDayHotel {
    id: string;
    itinerary_id: string;
    day_index: number;
    hotel: string;
    is_manual?: boolean;
}

// User Itinerary Day Note Schema
export interface UserItineraryDayNote {
    id: string;
    itinerary_id: string;
    day_index: number;
    notes: string;
}

// User Settings Schema (Legacy)
export interface UserSettings {
    user_id: string;
    username: string;
    full_name: string;
    bio: string;
    profile_picture_url: string;
    hero_banner_url: string;
    website_url: string;
    youtube_url: string;
    instagram_url: string;
    updated_at?: string;
}

// Country Images Schema
export interface CountryImage {
    id: string;
    name: string;
    code: string;
    folder_name: string;
}

// Extended User Type
export interface User extends Omit<SupabaseUser, 'email'> {
    email: string;
    id: string;
    name: string;
    profilePicture?: string;
    savedItineraries: string[];
    createdItineraries: string[];
}

// Save Itinerary Data Type
export interface SaveItineraryData {
    tripSummary: {
        tripName: string;
        country: string;
        duration: number;
        startDate: string;
        passengers: number;
        isPrivate: boolean;
        tags?: string[];
    };
    destinations: {
        destination: string;
        nights: number;
        discover: string;
        transport: string;
        notes: string;
        food: string;
        hotel?: string;
    }[];
    dayAttractions: {
        dayIndex: number;
        selectedAttractions: string[];
    }[];
    dayHotels: {
        day_index: number;
        hotel: string;
        is_manual?: boolean;
    }[];
    dayNotes: {
        day_index: number;
        notes: string;
    }[];
}

// Itinerary Schema (Template/Public Itineraries)
export interface Itinerary {
    id: string;
    title: string;
    description: string;
    image_url: string;
    duration: number;
    country: string;
    cities: string[];
    likes: number;
    tags?: string[];
    rating?: number;
    reviews?: number;
    host?: string;
    created_at: string;
}

// Destination Schema (Template/Public Destinations)
export interface Destination {
    id: string;
    itinerary_id: string;
    city: string;
    days: number;
    lat: number;
    lng: number;
    sequence_number: number;
}

// Destination Highlight Schema
export interface DestinationHighlight {
    id: string;
    destination_id: string;
    highlight: string;
}

// Transport Details Schema
export interface TransportDetails {
    id: string;
    from_destination_id: string;
    type: string;
    duration: string;
    distance: number;
    description: string;
}

// Daily Plan Schema
export interface DailyPlan {
    id: string;
    itinerary_id: string;
    day_number: number;
    title: string;
}

// Daily Activity Schema
export interface DailyActivity {
    id: string;
    daily_plan_id: string;
    activity: string;
}

// Dinner Suggestion Schema
export interface DinnerSuggestion {
    id: string;
    daily_plan_id: string;
    name: string;
    cuisine: string;
    description: string;
}

// Hotel Schema
export interface Hotel {
    id: string;
    name: string;
    city: string;
    country: string;
    description: string;
    rating: number;
    price_per_night: number;
    amenities: string[];
    images: string[];
    lat: number;
    lng: number;
    address: string;
    website?: string;
    phone?: string;
    email?: string;
    created_at: string;
    updated_at: string;
}

// Profile Schema (Public Profiles)
export interface Profile {
    id: string;
    user_id: string;
    username: string;
    full_name: string;
    bio: string;
    profile_picture_url?: string;
    hero_banner_url?: string;
    website_url?: string;
    youtube_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    twitter_url?: string;
    location?: string;
    languages?: string[];
    interests?: string[];
    created_at: string;
    updated_at: string;
} 