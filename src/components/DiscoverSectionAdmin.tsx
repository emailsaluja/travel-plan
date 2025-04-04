import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Save } from 'lucide-react';

interface Itinerary {
    id: string;
    trip_name: string;
    country: string;
    start_date: string;
    duration: number;
    created_at: string;
    updated_at: string;
    user_id: string;
    user_profiles: {
        id: string;
        full_name: string;
        username: string;
    };
}

interface SectionAssignment {
    id: string;
    itinerary_id: string;
    section_name: string;
    display_order: number;
    created_at: string;
}

const DISCOVER_SECTIONS = [
    'Featured Destinations',
    'Unique Experiences',
    'Tropical Escape',
    'Mountain Retreat',
    'Trending Destinations',
    'Seasonal Highlights',
    'Travel Mood Boards',
    'Urban Adventure',
    'Historical Journey',
    'Hidden Gems',
    'Most Popular Itineraries',
    'Bucket List Experiences',
    'Family Friendly Itineraries',
    'Adventurous Itineraries'
];

export const DiscoverSectionAdmin: React.FC = () => {
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [assignments, setAssignments] = useState<SectionAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string>('Featured Destinations');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load itineraries from user_itineraries table
            const { data: itinerariesData, error: itinerariesError } = await supabase
                .from('user_itineraries')
                .select('*')
                .order('updated_at', { ascending: false });

            if (itinerariesError) throw itinerariesError;

            // Get all unique user IDs from itineraries
            const userIds = [...new Set((itinerariesData || []).map(i => i.user_id))];

            // Fetch user profiles for these users
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, full_name, username')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // Create a map of user profiles for quick lookup
            const userProfilesMap = (profilesData || []).reduce((acc, profile) => {
                acc[profile.id] = profile;
                return acc;
            }, {} as Record<string, any>);

            // Combine itineraries with user profiles
            const enrichedItineraries = (itinerariesData || []).map(itinerary => ({
                ...itinerary,
                user_profiles: userProfilesMap[itinerary.user_id] || {
                    id: itinerary.user_id,
                    full_name: 'Unknown',
                    username: 'unknown'
                }
            }));

            setItineraries(enrichedItineraries);

            // Load section assignments
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('discover_section_assignments')
                .select('*')
                .order('display_order', { ascending: true });

            if (assignmentsError) throw assignmentsError;
            setAssignments(assignmentsData || []);
        } catch (error: any) {
            setError(error.message);
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssignment = async (itineraryId: string) => {
        try {
            setError(null);

            // Get the current max display order for the section
            const sectionAssignments = assignments.filter(a => a.section_name === selectedSection);
            const maxOrder = sectionAssignments.length > 0
                ? Math.max(...sectionAssignments.map(a => a.display_order))
                : 0;

            const newAssignment = {
                itinerary_id: itineraryId,
                section_name: selectedSection,
                display_order: maxOrder + 1
            };

            const { data, error } = await supabase
                .from('discover_section_assignments')
                .insert([newAssignment])
                .select()
                .single();

            if (error) throw error;

            setAssignments([...assignments, data]);
        } catch (error: any) {
            setError(error.message);
            console.error('Error adding assignment:', error);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            setError(null);

            const { error } = await supabase
                .from('discover_section_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            setAssignments(assignments.filter(a => a.id !== assignmentId));
        } catch (error: any) {
            setError(error.message);
            console.error('Error removing assignment:', error);
        }
    };

    const handleReorderAssignment = async (assignmentId: string, newOrder: number) => {
        try {
            setError(null);

            const { error } = await supabase
                .from('discover_section_assignments')
                .update({ display_order: newOrder })
                .eq('id', assignmentId);

            if (error) throw error;

            setAssignments(assignments.map(a =>
                a.id === assignmentId ? { ...a, display_order: newOrder } : a
            ).sort((a, b) => a.display_order - b.display_order));
        } catch (error: any) {
            setError(error.message);
            console.error('Error reordering assignment:', error);
        }
    };

    const getAssignedItineraries = (sectionName: string) => {
        return assignments
            .filter(a => a.section_name === sectionName)
            .sort((a, b) => a.display_order - b.display_order)
            .map(a => itineraries.find(i => i.id === a.itinerary_id))
            .filter((i): i is Itinerary => i !== undefined);
    };

    const getUnassignedItineraries = (sectionName: string) => {
        const assignedIds = assignments
            .filter(a => a.section_name === sectionName)
            .map(a => a.itinerary_id);
        return itineraries.filter(i => !assignedIds.includes(i.id));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No date set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTripDetails = (itinerary: Itinerary) => {
        const country = itinerary.country || 'No country set';
        const startDate = formatDate(itinerary.start_date);
        return `${country} • Starting ${startDate}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    const assignedItineraries = getAssignedItineraries(selectedSection);
    const unassignedItineraries = getUnassignedItineraries(selectedSection);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Discover Page Section Management</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Section Selection */}
            <div className="mb-6">
                <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Section
                </label>
                <select
                    id="section-select"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                >
                    {DISCOVER_SECTIONS.map(section => (
                        <option key={section} value={section}>
                            {section}
                        </option>
                    ))}
                </select>
            </div>

            {/* Assigned Itineraries */}
            <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Assigned Itineraries
                </h3>
                <div className="space-y-4">
                    {assignedItineraries.map((itinerary, index) => (
                        <div
                            key={itinerary.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{itinerary.trip_name}</h4>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        ID: {itinerary.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {itinerary.duration} days in {getTripDetails(itinerary)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    By @{itinerary.user_profiles?.username || 'unknown'} •
                                    Updated {formatDate(itinerary.updated_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleReorderAssignment(
                                            assignments.find(a => a.itinerary_id === itinerary.id)?.id || '',
                                            index - 1
                                        )}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => handleReorderAssignment(
                                            assignments.find(a => a.itinerary_id === itinerary.id)?.id || '',
                                            index + 1
                                        )}
                                        disabled={index === assignedItineraries.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    >
                                        ↓
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleRemoveAssignment(
                                        assignments.find(a => a.itinerary_id === itinerary.id)?.id || ''
                                    )}
                                    className="p-2 text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Available Itineraries */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Available Itineraries
                </h3>
                <div className="space-y-4">
                    {unassignedItineraries.map(itinerary => (
                        <div
                            key={itinerary.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{itinerary.trip_name}</h4>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        ID: {itinerary.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {itinerary.duration} days in {getTripDetails(itinerary)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    By @{itinerary.user_profiles?.username || 'unknown'} •
                                    Updated {formatDate(itinerary.updated_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleAddAssignment(itinerary.id)}
                                className="p-2 text-[#00C48C] hover:text-[#00B380]"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 