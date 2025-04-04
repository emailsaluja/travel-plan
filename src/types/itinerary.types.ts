export interface TripDetails {
    trip_name: string;
    country: string;
    duration: number;
    start_date?: string;
    travelers?: number;
    image_url?: string;
    budget?: string;
}

export interface Activity {
    time: string;
    type: string;
    activity: string;
    description: string;
    category?: 'activity' | 'food' | 'hotel' | 'transport';
    location?: string;
    cost?: string;
}

export interface Destination {
    name: string;
    nights: number;
    description: string;
    image?: string;
}

export interface DailyPlan {
    day: number;
    activities: Activity[];
}

export interface EditingActivity {
    day: number;
    index: number;
}

export interface SavedAIItinerary {
    id: string;
    trip_name: string;
    country: string;
    duration: number;
    start_date?: string;
    travelers?: number;
    image_url?: string;
    budget?: string;
    created_at: string;
    generated_itinerary: {
        destinations: Destination[];
        dailyPlans: DailyPlan[];
    };
} 