import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Navigation, Bed, Car, StickyNote, Share2, Heart, ArrowLeft, Edit, Train, ArrowRight, Camera, Plane } from 'lucide-react';
import { UserItineraryView, UserItineraryViewService } from '../services/user-itinerary-view.service';
import { UserItineraryService } from '../services/user-itinerary.service';
import ViewItineraryMap from '../components/ViewItineraryMap';
import UserDayByDayView from '../components/UserDayByDayView';
import { CountryImagesService } from '../services/country-images.service';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
import DestinationsList from '../components/DestinationsList';
import DOMPurify from 'dompurify';

const ViewUserItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayByDay'>('overview');
  const [isLiked, setIsLiked] = useState(false);
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

        console.log('Fetched itinerary data:', data);
        console.log('Trip description:', data.trip_description);
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[75vh]">
        {/* Dynamic country image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
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
          {!countryImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Back button */}
        <div className="absolute top-8 left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="group p-3 bg-white/95 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all shadow-lg hover:shadow-xl"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-4">
          <button
            onClick={handleShare}
            className="group p-3 bg-white/95 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all shadow-lg hover:shadow-xl"
            title="Share itinerary"
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={handleLike}
            className={`group p-3 backdrop-blur-sm rounded-full transition-all shadow-lg hover:shadow-xl ${isLiked
              ? 'bg-[#00C48C] text-white hover:bg-[#00B380]'
              : 'bg-white/95 text-gray-700 hover:bg-white'
              }`}
            title={isLiked ? 'Unlike itinerary' : 'Like itinerary'}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'group-hover:scale-110' : 'group-hover:scale-110'} transition-transform`} />
          </button>
        </div>

        {/* Trip Info */}
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-wrap gap-4 mb-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{itinerary.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">{formatDate(itinerary.start_date)}</span>
              </div>
            </div>
            <h1 className="text-5xl font-medium tracking-tight mb-6 text-white">
              {itinerary.trip_name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-[#00C48C] text-white rounded-full text-sm font-medium">
                {itinerary.duration} days
              </span>
              <span className="px-4 py-1.5 bg-white/95 text-gray-900 rounded-full text-sm font-medium">
                {itinerary.passengers} travelers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Description - Moved here, right after hero section */}
      {itinerary.trip_description && (
        <div className="bg-gray-50">
          <div className="max-w-[1400px] mx-auto px-8 py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">About This Trip</h2>
              <div
                className="prose prose-lg max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-a:text-[#00C48C] prose-strong:text-gray-900 prose-strong:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(itinerary.trip_description)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <nav className="flex space-x-12">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-5 px-1 border-b-2 font-medium text-base transition-colors ${activeTab === 'overview'
                ? 'border-[#00C48C] text-[#00C48C]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              Destinations
            </button>
            <button
              onClick={() => setActiveTab('dayByDay')}
              className={`py-5 px-1 border-b-2 font-medium text-base transition-colors ${activeTab === 'dayByDay'
                ? 'border-[#00C48C] text-[#00C48C]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              Day by Day
            </button>
          </nav>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-12">
            {/* Map Section */}
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]">
              <ViewItineraryMap
                destinations={itinerary.destinations.map(d => ({
                  destination: cleanDestination(d.destination),
                  nights: d.nights
                }))}
              />
            </div>

            {/* Destinations List */}
            <div>
              <DestinationsList
                destinations={itinerary.destinations.map(d => ({
                  ...d,
                  discover_descriptions: itinerary.discover_descriptions?.[d.destination] || {},
                  food_descriptions: itinerary.food_descriptions?.[d.destination] || {}
                }))}
                startDate={itinerary.start_date}
              />
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ViewUserItinerary; 