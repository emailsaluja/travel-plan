import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

interface Itinerary {
    id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    passengers: number;
    destinations: {
        destination: string;
        nights: number;
    }[];
    day_attractions: Record<number, string[]>;
    day_hotels: Record<number, string>;
    day_notes: Record<number, string>;
}

const PublicItineraryView = () => {
    const { username, id } = useParams<{ username: string; id: string }>();
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadItinerary();
    }, [username, id]);

    const loadItinerary = async () => {
        try {
            setLoading(true);
            setError(null);

            // First get the user profile to verify username
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('username', username)
                .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Profile not found');

            // Then get the itinerary
            const { data: itineraryData, error: itineraryError } = await supabase
                .from('user_itineraries')
                .select('*')
                .eq('id', id)
                .eq('user_id', profileData.user_id)
                .single();

            if (itineraryError) throw itineraryError;
            if (!itineraryData) throw new Error('Itinerary not found');

            setItinerary(itineraryData);
        } catch (error: any) {
            console.error('Error loading itinerary:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-gray-600">The itinerary you're looking for doesn't exist or is private.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Banner */}
            <div className="h-[300px] relative bg-gradient-to-r from-[#00C48C] to-[#00B380]">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="max-w-[1400px] mx-auto px-4 h-full flex items-end pb-8 relative">
                    <div>
                        <Link
                            to={`/${username}`}
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Profile</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2">{itinerary.trip_name}</h1>
                        <div className="flex items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{itinerary.country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(itinerary.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{itinerary.duration} days</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{itinerary.passengers} travelers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-4 py-12">
                {/* Destinations */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-[#1e293b] mb-6">Destinations</h2>
                    <div className="grid gap-4">
                        {itinerary.destinations?.map((dest, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[#00C48C]/10 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-[#00C48C]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-[#1e293b]">{cleanDestination(dest.destination)}</h3>
                                    <p className="text-gray-500">{dest.nights} nights</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day by Day */}
                <div>
                    <h2 className="text-2xl font-bold text-[#1e293b] mb-6">Day by Day Plan</h2>
                    <div className="space-y-6">
                        {Array.from({ length: itinerary.duration }).map((_, dayIndex) => (
                            <div key={dayIndex} className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-[#1e293b] mb-4">Day {dayIndex + 1}</h3>

                                {/* Hotel */}
                                {itinerary.day_hotels?.[dayIndex] && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[#1e293b] mb-2">Hotel</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {itinerary.day_hotels[dayIndex]}
                                        </div>
                                    </div>
                                )}

                                {/* Attractions */}
                                {itinerary.day_attractions?.[dayIndex]?.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[#1e293b] mb-2">Places to Visit</h4>
                                        <div className="space-y-2">
                                            {itinerary.day_attractions[dayIndex].map((attraction, i) => (
                                                <div key={i} className="bg-gray-50 rounded-lg p-3">
                                                    {attraction}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {itinerary.day_notes?.[dayIndex] && (
                                    <div>
                                        <h4 className="text-sm font-medium text-[#1e293b] mb-2">Notes</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {itinerary.day_notes[dayIndex]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicItineraryView; 