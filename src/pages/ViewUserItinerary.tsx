import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Navigation, Bed, Car, StickyNote, Share2, Heart, ArrowLeft, Edit, Train, ArrowRight, Camera, Plane } from 'lucide-react';
import { UserItineraryView, UserItineraryViewService } from '../services/user-itinerary-view.service';
import { UserItineraryService } from '../services/user-itinerary.service';
import { GoogleMapsService, DistanceInfo } from '../services/google-maps.service';
import UserItineraryMap from '../components/UserItineraryMap';
import UserDayByDayView from '../components/UserDayByDayView';
import { CountryImagesService } from '../services/country-images.service';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';

const ViewUserItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayByDay'>('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<(DistanceInfo | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countryImage, setCountryImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        const { data, error } = await UserItineraryViewService.getItineraryById(id!);

        if (error) {
          throw error;
        }

        if (!data) {
          setError('Itinerary not found');
          return;
        }

        // Check if user has permission to view the itinerary
        if (data.is_private) {
          const { data: itineraryData } = await supabase
            .from('user_itineraries')
            .select('user_id')
            .eq('id', id!)
            .single();

          if (!isAuthenticated || itineraryData?.user_id !== user?.id) {
            setError('You do not have permission to view this itinerary');
            return;
          }
        }

        setItinerary(data);
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItinerary();
    }
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    const fetchDistanceInfo = async () => {
      if (!itinerary || itinerary.destinations.length <= 1) return;

      const distances = [];
      for (let i = 0; i < itinerary.destinations.length - 1; i++) {
        const origin = cleanDestination(itinerary.destinations[i].destination);
        const destination = cleanDestination(itinerary.destinations[i + 1].destination);
        try {
          const info = await GoogleMapsService.getDistanceAndDuration(origin, destination);
          distances.push(info);
        } catch (error) {
          console.error('Error fetching distance info:', error);
          distances.push(null);
        }
      }
      setDistanceInfo(distances);
    };

    fetchDistanceInfo();
  }, [itinerary]);

  useEffect(() => {
    const loadCountryImage = async () => {
      if (itinerary?.country) {
        const imageUrl = await CountryImagesService.getCountryImage(itinerary.country);
        setCountryImage(imageUrl);
      }
    };

    loadCountryImage();
  }, [itinerary?.country]);

  useEffect(() => {
    const checkIfLiked = async () => {
      if (!id || !isAuthenticated) return;
      try {
        const { liked } = await UserItineraryService.isItineraryLiked(id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking if itinerary is liked:', error);
      }
    };

    checkIfLiked();
  }, [id, isAuthenticated]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: itinerary?.trip_name,
        text: `Check out this ${itinerary?.duration}-day trip to ${itinerary?.country}!`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    try {
      const { liked } = await UserItineraryService.toggleLikeItinerary(id!);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <div className="relative h-[500px]">
        {/* Dynamic country image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
          style={{
            backgroundImage: countryImage ? `url(${countryImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        >
          {/* Add a loading state */}
          {!countryImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
            title="Share itinerary"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleLike}
            className={`p-2.5 backdrop-blur-sm rounded-full transition-colors shadow-lg ${isLiked
              ? 'bg-[#00C48C] text-white hover:bg-[#00B380]'
              : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
            title={isLiked ? 'Unlike itinerary' : 'Like itinerary'}
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-white">
              {itinerary.trip_name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-[#00C48C]/20 text-[#00C48C] rounded-full text-xs font-medium">
                {itinerary.duration} days
              </span>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                {itinerary.passengers} travelers
              </span>
            </div>
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{itinerary.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(itinerary.start_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-[1400px] mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-base ${activeTab === 'overview'
                ? 'border-[#00C48C] text-[#00C48C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Destinations
            </button>
            <button
              onClick={() => setActiveTab('dayByDay')}
              className={`py-4 px-1 border-b-2 font-medium text-base ${activeTab === 'dayByDay'
                ? 'border-[#00C48C] text-[#00C48C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Day by Day
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : !itinerary ? (
          <div>No itinerary found</div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Destinations */}
                <div className="w-full lg:w-1/3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6">
                      <div className="space-y-6">
                        {itinerary.destinations.map((dest, index) => (
                          <React.Fragment key={index}>
                            {/* Destination */}
                            <div className="relative">
                              <h3 className="text-lg font-medium mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white bg-[#00C48C]">
                                  {index + 1}
                                </span>
                                <div>
                                  <div className="font-semibold text-[#1e293b] flex justify-between items-center">
                                    <span>{cleanDestination(dest.destination)}</span>
                                    <span className="text-[#ea5681] text-xs">{dest.nights} days</span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatDate(new Date(new Date(itinerary.start_date).getTime() + index * 24 * 60 * 60 * 1000).toISOString())} -
                                    {formatDate(new Date(new Date(itinerary.start_date).getTime() + (index + dest.nights - 1) * 24 * 60 * 60 * 1000).toISOString())}
                                  </div>
                                </div>
                              </h3>

                              {dest.discover && (
                                <div className="text-sm text-gray-600 ml-10">
                                  {dest.discover}
                                </div>
                              )}
                            </div>

                            {/* Transport and Distance to next destination */}
                            {index < itinerary.destinations.length - 1 && (
                              <div className="ml-10 py-4 border-l-2 border-[#00C48C]/20 pl-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Train className="w-5 h-5 text-[#ea5681]" />
                                  <ArrowRight className="w-5 h-5" />
                                  <span>To {cleanDestination(itinerary.destinations[index + 1].destination)}</span>
                                </div>
                                {distanceInfo[index] && (
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-5 h-5 text-[#ea5681]" />
                                    <span>{distanceInfo[index]?.duration}</span>
                                    <span className="mx-2">•</span>
                                    <span>{distanceInfo[index]?.distance}</span>
                                  </div>
                                )}
                                {dest.transport && (
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                    {dest.transport.toLowerCase().includes('flight') ? (
                                      <Plane className="w-5 h-5 text-[#ea5681]" />
                                    ) : (
                                      <Car className="w-5 h-5 text-[#ea5681]" />
                                    )}
                                    <span>Transport: {dest.transport}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Map */}
                <div className="w-full lg:w-2/3">
                  <div className="sticky top-8">
                    <div className="h-[700px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <UserItineraryMap
                        destinations={itinerary.destinations.map(d => ({
                          destination: cleanDestination(d.destination),
                          nights: d.nights
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Day by Day View */}
            {activeTab === 'dayByDay' && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Day by Day Content */}
                <div className="w-full lg:w-1/2">
                  <UserDayByDayView
                    startDate={itinerary.start_date}
                    destinations={itinerary.destinations}
                    dayAttractions={itinerary.day_attractions?.map(da => ({
                      dayIndex: da.day_index,
                      attractions: da.attractions
                    })) || []}
                    dayHotels={itinerary.day_hotels?.map(dh => ({
                      dayIndex: dh.day_index,
                      hotel: dh.hotel
                    })) || []}
                    dayNotes={itinerary.day_notes?.map(dn => ({
                      dayIndex: dn.day_index,
                      notes: dn.notes
                    })) || []}
                  />
                </div>

                {/* Right Column - Map */}
                <div className="w-full lg:w-1/2">
                  <div className="sticky top-8">
                    <div className="bg-white rounded-2xl border border-gray-100">
                      <div className="h-[800px] rounded-xl overflow-hidden">
                        <UserItineraryMap
                          destinations={itinerary.destinations.map(d => ({
                            destination: cleanDestination(d.destination),
                            nights: d.nights
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewUserItinerary; 