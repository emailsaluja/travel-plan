import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, MapPin } from 'lucide-react';
import { UserItineraryService } from '../services/user-itinerary.service';

interface Itinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  destinations: {
    destination: string;
    nights: number;
  }[];
}

const MyItineraries: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      const { data: itineraries } = await UserItineraryService.getUserItineraries();
      setItineraries(itineraries || []);
    } catch (error) {
      console.error('Error loading itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Itineraries</h1>
        <Link
          to="/create-itinerary"
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Itinerary
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : itineraries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any itineraries yet.</p>
          <Link
            to="/create-itinerary"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Itinerary
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <div
              key={itinerary.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {itinerary.trip_name}
                </h3>
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{itinerary.country}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(itinerary.start_date)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{itinerary.duration} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{itinerary.passengers} travelers</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Destinations:</h4>
                  <div className="space-y-1">
                    {itinerary.destinations?.map((dest, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{dest.destination}</span>
                        <span className="text-gray-500">{dest.nights} nights</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 rounded-b-lg border-t">
                <Link
                  to={`/create-itinerary?id=${itinerary.id}`}
                  className="text-rose-500 hover:text-rose-600 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItineraries; 