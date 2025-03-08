import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Navigation, Bed, Car, StickyNote, Share2, Heart, ArrowLeft, Edit, Train, ArrowRight } from 'lucide-react';
import { UserItineraryView, UserItineraryViewService } from '../services/user-itinerary-view.service';
import { GoogleMapsService, DistanceInfo } from '../services/google-maps.service';
import UserItineraryMap from '../components/UserItineraryMap';
import UserDayByDayView from '../components/UserDayByDayView';
import countryImages from '../data/country-images.json';

interface CountryImages {
  [key: string]: string[];
  Japan: string[];
  "South Korea": string[];
  Thailand: string[];
  Vietnam: string[];
  Singapore: string[];
  Indonesia: string[];
  Malaysia: string[];
  Philippines: string[];
  China: string[];
  Taiwan: string[];
  India: string[];
  default: string[];
}

const ViewUserItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayByDay'>('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<(DistanceInfo | null)[]>([]);

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

  useEffect(() => {
    const fetchDistanceInfo = async () => {
      if (!itinerary || itinerary.destinations.length <= 1) return;

      const distances = [];
      for (let i = 0; i < itinerary.destinations.length - 1; i++) {
        const origin = itinerary.destinations[i].destination;
        const destination = itinerary.destinations[i + 1].destination;
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

  // Get a random image URL for the country
  const getCountryImage = (country: string) => {
    const typedCountryImages = countryImages as unknown as CountryImages;
    const images = typedCountryImages[country] || typedCountryImages.default;
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  };

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

  const handleLike = () => {
    setIsLiked(!isLiked);
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
      <div className="relative h-[400px] mt-16">
        {/* Dynamic country image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-gray-800 transition-opacity duration-300"
          style={{
            backgroundImage: itinerary ? `url(${getCountryImage(itinerary.country)})` : undefined,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/50" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
            title="Share itinerary"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-colors shadow-lg ${
              isLiked ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <Link
            to={`/create-itinerary?id=${id}`}
            className="p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors shadow-lg"
            title="Edit itinerary"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>

        {/* Trip summary overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-white">
              {itinerary.trip_name}
            </h1>
            <div className="flex flex-wrap gap-6 text-white">
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
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Destinations */}
            <div className="w-full lg:w-2/5 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Destinations</h2>
                  <div className="space-y-6">
                    {itinerary.destinations.map((dest, index) => (
                      <div key={index} className="relative">
                        {/* Vertical line */}
                        {index < itinerary.destinations.length - 1 && (
                          <div className="absolute left-3.5 top-12 bottom-0 w-[2px] bg-rose-100" />
                        )}
                        
                        <div className="relative">
                          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white
                              ${index === 0 ? 'bg-rose-500' : 
                                index === itinerary.destinations.length - 1 ? 'bg-rose-500' : 
                                'bg-rose-500'}`}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-semibold">{dest.destination}</div>
                              <div className="text-sm text-gray-500">{dest.nights} days</div>
                            </div>
                          </h3>
                          
                          {dest.discover && (
                            <div className="text-sm text-gray-600 ml-9">
                              {dest.discover}
                            </div>
                          )}

                          {/* Distance info to next destination */}
                          {index < itinerary.destinations.length - 1 && distanceInfo[index] && (
                            <div className="mt-4 ml-9">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Train className="w-4 h-4" />
                                <ArrowRight className="w-4 h-4" />
                                <span>{itinerary.destinations[index + 1].destination}</span>
                                <span className="mx-2">•</span>
                                <span>{distanceInfo[index]?.duration}</span>
                                <span className="mx-2">•</span>
                                <span>{distanceInfo[index]?.distance}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="w-full lg:w-3/5">
              <div className="sticky top-8">
                <UserItineraryMap 
                  destinations={itinerary.destinations.map(d => ({
                    destination: d.destination,
                    nights: d.nights
                  }))}
                />
              </div>
            </div>
          </div>
        ) : (
          <UserDayByDayView
            startDate={itinerary.start_date}
            destinations={itinerary.destinations}
            dayAttractions={itinerary.day_attractions.map(da => {
              console.log('Raw day attraction data:', da);
              return {
                day_index: da.day_index,
                attractions: Array.isArray(da.attractions) ? da.attractions : []
              };
            })}
          />
        )}
      </div>
    </div>
  );
};

export default ViewUserItinerary; 