import React from 'react';
import { Heart, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LikesService } from '../services/likes.service';

interface ItineraryTileProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  cities?: string[];
  likes?: number;
  createdAt?: string;
  loading?: 'lazy' | 'eager';
  showLike?: boolean;
  startDate?: string;
  endDate?: string;
  country?: string;
}

const ItineraryTile: React.FC<ItineraryTileProps> = ({
  id,
  title,
  description,
  imageUrl,
  duration = 7,
  cities = [],
  likes = 0,
  createdAt = "Recently",
  loading = 'eager',
  showLike = true,
  startDate,
  endDate,
  country
}) => {
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(likes);
  const [isLoading, setIsLoading] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkLikeStatus = async () => {
      if (!isAuthenticated) return;
      const { isLiked } = await LikesService.checkIfLiked(id);
      setIsLiked(isLiked);
    };
    checkLikeStatus();
  }, [id, isAuthenticated]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        await LikesService.unlikeItinerary(id);
        setLikesCount(prev => prev - 1);
      } else {
        await LikesService.likeItinerary(id);
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    navigate(`/viewmyitinerary/${id}`);
  };

  // Get a pastel color based on the city name for consistent color assignment
  const getCityColor = (city: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-teal-100 text-teal-700'
    ];

    // Simple hash function to determine color index
    const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format date for display
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}, ${date.getFullYear()}`;
  };

  return (
    <div
      className="flex-shrink-0 w-full cursor-pointer group border border-gray-200 rounded-xl overflow-hidden"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          loading={loading}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay gradient for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Journey dates with white background near bottom */}
        {startDate && endDate && (
          <div className="absolute bottom-8 left-3 bg-white text-gray-800 py-1 px-3 rounded-md font-medium text-xs shadow-sm flex items-center">
            <Calendar className="inline-block w-3 h-3 mr-1" />
            <span className="whitespace-nowrap">
              {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
            </span>
          </div>
        )}

        {/* Country name at the bottom */}
        {country && (
          <div className="absolute bottom-3 left-3 text-white text-xs font-medium">
            {country}
          </div>
        )}

        {showLike && (
          <button
            className={`absolute top-2 right-2 p-2 rounded-full 
              ${isLiked ? 'bg-rose-500 text-white' : 'bg-white text-gray-500'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              hover:scale-110 transition-all duration-200
            `}
            onClick={handleLikeClick}
            disabled={isLoading}
          >
            <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{duration.toString()} Days</span>
        </div>

        {cities.length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-medium text-gray-700 mb-1">Highlights</h4>
            <div className="flex flex-wrap gap-1 overflow-hidden h-6">
              {cities.slice(0, 3).map((city, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded-md text-xs ${getCityColor(city)}`}
                >
                  {city}
                </span>
              ))}
              {cities.length > 3 && (
                <span className="text-xs text-gray-500">+{cities.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryTile;