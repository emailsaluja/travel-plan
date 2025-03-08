import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Users, MapPin } from 'lucide-react';
import { UserItineraryView, UserItineraryViewService } from '../services/user-itinerary-view.service';
import UserItineraryMap from '../components/UserItineraryMap';
import UserDayByDayView from '../components/UserDayByDayView';

const ViewUserItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayByDay'>('overview');

  useEffect(() => {
    const loadItinerary = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await UserItineraryViewService.getItineraryById(id);
        if (error) throw error;
        setItinerary(data);
      } catch (error) {
        console.error('Error loading itinerary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Itinerary not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {itinerary.trip_name}
          </h1>
          <div className="flex flex-wrap gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{itinerary.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(itinerary.start_date)} • {itinerary.duration} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{itinerary.passengers} travelers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('dayByDay')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'dayByDay'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Day by Day
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Destinations */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Destinations</h2>
              <div className="space-y-6">
                {itinerary.destinations.map((dest, index) => (
                  <div key={index} className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">{dest.destination}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nights</p>
                        <p>{dest.nights}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Accommodation</p>
                        <p>{dest.sleeping || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-500">Activities</p>
                        <p>{dest.discover || 'Not specified'}</p>
                      </div>
                      {dest.transport && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Transport</p>
                          <p>{dest.transport}</p>
                        </div>
                      )}
                      {dest.notes && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Notes</p>
                          <p>{dest.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="lg:col-span-1">
              <UserItineraryMap 
                destinations={itinerary.destinations.map(d => ({
                  destination: d.destination,
                  nights: d.nights
                }))}
              />
            </div>
          </div>
        ) : (
          <UserDayByDayView
            startDate={itinerary.start_date}
            destinations={itinerary.destinations}
            dayAttractions={itinerary.day_attractions}
          />
        )}
      </div>
    </div>
  );
};

export default ViewUserItinerary; 