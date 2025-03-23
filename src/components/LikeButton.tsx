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
    const loadLikeStatus = async () => {
      const { isLiked, count, error } = await LikesService.getLikeStatusAndCount(itineraryId);
      if (error) {
        console.error('Error loading like status:', error);
        return;
      }
      setIsLiked(isLiked);
      setLikesCount(count);
    };

    loadLikeStatus();
  }, [itineraryId, isAuthenticated]);

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        const result = await LikesService.unlikeItinerary(itineraryId);
        if (result.error) {
          console.error('Error unliking:', result.error);
          return;
        }
        setLikesCount(prev => prev - 1);
      } else {
        const result = await LikesService.likeItinerary(itineraryId);
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