export interface SaveItineraryData {
    tripSummary: {
        tripName: string;
        country: string;
        duration: number;
        startDate: string;
        passengers: number;
        isPrivate: boolean;
        tags: string[];
    };
    destinations: Array<{
        destination: string;
        nights: number;
        discover: string;
        transport: string;
        notes: string;
        food: string;
        hotel?: string;
        manual_hotel?: string;
    }>;
    dayAttractions: Array<{
        dayIndex: number;
        selectedAttractions: string[];
    }>;
    dayHotels?: Array<{
        day_index: number;
        hotel: string;
    }>;
    dayNotes?: Array<{
        day_index: number;
        notes: string;
    }>;
} 