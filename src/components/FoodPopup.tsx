import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus, Utensils } from 'lucide-react';

interface FoodItem {
    id: string;
    name: {
        text: string;
        cuisine: string;
        known_for: string;
    };
}

interface FoodPopupProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    destination: string;
    selectedFoodItems: FoodItem[];
    itineraryId: string;
    dayIndex: number;
    onFoodUpdate: (foodItems: FoodItem[]) => void;
}

const FoodPopup: React.FC<FoodPopupProps> = ({
    isOpen,
    onClose,
    date,
    destination,
    selectedFoodItems,
    itineraryId,
    dayIndex,
    onFoodUpdate,
}) => {
    const [foodItems, setFoodItems] = useState<FoodItem[]>(
        selectedFoodItems?.map(item => ({
            id: item.id || Math.random().toString(36).substring(7),
            name: {
                text: item.name?.text || '',
                cuisine: item.name?.cuisine || '',
                known_for: item.name?.known_for || ''
            }
        })) || []
    );
    const [showAddNew, setShowAddNew] = useState(false);
    const [newFoodItem, setNewFoodItem] = useState<{
        text: string;
        cuisine: string;
        known_for: string;
    }>({
        text: '',
        cuisine: '',
        known_for: '',
    });

    useEffect(() => {
        // Ensure we properly format incoming food items
        setFoodItems(
            selectedFoodItems?.map(item => ({
                id: item.id || Math.random().toString(36).substring(7),
                name: {
                    text: item.name?.text || '',
                    cuisine: item.name?.cuisine || '',
                    known_for: item.name?.known_for || ''
                }
            })) || []
        );
    }, [selectedFoodItems]);

    const handleRemoveFood = (foodId: string) => {
        setFoodItems(foodItems.filter(item => item.id !== foodId));
    };

    const handleSaveChanges = () => {
        // Ensure all food items have the correct structure before saving
        const cleanedFoodItems = foodItems.map(item => ({
            id: item.id || Math.random().toString(36).substring(7),
            name: {
                text: item.name?.text || '',
                cuisine: item.name?.cuisine || '',
                known_for: item.name?.known_for || ''
            }
        }));
        onFoodUpdate(cleanedFoodItems);
    };

    const handleAddNewFood = async () => {
        if (!newFoodItem.text.trim()) return;

        try {
            const newFood: FoodItem = {
                id: Math.random().toString(36).substring(7),
                name: {
                    text: newFoodItem.text.trim(),
                    cuisine: newFoodItem.cuisine.trim(),
                    known_for: newFoodItem.known_for.trim(),
                },
            };

            setFoodItems([...foodItems, newFood]);
            setNewFoodItem({ text: '', cuisine: '', known_for: '' });
            setShowAddNew(false);
        } catch (error) {
            console.error('Error adding new food item:', error);
        }
    };

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
                    <div className="flex items-center justify-between p-4 bg-[#8B5CF6]/5 rounded-t-xl border-b border-[#8B5CF6]/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-[#8B5CF6]" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900">
                                    Food Options
                                </Dialog.Title>
                                <p className="text-sm text-gray-500">
                                    {date} · {destination}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-500 hover:bg-[#8B5CF6]/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Add New Food Form */}
                        {showAddNew ? (
                            <div className="bg-[#8B5CF6]/5 rounded-lg p-4 space-y-3">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Food Place Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter food place name"
                                            value={newFoodItem.text}
                                            onChange={(e) =>
                                                setNewFoodItem({ ...newFoodItem, text: e.target.value })
                                            }
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-none transition-shadow text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                                        <input
                                            type="text"
                                            placeholder="Enter cuisine type"
                                            value={newFoodItem.cuisine}
                                            onChange={(e) =>
                                                setNewFoodItem({ ...newFoodItem, cuisine: e.target.value })
                                            }
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-none transition-shadow text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Known For</label>
                                        <input
                                            type="text"
                                            placeholder="What's this place known for?"
                                            value={newFoodItem.known_for}
                                            onChange={(e) =>
                                                setNewFoodItem({ ...newFoodItem, known_for: e.target.value })
                                            }
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-none transition-shadow text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowAddNew(false)}
                                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNewFood}
                                        className="px-3 py-1.5 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors text-sm"
                                    >
                                        Add Food Place
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddNew(true)}
                                className="w-full p-3 border-2 border-dashed border-[#8B5CF6]/20 rounded-lg text-[#8B5CF6] hover:bg-[#8B5CF6]/5 hover:border-[#8B5CF6]/30 transition-all group"
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium">Add New Food Place</span>
                                </div>
                            </button>
                        )}

                        {/* Selected Food Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900">Selected Food Places</h3>
                                <span className="px-2.5 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-sm font-medium rounded-full">
                                    {foodItems.length} {foodItems.length === 1 ? 'place' : 'places'}
                                </span>
                            </div>
                            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                {foodItems.map((food) => (
                                    <div
                                        key={food.id}
                                        className="p-3 flex items-center justify-between hover:bg-gray-50 group transition-colors"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                                                <Utensils className="w-4 h-4 text-[#8B5CF6]" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{food.name.text}</p>
                                                <p className="text-xs text-gray-500">
                                                    {food.name.cuisine} · {food.name.known_for}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFood(food.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {foodItems.length === 0 && (
                                    <div className="p-6 text-center">
                                        <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/5 flex items-center justify-center mx-auto mb-3">
                                            <Utensils className="w-6 h-6 text-[#8B5CF6]/40" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No food places selected</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Add some delicious spots to your itinerary!</p>
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
                            className="px-4 py-1.5 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors text-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default FoodPopup; 