import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { LikesService } from '../services/likes.service';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LikeButtonProps {
  itineraryId: string;
  initialLikesCount?: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({ itineraryId, initialLikesCount = 0 }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!isAuthenticated) return;
      
      console.log('Checking like status for itinerary:', itineraryId);
      const { isLiked, error } = await LikesService.checkIfLiked(itineraryId);
      if (error) {
        console.error('Error checking like status:', error);
        return;
      }
      setIsLiked(isLiked);
    };

    const getLikesCount = async () => {
      console.log('Getting likes count for itinerary:', itineraryId);
      const { count, error } = await LikesService.getLikesCount(itineraryId);
      if (error) {
        console.error('Error getting likes count:', error);
        return;
      }
      setLikesCount(count);
    };

    checkLikeStatus();
    getLikesCount();
  }, [itineraryId, isAuthenticated]);

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to signin');
      navigate('/signin');
      return;
    }

    console.log('Like button clicked for itinerary:', itineraryId);
    console.log('Current like status:', isLiked);
    
    setIsLoading(true);
    try {
      if (isLiked) {
        console.log('Attempting to unlike itinerary:', itineraryId);
        const result = await LikesService.unlikeItinerary(itineraryId);
        console.log('Unlike result:', result);
        if (result.error) {
          console.error('Error unliking:', result.error);
          return;
        }
        setLikesCount(prev => prev - 1);
      } else {
        console.log('Attempting to like itinerary:', itineraryId);
        const result = await LikesService.likeItinerary(itineraryId);
        console.log('Like result:', result);
        if (result.error) {
          console.error('Error liking:', result.error);
          return;
        }
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeClick}
      disabled={isLoading}
      className={`flex items-center space-x-1 p-2 rounded-full 
        ${isLiked ? 'text-rose-500' : 'text-gray-500'}
        hover:bg-gray-100 transition-colors
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
      <span className="text-sm">{likesCount}</span>
    </button>
  );
};

export default LikeButton; 