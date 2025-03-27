import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Compass, Check, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';

// Add a function to generate unique IDs
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface Attraction {
  id: string;
  name: string;
  description: string;
  time?: string;
}

interface DayDiscoverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  destination: string;
  selectedAttractions: string[];
  itineraryId: string;
  dayIndex: number;
  onAttractionsUpdate: (attractions: Attraction[]) => void;
}

const DayDiscoverPopup: React.FC<DayDiscoverPopupProps> = ({
  isOpen,
  onClose,
  date,
  destination,
  selectedAttractions,
  itineraryId,
  dayIndex,
  onAttractionsUpdate,
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newAttractionName, setNewAttractionName] = useState('');
  const [newAttractionDesc, setNewAttractionDesc] = useState('');
  const [newAttractionTime, setNewAttractionTime] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize attractions from selectedAttractions prop
  useEffect(() => {
    if (selectedAttractions.length > 0) {
      const initialAttractions = selectedAttractions.map(name => ({
        id: generateUniqueId(),
        name,
        description: '',
        time: ''
      }));
      setAttractions(initialAttractions);
    }
  }, [selectedAttractions]);

  // Fetch attractions from the database
  useEffect(() => {
    const fetchAttractions = async () => {
      if (!itineraryId || !isOpen) return;

      console.log('Fetching attractions for:', { itineraryId, dayIndex });

      const { data, error } = await supabase
        .from('user_itinerary_day_attractions')
        .select('attractions')
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex)
        .single();

      if (error) {
        console.error('Error fetching attractions:', error);
        return;
      }

      console.log('Raw fetched data:', data);

      if (data && data.attractions) {
        let attractionsList: Attraction[] = [];
        if (Array.isArray(data.attractions)) {
          attractionsList = data.attractions.map((attraction: any) => {
            if (typeof attraction === 'string') {
              return {
                id: generateUniqueId(),
                name: attraction,
                description: '',
                time: ''
              };
            }
            return {
              id: attraction.id || generateUniqueId(),
              name: attraction.name || '',
              description: attraction.description || '',
              time: attraction.time || ''
            };
          }).filter(attraction => attraction.name.trim() !== '');
        }

        console.log('Final processed attractions:', attractionsList);
        setAttractions(attractionsList);
      }
    };

    fetchAttractions();
  }, [itineraryId, dayIndex, isOpen]);

  const handleAddAttraction = async () => {
    if (!newAttractionName.trim()) return;

    const newAttraction: Attraction = {
      id: generateUniqueId(),
      name: newAttractionName.trim(),
      description: newAttractionDesc.trim(),
      time: newAttractionTime.trim()
    };

    const updatedAttractions = [...attractions, newAttraction];

    try {
      // Try to update first
      const { data: updateData, error: updateError } = await supabase
        .from('user_itinerary_day_attractions')
        .update({
          attractions: updatedAttractions.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            time: a.time
          }))
        })
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex)
        .select();

      if (updateError) {
        // If update fails because record doesn't exist, try insert
        if (updateError.code === 'PGRST116') {
          const { data: insertData, error: insertError } = await supabase
            .from('user_itinerary_day_attractions')
            .insert({
              itinerary_id: itineraryId,
              day_index: dayIndex,
              attractions: updatedAttractions.map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                time: a.time
              }))
            })
            .select();

          if (insertError) {
            console.error('Error inserting attraction:', insertError);
            return;
          }
        } else {
          console.error('Error updating attraction:', updateError);
          return;
        }
      }

      setAttractions(updatedAttractions);
      setNewAttractionName('');
      setNewAttractionDesc('');
      setNewAttractionTime('');
      setShowAddForm(false);
      onAttractionsUpdate(updatedAttractions);
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const handleEditAttraction = async (id: string) => {
    if (!editName.trim()) return;

    const updatedAttractions = attractions.map(attraction =>
      attraction.id === id
        ? {
          ...attraction,
          name: editName.trim(),
          description: editDesc.trim(),
          time: editTime.trim()
        }
        : attraction
    );

    try {
      const { error: updateError } = await supabase
        .from('user_itinerary_day_attractions')
        .update({
          attractions: updatedAttractions.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            time: a.time
          }))
        })
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex);

      if (updateError) {
        console.error('Error updating attraction:', updateError);
        return;
      }

      setAttractions(updatedAttractions);
      setIsEditing(null);
      setEditName('');
      setEditDesc('');
      setEditTime('');
      onAttractionsUpdate(updatedAttractions);
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  const handleDeleteAttraction = async (id: string) => {
    const updatedAttractions = attractions.filter(attraction => attraction.id !== id);

    try {
      const { error: updateError } = await supabase
        .from('user_itinerary_day_attractions')
        .update({
          attractions: updatedAttractions.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            time: a.time
          }))
        })
        .eq('itinerary_id', itineraryId)
        .eq('day_index', dayIndex);

      if (updateError) {
        console.error('Error updating attractions:', updateError);
        return;
      }

      setAttractions(updatedAttractions);
      onAttractionsUpdate(updatedAttractions);
    } catch (error) {
      console.error('Error saving attraction:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00B8A9]/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#00B8A9]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1E293B]">
                {cleanDestination(destination)}
              </h2>
              <p className="text-sm text-[#64748B]">{date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Add Attraction Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 text-[#6366F1] border border-[#6366F1] rounded-lg hover:bg-[#EEF2FF] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Attraction
          </button>

          {/* Add Attraction Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border border-[#E2E8F0] rounded-lg">
              <input
                type="text"
                value={newAttractionName}
                onChange={(e) => setNewAttractionName(e.target.value)}
                placeholder="Attraction name"
                className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
              <textarea
                value={newAttractionDesc}
                onChange={(e) => setNewAttractionDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                rows={3}
              />
              <input
                type="time"
                value={newAttractionTime}
                onChange={(e) => setNewAttractionTime(e.target.value)}
                className="w-full mb-4 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttraction}
                  className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Attractions List */}
          <div className="space-y-4">
            {attractions.map((attraction) => (
              <div
                key={attraction.id}
                className="relative rounded-lg border border-[#E2E8F0] p-4 hover:shadow-md transition-all"
              >
                {isEditing === attraction.id ? (
                  <div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Attraction name"
                      className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                      rows={3}
                    />
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      placeholder="Select time"
                      className="w-full mb-4 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(null)}
                        className="px-4 py-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditAttraction(attraction.id)}
                        className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#00B8A9]" />
                        <span className="font-medium text-[#1E293B]">
                          {typeof attraction.name === 'string' ? attraction.name : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(attraction.id);
                            setEditName(attraction.name);
                            setEditDesc(attraction.description || '');
                            setEditTime(attraction.time || '');
                            console.log('Setting edit values:', {
                              name: attraction.name,
                              description: attraction.description,
                              time: attraction.time
                            });
                          }}
                          className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttraction(attraction.id)}
                          className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 ml-8 space-y-1">
                      {typeof attraction.description === 'string' && attraction.description && (
                        <p className="text-sm text-[#64748B]">
                          {attraction.description}
                        </p>
                      )}
                      {typeof attraction.time === 'string' && attraction.time && (
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <Clock className="w-4 h-4" />
                          <span>{attraction.time}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayDiscoverPopup; 