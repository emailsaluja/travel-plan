import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Heart, Share, Star, MapPin, Train, Bus, Plane, Ship, Utensils,
  Camera, Coffee, Building, Mountain, Sunrise, ShoppingBag, Ticket,
  LandmarkIcon, Trees, Church, Waves, Navigation, Palmtree, 
  CircleUserRound, Umbrella
} from 'lucide-react';
import ItineraryMap from '../components/ItineraryMap';
import { getItineraryById, Itinerary } from '../data/itineraries';

export const ItineraryDetails: React.FC = () => {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayByDay'>('overview');

  useEffect(() => {
    async function loadItinerary() {
      if (id) {
        setLoading(true);
        const data = await getItineraryById(id);
        setItinerary(data);
        setLoading(false);
      }
    }

    loadItinerary();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!itinerary) {
    return <div>Itinerary not found</div>;
  }

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'train': return <Train className="h-5 w-5" />;
      case 'bus': return <Bus className="h-5 w-5" />;
      case 'plane': return <Plane className="h-5 w-5" />;
      case 'ferry': return <Ship className="h-5 w-5" />;
      default: return null;
    }
  };

  const getActivityIcon = (activity: string) => {
    const activityLower = activity.toLowerCase();
    
    // Mountains and Nature
    if (activityLower.includes('mount') || activityLower.includes('mt.')) {
      return <Mountain className="h-4 w-4" />;
    }
    if (activityLower.includes('hike') || activityLower.includes('trail')) {
      return <Mountain className="h-4 w-4" />;
    }

    // Beaches and Islands
    if (activityLower.includes('beach') || activityLower.includes('coast')) {
      return <Umbrella className="h-4 w-4" />;
    }
    if (activityLower.includes('island')) {
      return <Palmtree className="h-4 w-4" />;
    }

    // Monuments and Landmarks
    if (activityLower.includes('monument') || activityLower.includes('memorial') || 
        activityLower.includes('statue') || activityLower.includes('dome')) {
      return <LandmarkIcon className="h-4 w-4" />;
    }

    // Existing conditions...
    if (activityLower.includes('temple') || activityLower.includes('shrine')) {
      return <Church className="h-4 w-4" />;
    }
    if (activityLower.includes('castle') || activityLower.includes('palace')) {
      return <LandmarkIcon className="h-4 w-4" />;
    }
    if (activityLower.includes('museum')) {
      return <Building className="h-4 w-4" />;
    }
    if (activityLower.includes('shopping') || activityLower.includes('market')) {
      return <ShoppingBag className="h-4 w-4" />;
    }
    if (activityLower.includes('park') || activityLower.includes('garden') || activityLower.includes('grove')) {
      return <Trees className="h-4 w-4" />;
    }
    if (activityLower.includes('cruise') || activityLower.includes('lake')) {
      return <Waves className="h-4 w-4" />;
    }
    if (activityLower.includes('check') || activityLower.includes('hotel')) {
      return <Building className="h-4 w-4" />;
    }
    if (activityLower.includes('morning') || activityLower.includes('sunrise')) {
      return <Sunrise className="h-4 w-4" />;
    }
    if (activityLower.includes('tour') || activityLower.includes('explore')) {
      return <Navigation className="h-4 w-4" />;
    }
    if (activityLower.includes('photo') || activityLower.includes('view')) {
      return <Camera className="h-4 w-4" />;
    }
    if (activityLower.includes('tea') || activityLower.includes('café')) {
      return <Coffee className="h-4 w-4" />;
    }
    if (activityLower.includes('ticket') || activityLower.includes('studio')) {
      return <Ticket className="h-4 w-4" />;
    }
    
    // Default icon for other activities
    return <Navigation className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-[70vh] w-full overflow-hidden">
          <img 
            src={itinerary.imageUrl} 
            alt={itinerary.title}
            className="w-full h-full object-cover"
          />
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold text-white mb-2">
                {itinerary.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Overlay Navigation */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => window.history.back()}
              className="rounded-full p-3 bg-white hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current">
                <path d="M20 28l-11.29289322-11.2928932c-.39052429-.3905243-.39052429-1.0236893 0-1.4142136l11.29289322-11.2928932"></path>
              </svg>
            </button>
            <div className="flex gap-3">
              <button className="rounded-full p-3 bg-white hover:bg-gray-100 transition-colors">
                <Share className="h-4 w-4" />
              </button>
              <button className="rounded-full p-3 bg-white hover:bg-gray-100 transition-colors">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="border-b border-gray-200 pb-6">
            {/* Remove title from here and only show creator section */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-current text-[#FF385C]" />
                <span className="font-semibold">{itinerary.rating}</span>
                <span className="text-gray-600">·</span>
                <span className="underline font-semibold">
                  {itinerary.reviews} reviews
                </span>
                <span className="text-gray-600">·</span>
                <span className="font-semibold">{itinerary.country}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1548535537-3cfaf1fc327c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80" 
                    alt="Travel Expert Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-semibold">Created by {itinerary.host}</h2>
                  <p className="text-sm text-gray-500">Travel Expert since 2020</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            {/* Trip Details Box */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Trip Details</h3>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-gray-600">{itinerary.duration} days</p>
                  </div>
                  <div>
                    <p className="font-medium">Cities</p>
                    <p className="text-gray-600">{itinerary.cities.length} destinations</p>
                  </div>
                  <div>
                    <p className="font-medium">Best Season</p>
                    <p className="text-gray-600">Spring/Fall</p>
                  </div>
                </div>

                {/* Extended Trip Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Best Time to Visit</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>🌸 Spring: March - May</p>
                      <p>🍁 Fall: September - November</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Perfect for cherry blossoms (Spring) and autumn colors (Fall)
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Famous For</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>⛩️ Historic Temples & Shrines</p>
                      <p>🗼 Modern Architecture</p>
                      <p>🍜 World-class Cuisine</p>
                      <p>🚅 Efficient Transportation</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Currency</h4>
                    <div className="space-y-1">
                      <p className="text-gray-600">Japanese Yen (¥/JPY)</p>
                      <p className="text-sm text-gray-500">
                        1 USD ≈ 145 JPY
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        *Exchange rates may vary
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Best Airports</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>✈️ Tokyo Narita (NRT)</p>
                      <p>✈️ Tokyo Haneda (HND)</p>
                      <p>✈️ Osaka Kansai (KIX)</p>
                      <p className="text-sm text-gray-500 mt-1">
                        All with excellent public transport connections
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Section */}
          <div className="py-8">
            <h2 className="text-2xl font-semibold mb-6">Your {itinerary.duration}-day journey</h2>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 font-medium text-sm transition-colors relative
                    ${activeTab === 'overview' 
                      ? 'text-airbnb border-b-2 border-airbnb' 
                      : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('dayByDay')}
                  className={`pb-4 font-medium text-sm transition-colors relative
                    ${activeTab === 'dayByDay' 
                      ? 'text-airbnb border-b-2 border-airbnb' 
                      : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Day-by-Day Plan
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
              // Overview Tab Content
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Itinerary Details Column - 30% */}
                <div className="lg:col-span-4 space-y-6">
                  {itinerary.destinations?.map((destination, index) => (
                    <React.Fragment key={`${destination.city}-${index}`}>
                      <div className="border-l-4 border-airbnb pl-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-airbnb" />
                          <h3 className="text-lg font-semibold">
                            {destination.city}
                            <span className="text-gray-500 text-base font-normal ml-2">
                              {destination.days} days
                            </span>
                          </h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {destination.highlights[0]}
                          {destination.highlights.length > 1 && 
                            ` and ${destination.highlights.length - 1} more activities`}
                        </p>
                      </div>

                      {/* Transport information - More compact version */}
                      {destination.transportToNext && index < (itinerary.destinations?.length ?? 0) - 1 && (
                        <div className="ml-4 my-2 flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            {getTransportIcon(destination.transportToNext.type)}
                            <span>→</span>
                            <span className="font-medium text-gray-700">
                              {itinerary.destinations?.[index + 1].city}
                            </span>
                          </div>
                          <span className="text-gray-400">·</span>
                          <span>{destination.transportToNext.duration}</span>
                          <span className="text-gray-400">·</span>
                          <span>{destination.transportToNext.distance}</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Map Column - 70% */}
                <div className="lg:col-span-8 relative h-[600px] rounded-xl overflow-hidden shadow-lg lg:sticky lg:top-8">
                  <ItineraryMap locations={itinerary.destinations || []} />
                </div>
              </div>
            ) : (
              // Day-by-Day Tab Content
              <div className="space-y-8">
                {itinerary.dayByDay?.map((day, index) => (
                  <div key={`day-${day.day}-${index}`} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    {/* Day Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Day {day.day}</h3>
                          <p className="text-gray-600 text-sm">{day.title}</p>
                        </div>
                        <span className="bg-airbnb text-white text-sm px-3 py-1 rounded-full">
                          {itinerary.destinations?.find((d, idx) => 
                            day.title.includes(d.city))?.city || 'Travel Day'}
                        </span>
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="p-6">
                      {/* Activities */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Today's Activities</h4>
                        <ul className="space-y-3">
                          {day.activities.map((activity, index) => (
                            <li 
                              key={index} 
                              className="flex items-start gap-3 text-gray-600"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-airbnb/10 text-airbnb rounded-full flex items-center justify-center">
                                {getActivityIcon(activity)}
                              </span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dinner Suggestion - Updated with icon */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Utensils className="h-5 w-5 text-airbnb" />
                          <div className="flex justify-between items-start w-full">
                            <h5 className="font-medium text-gray-900">
                              {day.dinnerSuggestion.name}
                            </h5>
                            <span className="text-sm text-gray-500">
                              {day.dinnerSuggestion.cuisine}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-7">
                          {day.dinnerSuggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 