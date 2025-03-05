import React, { useEffect, useState } from 'react';
import { LikesService } from '../services/likes.service';
import ItineraryTile from '../components/ItineraryTile';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SavedItineraries: React.FC = () => {
  const [likedItineraries, setLikedItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const fetchLikedItineraries = async () => {
      try {
        const { data, error } = await LikesService.getLikedItineraries();
        if (error) {
          console.error('Error fetching liked itineraries:', error);
          return;
        }
        setLikedItineraries(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedItineraries();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Saved Itineraries</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Itineraries</h1>
      
      {likedItineraries.length === 0 ? (
        <div className="text-gray-500">
          You haven't saved any itineraries yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedItineraries.map((itinerary) => (
            <ItineraryTile
              key={itinerary.id}
              id={itinerary.id}
              title={itinerary.title}
              description={itinerary.description}
              imageUrl={itinerary.imageUrl}
              duration={itinerary.duration}
              cities={itinerary.cities}
              likes={itinerary.likes}
              createdAt={itinerary.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedItineraries; 