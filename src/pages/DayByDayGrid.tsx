import React, { useState } from 'react';
import { MapPin, Utensils } from 'lucide-react';

interface FoodOption {
    id: string;
    name: string;
    cuisine: string;
    known_for?: string;
}

interface Destination {
    destination: string;
    nights: number;
    discover?: string;
    manual_discover?: string;
    food?: string;
}

interface DayByDayGridProps {
    itinerary: {
        destinations: Destination[];
    };
    dayAttractions: Array<{
        dayIndex: number;
        selectedAttractions: string[];
    }>;
    dayFoodOptions: Array<{
        dayIndex: number;
        foodItems: FoodOption[];
    }>;
    onTabChange?: (tab: string) => void;
}

const DayByDayGrid: React.FC<DayByDayGridProps> = ({
    itinerary,
    onTabChange,
    dayAttractions,
    dayFoodOptions
}) => {
    const [selectedTab, setSelectedTab] = useState<'destinations' | 'dayByDay'>('destinations');

    const handleTabChange = (tab: 'destinations' | 'dayByDay') => {
        setSelectedTab(tab);
        onTabChange?.(tab);
    };

    return (
        <div className="space-y-8">
            {itinerary.destinations.map((destination: Destination, destIndex: number) => (
                <div key={destIndex} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">{destination.destination}</h3>

                    {/* Attractions */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Attractions & Activities</h4>
                        {(() => {
                            const dayAttraction = dayAttractions.find(da => da.dayIndex === destIndex);
                            const attractions = dayAttraction?.selectedAttractions || [];
                            return attractions.length > 0 ? (
                                attractions.map((attraction: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <span className="text-gray-900">{attraction}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No attractions added</p>
                            );
                        })()}
                    </div>

                    {/* Food Options */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Food & Dining</h4>
                        {(() => {
                            const dayFood = dayFoodOptions.find(df => df.dayIndex === destIndex);
                            const foodItems = dayFood?.foodItems || [];
                            return foodItems.length > 0 ? (
                                foodItems.map((food: FoodOption, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Utensils className="w-3 h-3 text-orange-600" />
                                        </div>
                                        <div>
                                            <span className="text-gray-900">{food.name}</span>
                                            <p className="text-gray-500 text-xs">{food.cuisine}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No dining options added</p>
                            );
                        })()}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DayByDayGrid; 