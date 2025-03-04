import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ItineraryTileProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  cities?: string[];
  likes?: number;
  createdAt?: string;
}

const ItineraryTile: React.FC<ItineraryTileProps> = ({ 
  id, 
  title, 
  description, 
  imageUrl,
  duration = 7,
  cities = [],
  likes = 0,
  createdAt = "Recently"
}) => {
  const [isLiked, setIsLiked] = React.useState(false);
  const navigate = useNavigate();

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleClick = () => {
    navigate(`/itinerary/${id}`);
  };

  return (
    <div 
      className="flex-shrink-0 w-72 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative rounded-xl overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          className={`absolute top-2 right-2 p-2 rounded-full ${isLiked ? 'bg-rose-500 text-white' : 'bg-white text-gray-500'}`}
          onClick={toggleLike}
        >
          <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      <div className="mt-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{duration.toString()} days - {cities.join(', ')}</p>
        <div className="mt-1 flex items-center">
          <div className="flex items-center">
            <Heart className="h-3 w-3 text-rose-500" fill="currentColor" />
            <span className="ml-1 text-xs text-gray-500">{likes}</span>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ItineraryTile;