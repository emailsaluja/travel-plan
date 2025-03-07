import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { LikesService } from '../services/likes.service';
import { Itinerary } from '../types';
import ItineraryTile from '../components/ItineraryTile';
import LikeButton from '../components/LikeButton';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [likedItineraries, setLikedItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user data
        const { user } = await AuthService.getCurrentUser();
        setUser(user as User);

        // Get liked itineraries
        const { data: itineraries } = await LikesService.getLikedItineraries();
        if (itineraries) {
          setLikedItineraries(itineraries as unknown as Itinerary[]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user && (
        <p className="mb-6">Welcome, {user.user_metadata?.full_name || user.email}</p>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Your Liked Itineraries</h2>
        {likedItineraries.length === 0 ? (
          <p className="text-gray-500">You haven't liked any itineraries yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedItineraries.map((itinerary) => (
              <div key={itinerary.id} className="relative">
                <ItineraryTile
                  id={itinerary.id}
                  title={itinerary.title}
                  description={itinerary.description}
                  imageUrl={itinerary.imageUrl}
                  duration={itinerary.duration}
                  cities={itinerary.cities}
                  likes={itinerary.likes}
                  createdAt={itinerary.createdAt}
                />
                <div className="absolute bottom-4 right-4">
                  <LikeButton 
                    itineraryId={itinerary.id} 
                    initialLikesCount={itinerary.likes}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard; 