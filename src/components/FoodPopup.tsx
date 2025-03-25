import React, { useState, useEffect } from 'react';
import { X, Utensils, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';

interface FoodItem {
    name: string;
    description: string;
}

interface FoodPopupProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    destination: string;
    selectedFoodItems: string[];
    allDestinationFood: FoodItem[];
    onFoodUpdate: (foodItems: string[], descriptions: string[]) => void;
}

const FoodPopup: React.FC<FoodPopupProps> = ({
    isOpen,
    onClose,
    date,
    destination,
    selectedFoodItems,
    allDestinationFood,
    onFoodUpdate,
}) => {
    const [localFoodItems, setLocalFoodItems] = useState<string[]>([]);
    const [localDescriptions, setLocalDescriptions] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodDesc, setNewFoodDesc] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [localAllDestinationFood, setLocalAllDestinationFood] = useState<FoodItem[]>(allDestinationFood);

    // Initialize local state with selected food items when the popup opens
    useEffect(() => {
        if (isOpen) {
            console.log('Initializing food popup with:', {
                selectedFoodItems,
                allDestinationFood,
                localAllDestinationFood
            });

            // First update localAllDestinationFood
            setLocalAllDestinationFood(allDestinationFood);

            // Then use it to initialize descriptions
            const descriptions = selectedFoodItems.map(item => {
                const foodItem = allDestinationFood.find(f => f.name === item);
                const description = foodItem?.description || '';
                console.log('Mapping description for:', { item, description, foodItem });
                return description;
            });

            setLocalFoodItems(selectedFoodItems);
            setLocalDescriptions(descriptions);

            console.log('Setting initial state:', {
                items: selectedFoodItems,
                descriptions,
                allFood: allDestinationFood
            });
        }
    }, [isOpen, selectedFoodItems, allDestinationFood]);

    const handleFoodToggle = (foodName: string) => {
        // Use localAllDestinationFood instead of allDestinationFood
        const foodItem = localAllDestinationFood.find(f => f.name === foodName);
        console.log('Toggling food item:', { foodName, foodItem });

        if (localFoodItems.includes(foodName)) {
            // Remove item and its description
            const index = localFoodItems.indexOf(foodName);
            const updatedItems = localFoodItems.filter(f => f !== foodName);
            const updatedDescriptions = localDescriptions.filter((_, i) => i !== index);

            setLocalFoodItems(updatedItems);
            setLocalDescriptions(updatedDescriptions);

            console.log('Removed food item:', {
                updatedItems,
                updatedDescriptions
            });
        } else {
            // Add item and its description
            const newDescription = foodItem?.description || '';
            const updatedItems = [...localFoodItems, foodName];
            const updatedDescriptions = [...localDescriptions, newDescription];

            setLocalFoodItems(updatedItems);
            setLocalDescriptions(updatedDescriptions);

            console.log('Added food item:', {
                foodName,
                description: newDescription,
                updatedItems,
                updatedDescriptions
            });
        }
    };

    const handleSelectAll = () => {
        const allItems = localAllDestinationFood.map(f => f.name);
        const allDescriptions = localAllDestinationFood.map(f => f.description || '');

        console.log('Selecting all items:', { allItems, allDescriptions });

        setLocalFoodItems(allItems);
        setLocalDescriptions(allDescriptions);
    };

    const handleDeselectAll = () => {
        setLocalFoodItems([]);
        setLocalDescriptions([]);
    };

    const handleStartEdit = (foodName: string) => {
        setIsEditing(foodName);
        const foodItem = localAllDestinationFood.find(f => f.name === foodName);
        if (foodItem) {
            setNewFoodName(foodItem.name);
            setNewFoodDesc(foodItem.description);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setNewFoodName('');
        setNewFoodDesc('');
    };

    const handleSaveEdit = () => {
        if (!isEditing || !newFoodName.trim()) return;

        // Find the index of the item being edited
        const editIndex = localFoodItems.indexOf(isEditing);

        // Create updated food item
        const updatedItem: FoodItem = {
            name: newFoodName.trim(),
            description: newFoodDesc.trim()
        };

        // Update localAllDestinationFood
        const updatedAllFood = [...localAllDestinationFood];
        const allFoodIndex = updatedAllFood.findIndex(f => f.name === isEditing);
        if (allFoodIndex !== -1) {
            updatedAllFood[allFoodIndex] = updatedItem;
        } else {
            updatedAllFood.push(updatedItem);
        }
        setLocalAllDestinationFood(updatedAllFood);

        // Create new arrays with the edited item
        const updatedItems = [...localFoodItems];
        const updatedDescriptions = [...localDescriptions];

        if (editIndex !== -1) {
            // Update existing item
            updatedItems[editIndex] = updatedItem.name;
            updatedDescriptions[editIndex] = updatedItem.description;
        }

        // Update state
        setLocalFoodItems(updatedItems);
        setLocalDescriptions(updatedDescriptions);

        // Reset edit state
        setIsEditing(null);
        setNewFoodName('');
        setNewFoodDesc('');

        console.log('Saved edit:', {
            updatedItem,
            items: updatedItems,
            descriptions: updatedDescriptions,
            allFood: updatedAllFood
        });
    };

    const handleAddNew = () => {
        if (!newFoodName.trim()) return;

        // Create new food item
        const newItem: FoodItem = {
            name: newFoodName.trim(),
            description: newFoodDesc.trim()
        };

        // Add to local all destination food
        setLocalAllDestinationFood([...localAllDestinationFood, newItem]);

        // Add new item and description to the arrays
        const updatedItems = [...localFoodItems, newItem.name];
        const updatedDescriptions = [...localDescriptions, newItem.description];

        // Update state
        setLocalFoodItems(updatedItems);
        setLocalDescriptions(updatedDescriptions);

        // Reset form
        setShowAddForm(false);
        setNewFoodName('');
        setNewFoodDesc('');

        console.log('Added new food:', {
            newItem,
            items: updatedItems,
            descriptions: updatedDescriptions,
            allFood: [...localAllDestinationFood, newItem]
        });
    };

    const handleClose = () => {
        // Debug log before updating
        console.log('Closing popup with:', {
            items: localFoodItems,
            descriptions: localDescriptions,
            allFood: localAllDestinationFood
        });

        onFoodUpdate(localFoodItems, localDescriptions);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00B8A9]/10 flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-[#00B8A9]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-[600] font-['Poppins',sans-serif] text-[#1E293B]">
                                {cleanDestination(destination)}
                            </h2>
                            <p className="text-sm text-gray-500">{date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="px-3 py-1.5 text-sm font-medium text-[#00B8A9] hover:bg-[#00B8A9]/10 rounded-lg transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleDeselectAll}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Deselect All
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-3 py-1.5 text-sm font-medium text-[#00B8A9] hover:bg-[#00B8A9]/10 rounded-lg transition-colors"
                        >
                            Add New
                        </button>
                        <button
                            onClick={handleClose}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {showAddForm && (
                        <div className="mb-6 p-4 border border-[#00B8A9] rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Add New Food Item</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newFoodName}
                                        onChange={(e) => setNewFoodName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Enter food name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newFoodDesc}
                                        onChange={(e) => setNewFoodDesc(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Enter description"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNew}
                                        className="px-4 py-2 bg-[#00B8A9] text-white rounded-md hover:bg-[#00a598]"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {allDestinationFood.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Utensils className="h-12 w-12 mb-4" />
                            <p className="text-lg font-medium">No food spots available</p>
                            <p className="text-sm">Add food spots in the destination tab first</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {localAllDestinationFood.map((food) => (
                                <div
                                    key={food.name}
                                    className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${localFoodItems.includes(food.name)
                                        ? 'border-[#00B8A9] bg-[#00B8A9]/5'
                                        : 'border-gray-200 hover:border-[#00B8A9]'
                                        }`}
                                >
                                    {isEditing === food.name ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={newFoodName}
                                                    onChange={(e) => setNewFoodName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={newFoodDesc}
                                                    onChange={(e) => setNewFoodDesc(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-4 py-2 bg-[#00B8A9] text-white rounded-md hover:bg-[#00a598]"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleFoodToggle(food.name)}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <Utensils className={`h-5 w-5 ${localFoodItems.includes(food.name) ? 'text-[#00B8A9]' : 'text-gray-400'
                                                            }`} />
                                                        <span className="font-['Inter_var'] font-[600] text-[#1E293B]">
                                                            {food.name}
                                                        </span>
                                                    </button>
                                                </div>
                                                {food.description && (
                                                    <p className="ml-8 text-sm text-gray-500">
                                                        {food.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleStartEdit(food.name)}
                                                    className="p-1 text-gray-400 hover:text-[#00B8A9] rounded-full hover:bg-[#00B8A9]/10"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleFoodToggle(food.name)}
                                                    className="p-1 text-gray-400 hover:text-[#00B8A9] rounded-full hover:bg-[#00B8A9]/10"
                                                >
                                                    {localFoodItems.includes(food.name) ? (
                                                        <Check className="h-4 w-4 text-[#00B8A9]" />
                                                    ) : (
                                                        <Plus className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodPopup; 