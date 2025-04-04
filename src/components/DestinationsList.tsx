import React from 'react';
import { MapPin, Navigation, Bed, Sparkles, ArrowRight, Plane, Train, Car, Bus, Calendar } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

interface Destination {
    destination: string;
    nights: number;
    discover?: string;
    manual_discover?: string;
    manual_discover_desc?: string;
    discover_descriptions?: { [key: string]: string };
    food_descriptions?: { [key: string]: string };
    transport?: string;
    notes?: string;
    food?: string;
    food_desc?: string;
}

interface DestinationsListProps {
    destinations: Destination[];
    startDate: string;
}

const DestinationsList: React.FC<DestinationsListProps> = ({ destinations, startDate }) => {
    const getTransportIcon = (transport: string | undefined) => {
        const lowerTransport = transport?.toLowerCase() || '';
        if (lowerTransport.includes('fly') || lowerTransport.includes('plane') || lowerTransport.includes('air')) {
            return Plane;
        } else if (lowerTransport.includes('train')) {
            return Train;
        } else if (lowerTransport.includes('bus')) {
            return Bus;
        }
        return Car;
    };

    const getAllHighlights = (destination: Destination) => {
        const autoHighlights = destination.discover?.split(',').filter(Boolean).map(h => h.trim()) || [];
        const manualHighlights = destination.manual_discover?.split(',').filter(Boolean).map(h => h.trim()) || [];
        return [...autoHighlights, ...manualHighlights];
    };

    const getHighlightDescription = (destination: Destination, highlight: string) => {
        // First check manual description if it's a manual highlight
        if (destination.manual_discover?.includes(highlight)) {
            return destination.manual_discover_desc;
        }
        // Then check discover_descriptions for automatic highlights
        return destination.discover_descriptions?.[highlight] || '';
    };

    const getDestinationDates = (index: number) => {
        let currentDate = new Date(startDate);
        for (let i = 0; i < index; i++) {
            currentDate.setDate(currentDate.getDate() + destinations[i].nights);
        }

        const arrivalDate = new Date(currentDate);
        const departureDate = new Date(currentDate);
        departureDate.setDate(departureDate.getDate() + destinations[index].nights);

        return {
            arrival: arrivalDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            departure: departureDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        };
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {destinations.map((destination, index) => {
                const dates = getDestinationDates(index);
                const highlights = getAllHighlights(destination);

                return (
                    <React.Fragment key={index}>
                        {/* Destination Card */}
                        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200 overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00C48C] text-white font-semibold text-lg shadow-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-6 h-6 text-[#00C48C]" />
                                                <h3 className="text-2xl font-semibold text-gray-900">
                                                    {cleanDestination(destination.destination)}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Bed className="w-5 h-5 text-[#F59E0B]" />
                                                    <span className="text-sm font-medium text-gray-700">{destination.nights} nights</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-5 h-5 text-[#6366F1]" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {dates.arrival} - {dates.departure}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Highlights */}
                                {highlights.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                                            <Sparkles className="w-4 h-4 text-[#00B8A9]" />
                                            Highlights
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {highlights.map((highlight, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col gap-1.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                                                >
                                                    <span className="text-sm font-medium text-gray-900">{highlight}</span>
                                                    {getHighlightDescription(destination, highlight) && (
                                                        <span className="text-xs text-gray-600 leading-relaxed">
                                                            {getHighlightDescription(destination, highlight)}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transportation to Next Destination */}
                        {index < destinations.length - 1 && (
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                                    <ArrowRight className="w-6 h-6 text-[#6366F1]" />
                                </div>
                                <div className="ml-20 flex items-center gap-3 py-4 px-6 bg-[#F8FAFC] rounded-xl border-2 border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Navigation className="w-5 h-5 text-[#6366F1]" />
                                        <span className="text-base font-medium">
                                            Travel to {cleanDestination(destinations[index + 1].destination)}
                                        </span>
                                    </div>
                                    <div className="h-6 w-px bg-gray-200" />
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const TransportIcon = getTransportIcon(destination.transport);
                                            return <TransportIcon className="w-5 h-5 text-[#6366F1]" />;
                                        })()}
                                        <span className="text-base font-medium text-gray-700">{destination.transport}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default DestinationsList; 