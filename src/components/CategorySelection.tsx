import React from 'react';
import { Umbrella, Mountain, Car, Compass, Eye, Building, Crown, Train, CookingPot as Hiking, Map, SkipBack as Ski } from 'lucide-react';

interface CategoryProps {
  icon: React.ReactNode;
  label: string;
}

const Category: React.FC<CategoryProps> = ({ icon, label }) => {
  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer">
      <div className="p-3 rounded-full bg-gray-100 hover:bg-gray-200">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-800">{label}</span>
    </div>
  );
};

const CategorySelection: React.FC = () => {
  const categories = [
    { icon: <Umbrella className="h-6 w-6" />, label: 'Beach' },
    { icon: <Map className="h-6 w-6" />, label: 'Countryside' },
    { icon: <Car className="h-6 w-6" />, label: 'Driving' },
    { icon: <Compass className="h-6 w-6" />, label: 'Adventure' },
    { icon: <Eye className="h-6 w-6" />, label: 'Views' },
    { icon: <Mountain className="h-6 w-6" />, label: 'Mountains' },
    { icon: <Building className="h-6 w-6" />, label: 'Villages' },
    { icon: <Crown className="h-6 w-6" />, label: 'Luxury' },
    { icon: <Train className="h-6 w-6" />, label: 'Train Travel' },
    { icon: <Hiking className="h-6 w-6" />, label: 'Hiking' },
    { icon: <Map className="h-6 w-6" />, label: 'Walking' },
    { icon: <Ski className="h-6 w-6" />, label: 'Skiing' },
  ];

  return (
    <div className="my-8">
      <div className="flex overflow-x-auto pb-4 space-x-8 scrollbar-hide">
        {categories.map((category, index) => (
          <Category key={index} icon={category.icon} label={category.label} />
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;