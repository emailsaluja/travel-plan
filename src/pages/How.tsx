import React from 'react';
import { Search, Calendar, Map, Heart, Share2, PlusCircle } from 'lucide-react';

const How = () => {
  const features = [
    {
      icon: <Search className="w-8 h-8 text-rose-500" />,
      title: "Discover Destinations",
      description: "Search and explore curated travel destinations from around the world. Get inspired by popular itineraries and local recommendations."
    },
    {
      icon: <Calendar className="w-8 h-8 text-rose-500" />,
      title: "Plan Your Trip",
      description: "Create day-by-day itineraries with our intuitive planner. Add attractions, activities, and customize your schedule easily."
    },
    {
      icon: <Map className="w-8 h-8 text-rose-500" />,
      title: "Interactive Maps",
      description: "Visualize your journey with interactive maps. See your route, attractions, and get a better sense of your travel logistics."
    },
    {
      icon: <Heart className="w-8 h-8 text-rose-500" />,
      title: "Save Favorites",
      description: "Like and save itineraries that inspire you. Build a collection of travel plans for future reference."
    },
    {
      icon: <Share2 className="w-8 h-8 text-rose-500" />,
      title: "Share & Collaborate",
      description: "Share your itineraries with friends and family. Collaborate on trip planning and make memories together."
    },
    {
      icon: <PlusCircle className="w-8 h-8 text-rose-500" />,
      title: "Create Custom Plans",
      description: "Build your own unique itineraries from scratch. Add personal touches and make your trip truly yours."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-rose-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              How TravelPlanner Works
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Your all-in-one platform for creating, discovering, and sharing travel experiences
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-rose-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Ready to Start Planning?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Create your first itinerary or explore popular destinations
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                className="px-6 py-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                onClick={() => window.location.href = '/create-itinerary'}
              >
                Create Itinerary
              </button>
              <button 
                className="px-6 py-3 bg-white text-rose-500 rounded-full border border-rose-500 hover:bg-rose-50 transition-colors"
                onClick={() => window.location.href = '/'}
              >
                Explore Destinations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default How; 