import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ItineraryTile from '../components/ItineraryTile';
import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';

const MyItineraries: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const fetchMyItineraries = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data, error } = await supabase
          .from('itineraries')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching itineraries:', error);
          return;
        }

        setItineraries(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyItineraries();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Itineraries</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Itineraries</h1>
        <button
          onClick={() => navigate('/create-itinerary')}
          className="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 transition-colors"
        >
          Create New Itinerary
        </button>
      </div>

      {itineraries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any itineraries yet.</p>
          <button
            onClick={() => navigate('/create-itinerary')}
            className="text-rose-500 hover:text-rose-600"
          >
            Create your first itinerary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {itineraries.map((itinerary) => (
            <ItineraryTile
              key={itinerary.id}
              id={itinerary.id}
              title={itinerary.title}
              description={itinerary.description}
              imageUrl={itinerary.imageUrl}
              duration={itinerary.duration}
              cities={itinerary.cities}
              likes={itinerary.likes}
              createdAt={itinerary.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItineraries; 