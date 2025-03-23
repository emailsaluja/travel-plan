import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Edit2, Trash2, Plus, Star, MapPin, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

interface FoodPlace {
    id: string;
    name: string;
    description?: string;
    rating?: number;
    userRatingsTotal?: number;
    photoUrl?: string;
    priceLevel?: number;
    cuisine?: string;
    isSelected?: boolean;
    food_desc?: string;
    openNow?: boolean;
    isManuallyAdded?: boolean;
}

interface PlaceSearchResponse {
    results: google.maps.places.PlaceResult[];
    status: google.maps.places.PlacesServiceStatus;
}

interface PlaceDetailsResponse {
    details: google.maps.places.PlaceResult | null;
    status: google.maps.places.PlacesServiceStatus;
}

interface SearchType {
    type: 'restaurant';
    query: string;
}

interface FoodPopupProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    selectedFoodItems: string[];
    onFoodSelect: (foodItems: string[], foodDesc?: string) => void;
}

const FoodPopup: React.FC<FoodPopupProps> = ({
    isOpen,
    onClose,
    destination,
    selectedFoodItems,
    onFoodSelect
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingFood, setEditingFood] = useState<{ name: string; desc: string } | null>(null);
    const [manualFoodPlaces, setManualFoodPlaces] = useState<FoodPlace[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodDesc, setNewFoodDesc] = useState('');
    const [isAddingFood, setIsAddingFood] = useState(false);
    const currentDestination = useRef<string>(destination);
    const foodDescriptions = useRef<Record<string, string>>({});

    // Reset state when popup opens or destination changes
    useEffect(() => {
        if (isOpen) {
            // Always reset state for a new session
            setSearchQuery('');
            setEditingFood(null);
            setNewFoodName('');
            setNewFoodDesc('');
            setIsAddingFood(false);

            // Reset food data if destination changed
            if (currentDestination.current !== destination) {
                currentDestination.current = destination;
                setManualFoodPlaces([]);
                setSelectedItems([]);
                foodDescriptions.current = {};
            }

            try {
                // Parse existing food descriptions if available
                const existingDescriptions = selectedFoodItems.length > 0 && selectedFoodItems[0].startsWith('{')
                    ? JSON.parse(selectedFoodItems[0])
                    : {};

                // Filter out the JSON string if it exists
                const actualFoodItems = selectedFoodItems.filter(item => !item.startsWith('{'));

                // Initialize food places for current destination
                const uniqueFoodItems = Array.from(new Set(actualFoodItems));
                setSelectedItems(uniqueFoodItems);
                foodDescriptions.current = existingDescriptions;

                setManualFoodPlaces(uniqueFoodItems.map(item => ({
                    id: item,
                    name: item,
                    food_desc: existingDescriptions[item] || '',
                    isManuallyAdded: true,
                    isSelected: true
                })));
            } catch (error) {
                // If there's an error parsing JSON, just use the items as is
                const uniqueFoodItems = Array.from(new Set(selectedFoodItems));
                setSelectedItems(uniqueFoodItems);
                setManualFoodPlaces(uniqueFoodItems.map(item => ({
                    id: item,
                    name: item,
                    food_desc: '',
                    isManuallyAdded: true,
                    isSelected: true
                })));
            }
        }
    }, [isOpen, selectedFoodItems, destination]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
    };

    const handleDeleteFood = (foodName: string) => {
        const newSelectedItems = selectedItems.filter(item => item !== foodName);
        setSelectedItems(newSelectedItems);
        setManualFoodPlaces(prevPlaces =>
            prevPlaces.filter(place => place.name !== foodName)
        );
        // Also remove from descriptions
        delete foodDescriptions.current[foodName];
    };

    const handleEditFood = (foodName: string, foodDesc: string = '') => {
        setEditingFood({ name: foodName, desc: foodDesc });
    };

    const handleSaveEdit = () => {
        if (!editingFood) return;

        const updatedName = editingFood.name.trim();
        if (!updatedName) return;

        // Check for duplicates before saving
        if (updatedName !== editingFood.name &&
            manualFoodPlaces.some(place => place.name === updatedName)) {
            return; // Don't allow duplicate names
        }

        // Update the food descriptions
        if (editingFood.name in foodDescriptions.current) {
            delete foodDescriptions.current[editingFood.name];
        }
        foodDescriptions.current[updatedName] = editingFood.desc;

        setManualFoodPlaces(prevPlaces =>
            prevPlaces.map(place =>
                place.name === editingFood.name
                    ? { ...place, name: updatedName, food_desc: editingFood.desc }
                    : place
            )
        );

        // Update selected items if name changed
        if (updatedName !== editingFood.name) {
            setSelectedItems(prev =>
                prev.map(item => item === editingFood.name ? updatedName : item)
            );
        }

        setEditingFood(null);
    };

    const handleClose = () => {
        // Update descriptions from current state
        manualFoodPlaces.forEach(place => {
            if (selectedItems.includes(place.name)) {
                foodDescriptions.current[place.name] = place.food_desc || '';
            }
        });

        // Pass back the selected items and their descriptions
        const foodItems = selectedItems.filter(item =>
            manualFoodPlaces.some(place => place.name === item)
        );

        // Add the descriptions as the first item in the array
        const itemsWithDesc = [
            JSON.stringify(foodDescriptions.current),
            ...foodItems
        ];

        onFoodSelect(itemsWithDesc, JSON.stringify(foodDescriptions.current));
        onClose();
    };

    const handleAddFood = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newFoodName.trim();

        if (name) {
            // Check if the food item already exists
            if (!manualFoodPlaces.some(place => place.name.toLowerCase() === name.toLowerCase())) {
                const newPlace: FoodPlace = {
                    id: name,
                    name: name,
                    food_desc: newFoodDesc.trim(),
                    isManuallyAdded: true,
                    isSelected: true
                };

                // Add to descriptions
                foodDescriptions.current[name] = newFoodDesc.trim();

                setManualFoodPlaces(prev => [...prev, newPlace]);
                setSelectedItems(prev => [...prev, name]);
                setNewFoodName('');
                setNewFoodDesc('');
                setIsAddingFood(false);
            }
        }
    };

    const filteredFoodPlaces = manualFoodPlaces.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.food_desc?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold">Food & Restaurants</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search food & restaurants..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                        />
                    </div>

                    {/* Add Food Button */}
                    <div className="mb-6">
                        {!isAddingFood ? (
                            <button
                                onClick={() => setIsAddingFood(true)}
                                className="flex items-center gap-2 px-4 py-2 text-[#00C48C] border-2 border-[#00C48C] rounded-lg hover:bg-[#00C48C] hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add New Restaurant</span>
                            </button>
                        ) : (
                            <form onSubmit={handleAddFood} className="space-y-3">
                                <input
                                    type="text"
                                    value={newFoodName}
                                    onChange={(e) => setNewFoodName(e.target.value)}
                                    placeholder="Restaurant name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    required
                                />
                                <textarea
                                    value={newFoodDesc}
                                    onChange={(e) => setNewFoodDesc(e.target.value)}
                                    placeholder="Description/Address"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingFood(false);
                                            setNewFoodName('');
                                            setNewFoodDesc('');
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors"
                                    >
                                        Add Restaurant
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Food List */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {filteredFoodPlaces.map((place) => (
                            <div
                                key={place.id}
                                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    {editingFood?.name === place.name ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editingFood.name}
                                                onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                            />
                                            <textarea
                                                value={editingFood.desc}
                                                onChange={(e) => setEditingFood({ ...editingFood, desc: e.target.value })}
                                                placeholder="Description/Address"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                                                rows={3}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingFood(null)}
                                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1 text-sm bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380]"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="font-medium text-gray-900">{place.name}</h3>
                                            {place.food_desc && (
                                                <p className="text-gray-600 text-sm mt-1">{place.food_desc}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                                {editingFood?.name !== place.name && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditFood(place.name, place.food_desc)}
                                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFood(place.name)}
                                            className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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

export default FoodPopup; 