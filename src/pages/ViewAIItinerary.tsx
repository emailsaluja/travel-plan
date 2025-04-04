import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, Sparkles, Plus, Edit, Trash, X, Save } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { aiItineraryService, SavedAIItinerary } from '../services/ai-itinerary.service';
import { formatDate } from '../utils/dateUtils';
import ActivityEditForm from '../components/ActivityEditForm';
import TripDetailsEditForm from '../components/TripDetailsEditForm';
import DestinationEditForm from '../components/DestinationEditForm';
import { supabase } from '../services/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Destination {
    name: string;
    nights: number;
    description: string;
    image?: string;
}

// Update the type definition
type DragResult = {
    destination?: {
        index: number;
        droppableId: string;
    };
    source: {
        index: number;
        droppableId: string;
    };
    draggableId: string;
};

const ViewAIItinerary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState<SavedAIItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDestination, setActiveDestination] = useState('');
    const [activeDay, setActiveDay] = useState(1);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newActivity, setNewActivity] = useState(null);
    const [editingActivity, setEditingActivity] = useState<{
        day: number;
        index: number;
        timeOfDay: 'morning' | 'afternoon' | 'evening';
    } | null>(null);
    const [editedItinerary, setEditedItinerary] = useState<SavedAIItinerary | null>(null);
    const [isEditingTripDetails, setIsEditingTripDetails] = useState(false);
    const [newDestination, setNewDestination] = useState<Destination | null>(null);
    const [editingDestination, setEditingDestination] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadItinerary = async () => {
            if (!id) return;

            try {
                const data = await aiItineraryService.getItineraryById(id);
                if (data) {
                    setItinerary(data);
                    setEditedItinerary(JSON.parse(JSON.stringify(data)));

                    // Set initial active destination
                    if (data.generated_itinerary.destinations.length > 0) {
                        setActiveDestination(data.generated_itinerary.destinations[0].name);
                        const firstDay = getFirstDayForDestination(data.generated_itinerary.destinations[0].name, data);
                        setActiveDay(firstDay);
                    }
                } else {
                    setError('Itinerary not found');
                }
            } catch (err) {
                console.error('Error loading itinerary:', err);
                setError('Failed to load itinerary');
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, [id]);

    const updateDestination = async (index: number, updatedDestination: Destination) => {
        if (!editedItinerary || !id) return;

        try {
            const newItinerary = JSON.parse(JSON.stringify(editedItinerary));
            const oldDestination = newItinerary.generated_itinerary.destinations[index];
            const nightsDifference = updatedDestination.nights - oldDestination.nights;

            // Calculate the start day for this destination
            let startDay = 1;
            for (let i = 0; i < index; i++) {
                startDay += newItinerary.generated_itinerary.destinations[i].nights;
            }

            // Update the destination
            newItinerary.generated_itinerary.destinations[index] = updatedDestination;

            // Handle daily plans adjustments
            if (nightsDifference > 0) {
                // Adding days
                const endDay = startDay + oldDestination.nights - 1;
                const newDays = Array.from({ length: nightsDifference }, (_, i) => ({
                    day: endDay + 1 + i,
                    activities: []
                }));

                // Insert new empty days after the current destination's days
                newItinerary.generated_itinerary.dailyPlans = [
                    ...newItinerary.generated_itinerary.dailyPlans.slice(0, endDay),
                    ...newDays,
                    ...newItinerary.generated_itinerary.dailyPlans.slice(endDay)
                ];
            } else if (nightsDifference < 0) {
                // Removing days
                const daysToRemove = Math.abs(nightsDifference);
                const endDay = startDay + oldDestination.nights - 1;
                const startIndex = endDay - daysToRemove + 1;

                // Remove the days from this destination
                newItinerary.generated_itinerary.dailyPlans = newItinerary.generated_itinerary.dailyPlans.filter(
                    (plan, index) => index < startIndex || index > endDay
                );
            }

            // Renumber all days sequentially
            let currentDay = 1;
            newItinerary.generated_itinerary.dailyPlans = newItinerary.generated_itinerary.dailyPlans
                .sort((a, b) => a.day - b.day)
                .map(plan => ({
                    ...plan,
                    day: currentDay++
                }));

            // Update total duration
            newItinerary.duration = newItinerary.generated_itinerary.destinations.reduce(
                (total, dest) => total + dest.nights, 0
            );

            // Save to database
            const { data, error } = await supabase
                .from('ai_itineraries')
                .update({
                    generated_itinerary: newItinerary.generated_itinerary,
                    duration: newItinerary.duration
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setItinerary(data);
            setEditedItinerary(data);
            setEditingDestination(null);

            // Update active day if needed
            if (activeDay > newItinerary.generated_itinerary.dailyPlans.length) {
                setActiveDay(1);
            }

            alert('Destination updated successfully!');
        } catch (error) {
            console.error('Error updating destination:', error);
            alert('Failed to update destination. Please try again.');
        }
    };

    // Helper function to get the absolute day number for a destination
    const getDestinationStartDay = (destinationIndex: number, destinations: Destination[]): number => {
        let startDay = 1;
        for (let i = 0; i < destinationIndex; i++) {
            startDay += destinations[i].nights;
        }
        return startDay;
    };

    // Update the getDestinationDays function
    const getDestinationDays = (destinationName: string, itineraryData: SavedAIItinerary) => {
        const destinations = itineraryData.generated_itinerary.destinations;
        const destinationIndex = destinations.findIndex(d => d.name === destinationName);

        if (destinationIndex === -1) return [];

        const startDay = getDestinationStartDay(destinationIndex, destinations);
        const nights = destinations[destinationIndex].nights;

        return Array.from({ length: nights }, (_, i) => startDay + i);
    };

    // Update the getFirstDayForDestination function
    const getFirstDayForDestination = (destinationName: string, itineraryData: SavedAIItinerary) => {
        const destinations = itineraryData.generated_itinerary.destinations;
        const destinationIndex = destinations.findIndex(d => d.name === destinationName);

        if (destinationIndex === -1) return 1;

        return getDestinationStartDay(destinationIndex, destinations);
    };

    // Update the getDestinationForDay function
    const getDestinationForDay = (dayNumber: number, itineraryData: SavedAIItinerary) => {
        const destinations = itineraryData.generated_itinerary.destinations;
        let currentDay = 1;

        for (const dest of destinations) {
            if (dayNumber >= currentDay && dayNumber < currentDay + dest.nights) {
                return dest.name;
            }
            currentDay += dest.nights;
        }

        return destinations[destinations.length - 1]?.name || '';
    };

    const saveChanges = async () => {
        if (!editedItinerary || !id) return;

        try {
            await aiItineraryService.updateItinerary(id, editedItinerary);
            setItinerary(editedItinerary);
            setIsEditMode(false);
            // Show success message
            alert('Itinerary saved successfully!');
        } catch (error) {
            console.error('Error saving itinerary:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    const handleTripDetailsUpdate = async (updatedDetails: TripDetails) => {
        if (!editedItinerary || !id) return;

        const newItinerary = {
            ...editedItinerary,
            trip_name: updatedDetails.trip_name,
            country: updatedDetails.country,
            duration: updatedDetails.duration,
            start_date: updatedDetails.start_date,
            travelers: updatedDetails.travelers,
            image_url: updatedDetails.image_url,
            budget: updatedDetails.budget,
            description: updatedDetails.description,
        };

        try {
            await aiItineraryService.updateItinerary(id, newItinerary);
            setItinerary(newItinerary);
            setEditedItinerary(newItinerary);
            setIsEditingTripDetails(false);
            alert('Trip details updated successfully!');
        } catch (error) {
            console.error('Error updating trip details:', error);
            alert('Failed to update trip details. Please try again.');
        }
    };

    const addDestination = async (newDest: Destination) => {
        if (!id) return;

        try {
            // Show loading state
            setIsLoading(true);

            const updatedItinerary = await aiItineraryService.addDestination(id, newDest);

            // Update local state
            setItinerary(updatedItinerary);
            setEditedItinerary(updatedItinerary);
            setNewDestination(null);

            // Set as active destination if it's the first one
            if (updatedItinerary.generated_itinerary.destinations.length === 1) {
                setActiveDestination(newDest.name);
                setActiveDay(1);
            }

            alert('Destination added successfully!');
        } catch (error) {
            console.error('Error adding destination:', error);
            alert('Failed to add destination. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDestination = (index: number) => {
        if (!editedItinerary) return;

        const newItinerary = { ...editedItinerary };
        const destinationToDelete = newItinerary.generated_itinerary.destinations[index];

        // Calculate days to remove
        const daysToRemove = getDestinationDays(destinationToDelete.name, editedItinerary);

        // Remove the destination
        newItinerary.generated_itinerary.destinations.splice(index, 1);

        // Remove daily plans for that destination
        newItinerary.generated_itinerary.dailyPlans = newItinerary.generated_itinerary.dailyPlans.filter(
            plan => !daysToRemove.includes(plan.day)
        );

        // Renumber the days
        newItinerary.generated_itinerary.dailyPlans.sort((a, b) => a.day - b.day);
        newItinerary.generated_itinerary.dailyPlans.forEach((plan, idx) => {
            plan.day = idx + 1;
        });

        setEditedItinerary(newItinerary);

        // Update active day/destination if needed
        if (newItinerary.generated_itinerary.destinations.length > 0) {
            const firstDest = newItinerary.generated_itinerary.destinations[0];
            setActiveDestination(firstDest.name);
            setActiveDay(1);
        }
    };

    const handleDeleteDestination = async (index: number) => {
        if (!id || !editedItinerary) return;

        const destinationName = editedItinerary.generated_itinerary.destinations[index].name;

        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete ${destinationName}? This will also delete all activities for this destination.`)) {
            return;
        }

        try {
            const updatedItinerary = await aiItineraryService.deleteDestination(id, index);

            // Update local state
            setItinerary(updatedItinerary);
            setEditedItinerary(updatedItinerary);

            // Update active destination if needed
            if (updatedItinerary.generated_itinerary.destinations.length > 0) {
                const firstDest = updatedItinerary.generated_itinerary.destinations[0];
                setActiveDestination(firstDest.name);
                setActiveDay(1);
            }

            alert('Destination deleted successfully!');
        } catch (error) {
            console.error('Error deleting destination:', error);
            alert('Failed to delete destination. Please try again.');
        }
    };

    const addActivity = async (dayNumber: number, newActivity: Activity) => {
        if (!editedItinerary || !id) return;

        try {
            // Create a copy of the current itinerary
            const newItinerary = JSON.parse(JSON.stringify(editedItinerary));

            // Find the daily plan for this day
            let dailyPlan = newItinerary.generated_itinerary.dailyPlans.find(
                (plan: any) => plan.day === dayNumber
            );

            // If no daily plan exists for this day, create one
            if (!dailyPlan) {
                dailyPlan = {
                    day: dayNumber,
                    activities: []
                };
                newItinerary.generated_itinerary.dailyPlans.push(dailyPlan);
                newItinerary.generated_itinerary.dailyPlans.sort((a: any, b: any) => a.day - b.day);
            }

            // Add the new activity
            dailyPlan.activities.push(newActivity);

            // Sort activities by time
            dailyPlan.activities.sort((a: any, b: any) => {
                const timeA = parseInt(a.time.replace(':', ''));
                const timeB = parseInt(b.time.replace(':', ''));
                return timeA - timeB;
            });

            // Update the itinerary in the database
            const { data, error } = await supabase
                .from('ai_itineraries')
                .update({
                    generated_itinerary: newItinerary.generated_itinerary
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setItinerary(data);
            setEditedItinerary(data);
            setNewActivity(null);

            alert('Activity added successfully!');
        } catch (error) {
            console.error('Error adding activity:', error);
            alert('Failed to add activity. Please try again.');
        }
    };

    const updateActivity = async (dayNumber: number, activityIndex: number, updatedActivity: Activity) => {
        if (!editedItinerary || !id) return;

        try {
            const newItinerary = JSON.parse(JSON.stringify(editedItinerary));

            const dailyPlan = newItinerary.generated_itinerary.dailyPlans.find(
                (plan: any) => plan.day === dayNumber
            );

            if (dailyPlan) {
                dailyPlan.activities[activityIndex] = updatedActivity;

                // Sort activities by time
                dailyPlan.activities.sort((a: any, b: any) => {
                    const timeA = parseInt(a.time.replace(':', ''));
                    const timeB = parseInt(b.time.replace(':', ''));
                    return timeA - timeB;
                });
            }

            const { data, error } = await supabase
                .from('ai_itineraries')
                .update({
                    generated_itinerary: newItinerary.generated_itinerary
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setItinerary(data);
            setEditedItinerary(data);
            setEditingActivity(null);

            alert('Activity updated successfully!');
        } catch (error) {
            console.error('Error updating activity:', error);
            alert('Failed to update activity. Please try again.');
        }
    };

    const deleteActivity = async (dayNumber: number, activityIndex: number) => {
        if (!editedItinerary || !id) return;

        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        try {
            const newItinerary = JSON.parse(JSON.stringify(editedItinerary));

            const dailyPlan = newItinerary.generated_itinerary.dailyPlans.find(
                (plan: any) => plan.day === dayNumber
            );

            if (dailyPlan) {
                dailyPlan.activities.splice(activityIndex, 1);
            }

            const { data, error } = await supabase
                .from('ai_itineraries')
                .update({
                    generated_itinerary: newItinerary.generated_itinerary
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setItinerary(data);
            setEditedItinerary(data);

            alert('Activity deleted successfully!');
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Failed to delete activity. Please try again.');
        }
    };

    // Add this helper function to get activities by time of day
    const getActivityIndex = (activities: Activity[], localIndex: number, timeOfDay: string): number => {
        const filteredActivities = activities.filter(activity => {
            const hour = parseInt(activity.time.split(':')[0]);
            if (timeOfDay === 'morning') return hour < 12;
            if (timeOfDay === 'afternoon') return hour >= 12 && hour < 17;
            if (timeOfDay === 'evening') return hour >= 17;
            return false;
        });

        const targetActivity = filteredActivities[localIndex];
        return activities.findIndex(a => a === targetActivity);
    };

    // Add this function to handle destination reordering
    const handleDestinationReorder = async (result: DragResult) => {
        if (!result.destination || !editedItinerary) return;

        try {
            const newItinerary = JSON.parse(JSON.stringify(editedItinerary));

            // Create a mapping of activities by destination before reordering
            const activitiesByDestination = new Map();
            let currentDestIndex = 0;
            let dayCounter = 1;

            // First, store all activities grouped by destination
            for (const destination of editedItinerary.generated_itinerary.destinations) {
                const destinationDays = [];
                for (let i = 0; i < destination.nights; i++) {
                    const dayPlan = editedItinerary.generated_itinerary.dailyPlans.find(
                        plan => plan.day === dayCounter
                    );
                    if (dayPlan) {
                        destinationDays.push(dayPlan.activities);
                    }
                    dayCounter++;
                }
                activitiesByDestination.set(destination.name, destinationDays);
                currentDestIndex++;
            }

            // Reorder the destinations
            const [reorderedDestination] = newItinerary.generated_itinerary.destinations.splice(result.source.index, 1);
            newItinerary.generated_itinerary.destinations.splice(result.destination.index, 0, reorderedDestination);

            // Rebuild daily plans with new day numbers but keeping activities with their destinations
            const newDailyPlans = [];
            let newDayCounter = 1;

            for (const destination of newItinerary.generated_itinerary.destinations) {
                const destinationActivities = activitiesByDestination.get(destination.name);

                // Create new daily plans for this destination with updated day numbers
                for (let night = 0; night < destination.nights; night++) {
                    newDailyPlans.push({
                        day: newDayCounter,
                        destination: destination.name, // Add destination reference
                        activities: destinationActivities[night] || [] // Keep original activities or use empty array if none exist
                    });
                    newDayCounter++;
                }
            }

            // Update the itinerary with new daily plans
            newItinerary.generated_itinerary.dailyPlans = newDailyPlans;

            // Save to database
            const { data, error } = await supabase
                .from('ai_itineraries')
                .update({
                    generated_itinerary: newItinerary.generated_itinerary
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setItinerary(data);
            setEditedItinerary(data);

            // Update active destination and day if needed
            if (activeDestination) {
                const newActiveDestIndex = data.generated_itinerary.destinations.findIndex(
                    d => d.name === activeDestination
                );
                if (newActiveDestIndex !== -1) {
                    // Calculate the new day number for the active destination
                    const newStartDay = data.generated_itinerary.dailyPlans.find(
                        plan => plan.destination === activeDestination
                    )?.day || 1;
                    setActiveDay(newStartDay);
                }
            }

        } catch (error) {
            console.error('Error reordering destinations:', error);
            alert('Failed to reorder destinations. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-gray-600 mb-4">The itinerary you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/dashboard?tab=aiItineraries')}
                        className="text-[#00C48C] hover:text-[#00B380] font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Get the active destination's image or a default
    const destinationImage = itinerary.generated_itinerary.destinations.find(d => d.name === activeDestination)?.image ||
        'https://images.unsplash.com/photo-1519677100203-a0e668c92439';

    // Get the activities for the active day
    const activeActivities = itinerary.generated_itinerary.dailyPlans.find(day => day.day === activeDay)?.activities || [];

    // Group activities by time of day
    const morningActivities = activeActivities.filter(a => a.type === 'morning' || parseInt(a.time) < 12);
    const afternoonActivities = activeActivities.filter(a => a.type === 'afternoon' || (parseInt(a.time) >= 12 && parseInt(a.time) < 17));
    const eveningActivities = activeActivities.filter(a => a.type === 'evening' || parseInt(a.time) >= 17);

    // Update the destinations section in your JSX to use editedItinerary when in edit mode
    const currentItinerary = isEditMode ? editedItinerary : itinerary;

    return (
        <div className="min-h-screen bg-slate-50">
            <TopNavigation />

            {/* Add Edit Controls */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-[80px] flex justify-between items-center">
                <button
                    onClick={() => navigate('/dashboard?tab=aiItineraries')}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </button>

                {/* Edit controls */}
                <div className="flex items-center gap-2">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditMode(false);
                                    // Reset any unsaved changes
                                    setEditedItinerary(JSON.parse(JSON.stringify(itinerary)));
                                }}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={saveChanges}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                            </button>
                            <button
                                onClick={() => setIsEditingTripDetails(true)}
                                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Edit Trip Details</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Edit className="h-4 w-4" />
                            <span>Edit Itinerary</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full h-[400px] overflow-hidden">
                <img
                    src={destinationImage}
                    alt={itinerary.trip_name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-8">
                    <h1 className="text-4xl font-bold text-white mb-2">{itinerary.trip_name}</h1>
                    <p className="text-white/90 text-lg">Last updated: {formatDate(itinerary.created_at)}</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-8">
                {/* Content Container */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* Metadata row */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span>{itinerary.country}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{itinerary.duration} days</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>Generated {formatDate(itinerary.created_at)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-600">AI-Generated</span>
                            </div>
                        </div>
                    </div>

                    {/* Destinations Navigation Bar */}
                    <div className="bg-gray-50 border-b border-gray-100 p-4">
                        <DragDropContext onDragEnd={handleDestinationReorder}>
                            <Droppable droppableId="destinations" direction="horizontal">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="flex flex-wrap gap-3 justify-center"
                                    >
                                        {currentItinerary.generated_itinerary.destinations.map((dest, index) => (
                                            <Draggable
                                                key={dest.name}
                                                draggableId={dest.name}
                                                index={index}
                                                isDragDisabled={!isEditMode}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`relative ${snapshot.isDragging ? 'z-50 shadow-lg' : ''}`}
                                                    >
                                                        <div
                                                            onClick={() => {
                                                                setActiveDestination(dest.name);
                                                                const firstDay = getFirstDayForDestination(dest.name, currentItinerary);
                                                                setActiveDay(firstDay);
                                                            }}
                                                            className={`relative flex flex-col items-center px-6 py-3 rounded-xl transition-all cursor-pointer ${activeDestination === dest.name
                                                                ? 'bg-blue-600 text-white shadow-md'
                                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            {/* Drag Handle - Only visible in edit mode */}
                                                            {isEditMode && (
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                    className="absolute -top-2 -left-2 p-1 bg-gray-200 rounded-full cursor-move hover:bg-gray-300"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                                                    </svg>
                                                                </div>
                                                            )}

                                                            {/* Destination Content */}
                                                            <div className="font-medium">{dest.name}</div>
                                                            <div className="text-xs flex items-center gap-1 mt-1">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{dest.nights} nights</span>
                                                            </div>

                                                            {/* Edit/Delete buttons */}
                                                            {isEditMode && (
                                                                <div
                                                                    className="absolute -top-2 -right-2 flex gap-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingDestination(index)}
                                                                        className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                                                                        title="Edit destination"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteDestination(index)}
                                                                        className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                                        title="Delete destination"
                                                                    >
                                                                        <Trash className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* Add Destination Button */}
                                        {isEditMode && (
                                            <button
                                                type="button"
                                                onClick={() => setNewDestination({
                                                    name: 'New Destination',
                                                    nights: 1,
                                                    description: 'Description of this destination',
                                                    image: ''
                                                })}
                                                className="flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-white text-gray-600 border border-dashed border-gray-300 hover:border-blue-300"
                                            >
                                                <Plus className="h-5 w-5 text-blue-500" />
                                                <span className="text-sm mt-1">Add Destination</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* New destination form */}
                    {newDestination && (
                        <div className="p-4">
                            <DestinationEditForm
                                destination={newDestination}
                                onSave={addDestination}
                                onCancel={() => setNewDestination(null)}
                            />
                        </div>
                    )}

                    {/* Day selection for current destination */}
                    <div className="bg-gray-100 p-4 flex flex-wrap gap-2 justify-center">
                        {getDestinationDays(activeDestination, itinerary).map(dayNum => (
                            <button
                                key={dayNum}
                                onClick={() => setActiveDay(dayNum)}
                                className={`px-4 py-2 rounded-full transition-all ${activeDay === dayNum
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Day {dayNum}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area - Daily plan */}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-8 text-gray-800">
                            Exploring {activeDestination} - Day {activeDay}
                        </h2>

                        <div className="space-y-6">
                            {/* Add new activity button */}
                            {isEditMode && (
                                <button
                                    onClick={() => setNewActivity({
                                        time: '09:00',
                                        type: 'morning',
                                        activity: 'New Activity',
                                        description: 'Description of the activity'
                                    })}
                                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span>Add New Activity</span>
                                </button>
                            )}

                            {/* New activity form */}
                            {isEditMode && newActivity && (
                                <div className="mb-6">
                                    <ActivityEditForm
                                        activity={newActivity}
                                        onSave={(activity) => addActivity(activeDay, activity)}
                                        onCancel={() => setNewActivity(null)}
                                    />
                                </div>
                            )}

                            {/* Morning Section */}
                            {morningActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-blue-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    <h3 className="text-blue-500 font-semibold text-lg ml-4 mb-4">Morning</h3>

                                    <div className="space-y-3 ml-4">
                                        {morningActivities.map((activity, idx) => (
                                            <div key={idx} className="relative bg-blue-50 rounded-md p-4 border-l-4 border-blue-300">
                                                {isEditMode && (
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'morning');
                                                                    setEditingActivity({
                                                                        day: activeDay,
                                                                        index: globalIndex,
                                                                        timeOfDay: 'morning'
                                                                    });
                                                                }
                                                            }}
                                                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'morning');
                                                                    deleteActivity(activeDay, globalIndex);
                                                                }
                                                            }}
                                                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}

                                                {editingActivity?.day === activeDay &&
                                                    editingActivity?.timeOfDay === 'morning' &&
                                                    getActivityIndex(editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [], idx, 'morning') === editingActivity.index ? (
                                                    <ActivityEditForm
                                                        activity={activity}
                                                        onSave={(updatedActivity) => {
                                                            const globalIndex = getActivityIndex(
                                                                editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [],
                                                                idx,
                                                                'morning'
                                                            );
                                                            updateActivity(activeDay, globalIndex, updatedActivity);
                                                            setEditingActivity(null);
                                                        }}
                                                        onCancel={() => setEditingActivity(null)}
                                                    />
                                                ) : (
                                                    <>
                                                        <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                        <div className="font-semibold text-blue-700 mb-1">{activity.activity}</div>
                                                        <div className="text-gray-700">{activity.description}</div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Afternoon Section */}
                            {afternoonActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-orange-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    <h3 className="text-orange-500 font-semibold text-lg ml-4 mb-4">Afternoon</h3>

                                    <div className="space-y-3 ml-4">
                                        {afternoonActivities.map((activity, idx) => (
                                            <div key={idx} className="relative bg-amber-50 rounded-md p-4 border-l-4 border-amber-300">
                                                {isEditMode && (
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'afternoon');
                                                                    setEditingActivity({
                                                                        day: activeDay,
                                                                        index: globalIndex,
                                                                        timeOfDay: 'afternoon'
                                                                    });
                                                                }
                                                            }}
                                                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'afternoon');
                                                                    deleteActivity(activeDay, globalIndex);
                                                                }
                                                            }}
                                                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}

                                                {editingActivity?.day === activeDay &&
                                                    editingActivity?.timeOfDay === 'afternoon' &&
                                                    getActivityIndex(editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [], idx, 'afternoon') === editingActivity.index ? (
                                                    <ActivityEditForm
                                                        activity={activity}
                                                        onSave={(updatedActivity) => {
                                                            const globalIndex = getActivityIndex(
                                                                editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [],
                                                                idx,
                                                                'afternoon'
                                                            );
                                                            updateActivity(activeDay, globalIndex, updatedActivity);
                                                            setEditingActivity(null);
                                                        }}
                                                        onCancel={() => setEditingActivity(null)}
                                                    />
                                                ) : (
                                                    <>
                                                        <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                        <div className="font-semibold text-amber-700 mb-1">{activity.activity}</div>
                                                        <div className="text-gray-700">{activity.description}</div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Evening Section */}
                            {eveningActivities.length > 0 && (
                                <div className="ml-2 relative">
                                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-purple-500 -translate-x-1/2"></div>
                                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

                                    <h3 className="text-purple-500 font-semibold text-lg ml-4 mb-4">Evening</h3>

                                    <div className="space-y-3 ml-4">
                                        {eveningActivities.map((activity, idx) => (
                                            <div key={idx} className="relative bg-purple-50 rounded-md p-4 border-l-4 border-purple-300">
                                                {isEditMode && (
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'evening');
                                                                    setEditingActivity({
                                                                        day: activeDay,
                                                                        index: globalIndex,
                                                                        timeOfDay: 'evening'
                                                                    });
                                                                }
                                                            }}
                                                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const dailyPlan = editedItinerary?.generated_itinerary.dailyPlans.find(
                                                                    plan => plan.day === activeDay
                                                                );
                                                                if (dailyPlan) {
                                                                    const globalIndex = getActivityIndex(dailyPlan.activities, idx, 'evening');
                                                                    deleteActivity(activeDay, globalIndex);
                                                                }
                                                            }}
                                                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}

                                                {editingActivity?.day === activeDay &&
                                                    editingActivity?.timeOfDay === 'evening' &&
                                                    getActivityIndex(editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [], idx, 'evening') === editingActivity.index ? (
                                                    <ActivityEditForm
                                                        activity={activity}
                                                        onSave={(updatedActivity) => {
                                                            const globalIndex = getActivityIndex(
                                                                editedItinerary?.generated_itinerary.dailyPlans.find(p => p.day === activeDay)?.activities || [],
                                                                idx,
                                                                'evening'
                                                            );
                                                            updateActivity(activeDay, globalIndex, updatedActivity);
                                                            setEditingActivity(null);
                                                        }}
                                                        onCancel={() => setEditingActivity(null)}
                                                    />
                                                ) : (
                                                    <>
                                                        <div className="font-medium text-gray-800 mb-2">{activity.time}</div>
                                                        <div className="font-semibold text-purple-700 mb-1">{activity.activity}</div>
                                                        <div className="text-gray-700">{activity.description}</div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* No activities message */}
                        {activeActivities.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    {isEditMode
                                        ? "Click 'Add New Activity' to start planning this day."
                                        : "No activities planned for this day."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Destinations Overview (still keeping the cards for reference) */}
                <h2 className="text-2xl font-bold mb-6 text-gray-800">All Destinations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {itinerary.generated_itinerary.destinations.map((dest, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md overflow-hidden h-full transform transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                            onClick={() => {
                                setActiveDestination(dest.name);
                                const firstDay = getFirstDayForDestination(dest.name, itinerary);
                                setActiveDay(firstDay);
                                window.scrollTo(0, 0);
                            }}
                        >
                            {dest.image && (
                                <div className="h-44 overflow-hidden">
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{dest.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{dest.nights} nights</span>
                                </div>
                                <p className="text-gray-700">{dest.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isEditingTripDetails && (
                <TripDetailsEditForm
                    tripDetails={{
                        trip_name: editedItinerary.trip_name,
                        country: editedItinerary.country,
                        duration: editedItinerary.duration,
                        start_date: editedItinerary.start_date || new Date().toISOString().split('T')[0],
                        travelers: editedItinerary.travelers || 1,
                        image_url: editedItinerary.image_url,
                        budget: editedItinerary.budget,
                        description: editedItinerary.description,
                    }}
                    onSave={handleTripDetailsUpdate}
                    onCancel={() => setIsEditingTripDetails(false)}
                />
            )}
        </div>
    );
};

export default ViewAIItinerary; 