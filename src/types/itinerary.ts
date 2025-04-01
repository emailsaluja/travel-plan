export interface ItineraryDay {
    date: Date;
    dayIndex: number;
    destination: string;
    discover: string;
    manual_discover: string;
    transport: string;
    notes: string;
    food: string;
    hotel?: string;
    manual_hotel?: string;
}

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
        manual_discover: string;
        manual_discover_desc: string;
        transport: string;
        notes: string;
        food: string;
        hotel?: string;
        manual_hotel?: string;
        manual_hotel_desc?: string;
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