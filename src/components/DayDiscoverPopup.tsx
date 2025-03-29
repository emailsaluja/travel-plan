import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Compass, Check, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { supabase } from '../lib/supabase';
import { Dialog } from '@headlessui/react';

// Add a function to generate unique IDs
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface Attraction {
  id: string;
  name: string;
  description: string;
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
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize attractions from selectedAttractions prop
  useEffect(() => {
    if (selectedAttractions.length > 0) {
      const initialAttractions = selectedAttractions.map(name => ({
        id: generateUniqueId(),
        name,
        description: ''
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
                description: ''
              };
            }
            return {
              id: attraction.id || generateUniqueId(),
              name: attraction.name || '',
              description: attraction.description || ''
            };
          }).filter(attraction => attraction.name.trim() !== '');
        }

        console.log('Final processed attractions:', attractionsList);
        setAttractions(attractionsList);
      }
    };

    fetchAttractions();
  }, [itineraryId, dayIndex, isOpen]);

  const handleAddAttraction = () => {
    if (!newAttractionName.trim()) return;

    const newAttraction: Attraction = {
      id: generateUniqueId(),
      name: newAttractionName.trim(),
      description: newAttractionDesc.trim()
    };

    setAttractions([...attractions, newAttraction]);
    setNewAttractionName('');
    setNewAttractionDesc('');
    setShowAddForm(false);
  };

  const handleSaveChanges = async () => {
    try {
      // Try to update first
      const { data: updateData, error: updateError } = await supabase
        .from('user_itinerary_day_attractions')
        .update({
          attractions: attractions.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description
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
              attractions: attractions.map(a => ({
                id: a.id,
                name: a.name,
                description: a.description
              }))
            })
            .select();

          if (insertError) {
            console.error('Error inserting attractions:', insertError);
            return;
          }
        } else {
          console.error('Error updating attractions:', updateError);
          return;
        }
      }

      onAttractionsUpdate(attractions);
      onClose();
    } catch (error) {
      console.error('Error saving attractions:', error);
    }
  };

  const handleEditAttraction = async (id: string) => {
    if (!editName.trim()) return;

    const updatedAttractions = attractions.map(attraction =>
      attraction.id === id
        ? {
          ...attraction,
          name: editName.trim(),
          description: editDesc.trim()
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
            description: a.description
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
            description: a.description
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
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-3">
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="relative bg-white rounded-xl w-full max-w-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#00B8A9]/5 rounded-t-xl border-b border-[#00B8A9]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00B8A9]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#00B8A9]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Discover Places
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  {cleanDestination(destination)} · {date}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-500 hover:bg-[#00B8A9]/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Add Attraction Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-[#00B8A9]/5 text-[#00B8A9] rounded-lg hover:bg-[#00B8A9]/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Place
            </button>

            {/* Add Attraction Form */}
            {showAddForm && (
              <div className="mb-6 p-4 border border-[#E2E8F0] rounded-lg">
                <input
                  type="text"
                  value={newAttractionName}
                  onChange={(e) => setNewAttractionName(e.target.value)}
                  placeholder="Place name"
                  className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
                />
                <textarea
                  value={newAttractionDesc}
                  onChange={(e) => setNewAttractionDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full mb-4 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
                  rows={3}
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
                    className="px-4 py-2 bg-[#00B8A9] text-white rounded-md hover:bg-[#009B8E] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Attractions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Selected Places</h3>
                <span className="px-2.5 py-0.5 bg-[#00B8A9]/10 text-[#00B8A9] text-sm font-medium rounded-full">
                  {attractions.length} {attractions.length === 1 ? 'place' : 'places'}
                </span>
              </div>
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {attractions.map((attraction) => (
                  <div
                    key={attraction.id}
                    className="p-3 hover:bg-gray-50 group transition-colors"
                  >
                    {isEditing === attraction.id ? (
                      <div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Place name"
                          className="w-full mb-2 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full mb-4 px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
                          rows={3}
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
                            className="px-4 py-2 bg-[#00B8A9] text-white rounded-md hover:bg-[#009B8E] transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#00B8A9]/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-[#00B8A9]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {typeof attraction.name === 'string' ? attraction.name : ''}
                            </p>
                            {attraction.description && (
                              <p className="text-xs text-gray-500">
                                {typeof attraction.description === 'string' ? attraction.description : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setIsEditing(attraction.id);
                              setEditName(attraction.name);
                              setEditDesc(attraction.description || '');
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttraction(attraction.id)}
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {attractions.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#00B8A9]/5 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-[#00B8A9]/40" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No places selected</p>
                    <p className="text-xs text-gray-400 mt-0.5">Add some exciting spots to your itinerary!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-1.5 bg-[#00B8A9] text-white rounded-lg hover:bg-[#009B8E] transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default DayDiscoverPopup; 