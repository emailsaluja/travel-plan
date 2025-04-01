import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Map, Heart, Share2, PlusCircle, Star, ArrowRight, Check, Users, Compass, X } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import HeroBanner from '../components/HeroBanner';
import CategorySelection from '../components/CategorySelection';
import ItinerarySection from '../components/ItinerarySection';
import FeatureIcons from '../components/FeatureIcons';

// Feature interfaces for different views
const planningInterface = {
  tags: [
    { icon: '🏠', label: 'Casa Mirabilia', color: '#00C48C' },
    { icon: '🎫', label: 'Train ticket', color: '#F43F5E' }
  ],
  destinations: [
    { name: 'Rome', dates: 'Fri 09 Jun - Sun 11 Jun', nights: 4 },
    { name: 'Venice', dates: 'Sun 11 Jun - Wed 14 Jun', nights: 3 },
    { name: 'Milano', dates: 'Wed 14 Jun - Sat 17 Jun', nights: 3 }
  ],
  activities: [
    { icon: '🍝', label: 'Tonnarello', color: '#7C3AED' },
    { icon: '🏛️', label: 'Colosseum', color: '#F59E0B' }
  ]
};

const groupInterface = {
  tags: [
    { icon: '👥', label: 'Group Chat', color: '#00C48C' },
    { icon: '📅', label: 'Poll', color: '#F43F5E' }
  ],
  destinations: [
    { name: 'Barcelona', dates: 'Mon 15 Jul - Fri 19 Jul', nights: 4 },
    { name: 'Madrid', dates: 'Fri 19 Jul - Tue 23 Jul', nights: 4 }
  ],
  activities: [
    { icon: '🎭', label: 'Flamenco Show', color: '#7C3AED' },
    { icon: '🏟️', label: 'Camp Nou', color: '#F59E0B' }
  ]
};

const sharingInterface = {
  tags: [
    { icon: '📸', label: 'Photo Album', color: '#00C48C' },
    { icon: '📍', label: 'Location Share', color: '#F43F5E' }
  ],
  destinations: [
    { name: 'Paris', dates: 'Sat 10 Aug - Wed 14 Aug', nights: 4 },
    { name: 'Lyon', dates: 'Wed 14 Aug - Sat 17 Aug', nights: 3 }
  ],
  activities: [
    { icon: '🗼', label: 'Eiffel Tower', color: '#7C3AED' },
    { icon: '🎨', label: 'Louvre Museum', color: '#F59E0B' }
  ]
};

const discoveryInterface = {
  tags: [
    { icon: '🔍', label: 'Local Guide', color: '#00C48C' },
    { icon: '⭐', label: 'Top Rated', color: '#F43F5E' }
  ],
  destinations: [
    { name: 'Tokyo', dates: 'Mon 05 Sep - Sun 11 Sep', nights: 6 },
    { name: 'Kyoto', dates: 'Sun 11 Sep - Thu 15 Sep', nights: 4 }
  ],
  activities: [
    { icon: '🍜', label: 'Ramen Tour', color: '#7C3AED' },
    { icon: '⛩️', label: 'Temple Visit', color: '#F59E0B' }
  ]
};

// Add featured trips data
const featuredTrips = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Ultimate Argentina",
    subtitle: "Itinerary for 2 Weeks",
    imageUrl: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&fit=crop",
    author: "wheregoesrose",
    authorAvatar: "https://i.pravatar.cc/150?u=wheregoesrose"
  },
  {
    id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    title: "North of Morocco",
    subtitle: "7-Day Itinerary",
    imageUrl: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&fit=crop",
    author: "journalofnomads",
    authorAvatar: "https://i.pravatar.cc/150?u=journalofnomads"
  },
  {
    id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    title: "3 Week Vietnam",
    subtitle: "from North to South",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop",
    author: "happywhenabroad",
    authorAvatar: "https://i.pravatar.cc/150?u=happywhenabroad"
  },
  {
    id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    title: "10 days in Norway",
    subtitle: "A Beginners Itinerary",
    imageUrl: "https://images.unsplash.com/photo-1506655624258-6e7d8177e99b?w=800&fit=crop",
    author: "dannycph",
    authorAvatar: "https://i.pravatar.cc/150?u=dannycph"
  },
  {
    id: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
    title: "10-Day Puglia Itinerary",
    subtitle: "The Perfect Italy Road Trip",
    imageUrl: "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=800&fit=crop",
    author: "inbetweentravels",
    authorAvatar: "https://i.pravatar.cc/150?u=inbetweentravels"
  }
];

const Home = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState('planning');
  const [currentInterface, setCurrentInterface] = useState(planningInterface);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature);
    switch (feature) {
      case 'planning':
        setCurrentInterface(planningInterface);
        break;
      case 'group':
        setCurrentInterface(groupInterface);
        break;
      case 'sharing':
        setCurrentInterface(sharingInterface);
        break;
      case 'discovery':
        setCurrentInterface(discoveryInterface);
        break;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (!sliderRef.current) return;
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-no-repeat bg-center bg-cover z-0"
          style={{ backgroundImage: "url('https://www.stippl.io/assets/background_visual-85f87405.svg')" }}
        ></div>
        <div className="absolute left-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <motion.div
            className="absolute left-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-left-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="absolute right-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <motion.div
            className="absolute right-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-right-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
        <div className="stippl-container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-[#00C48C]">One travel app</span><br />
              <span className="text-[#1B3A5B]">to replace them all</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Plan your trips, manage your documents, and share your adventures - all in one place.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/dashboard" className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full text-white bg-[#00C48C] hover:bg-[#00B380] transition-colors">
                Go to Dashboard
              </Link>
              <button className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full text-white bg-[#00C48C] hover:bg-[#00B380] transition-colors">
                Get started. It's FREE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Icons Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="stippl-container">
          <div className="relative">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>

            {/* Feature Icons */}
            <FeatureIcons />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="stippl-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to plan your trip</h2>
            <p className="text-lg text-gray-600">Powerful features to make your travel planning experience seamless</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              className="p-6 rounded-xl bg-white shadow-lg"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Calendar className="h-12 w-12 text-[#00C48C] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Day-by-Day Planning</h3>
              <p className="text-gray-600">Create detailed daily itineraries with activities, accommodations, and transportation.</p>
            </motion.div>
            <motion.div
              className="p-6 rounded-xl bg-white shadow-lg"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Map className="h-12 w-12 text-[#00C48C] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Maps</h3>
              <p className="text-gray-600">Visualize your route and discover nearby attractions with our interactive maps.</p>
            </motion.div>
            <motion.div
              className="p-6 rounded-xl bg-white shadow-lg"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Share2 className="h-12 w-12 text-[#00C48C] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
              <p className="text-gray-600">Share your itineraries with friends and family or collaborate with fellow travelers.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="stippl-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to start planning your next adventure?</h2>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-[#00C48C] hover:bg-[#00B380] transition-colors"
          >
            Create Your First Itinerary
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-24 bg-white">
        <div className="stippl-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-6">
              From planning,<br />
              to tracking, to reliving
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plan and share your trips with friends and connect with others. Explore content by travel bloggers and like-minded travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
            <div className="space-y-8">
              <motion.div
                className={`p-6 rounded-xl cursor-pointer transition-colors duration-300 ${activeFeature === 'planning' ? 'bg-[#00C48C] text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => handleFeatureClick('planning')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-semibold mb-3">Keep everything in one place</h3>
                <p>Organize your travel itineraries, bookings and routes. Add accommodation, activities and transport to each destination.</p>
              </motion.div>

              <motion.div
                className={`p-6 rounded-xl cursor-pointer transition-colors duration-300 ${activeFeature === 'group' ? 'bg-[#00C48C] text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => handleFeatureClick('group')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-semibold mb-3">Supercharge group travel planning</h3>
                <p>Collaborate with your travel companions to create the perfect itinerary together.</p>
              </motion.div>

              <motion.div
                className={`p-6 rounded-xl cursor-pointer transition-colors duration-300 ${activeFeature === 'sharing' ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => handleFeatureClick('sharing')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-semibold mb-3">Share your adventures with friends & family</h3>
                <p>Keep your loved ones updated and share your travel experiences easily.</p>
              </motion.div>

              <motion.div
                className={`p-6 rounded-xl cursor-pointer transition-colors duration-300 ${activeFeature === 'discovery' ? 'bg-[#00C48C] text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => handleFeatureClick('discovery')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-semibold mb-3">Discover expert travel tips and itineraries</h3>
                <p>Learn from experienced travelers and find inspiration for your next trip.</p>
              </motion.div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#F8FAFC] p-8 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    {currentInterface.tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-white px-4 py-2 rounded-full shadow">
                        <div className={`w-6 h-6 bg-[${tag.color}] rounded-full flex items-center justify-center`}>
                          <span className="text-white text-sm">{tag.icon}</span>
                        </div>
                        <span className="ml-2 text-sm font-medium">{tag.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {currentInterface.destinations.map((dest, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{dest.name}</h4>
                            <p className="text-sm text-gray-500">{dest.dates}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1">-</button>
                            <span>{dest.nights}</span>
                            <button className="p-1">+</button>
                            <span className="text-sm text-gray-500">nights</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 mt-6">
                    {currentInterface.activities.map((activity, index) => (
                      <div key={index} className={`flex items-center bg-[${activity.color}] bg-opacity-10 px-4 py-2 rounded-full`}>
                        <div className={`w-6 h-6 bg-[${activity.color}] rounded-full flex items-center justify-center`}>
                          <span className="text-white text-sm">{activity.icon}</span>
                        </div>
                        <span className="ml-2 text-sm font-medium">{activity.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trips Section */}
      <section className="py-24 bg-white">
        <div className="stippl-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold">
              Featured trips from <span className="text-[#00C48C]">travel experts</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-6">
              Keep up with your friends' adventures and follow people who live and breathe all things travel.
              Discover and engage with their travel content while creating your own.
            </p>
          </div>

          <div className="relative">
            <div
              ref={sliderRef}
              className="overflow-x-auto pb-8 hide-scrollbar cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <div className="flex space-x-6 min-w-max px-4">
                {featuredTrips.map((trip) => (
                  <motion.div
                    key={trip.id}
                    className="w-[300px] bg-white rounded-xl shadow-lg overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => !isDragging && setSelectedTrip(trip.id)}
                  >
                    <div className="relative h-[400px] bg-[#E5F0F5]">
                      <motion.img
                        src={trip.imageUrl}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="absolute top-4 left-4 bg-white rounded-full px-4 py-2 shadow-md">
                        <h3 className="font-medium text-sm">{trip.title}</h3>
                        <p className="text-xs text-gray-500">{trip.subtitle}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2">
                        <img
                          src={trip.authorAvatar}
                          alt={trip.author}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-600">{trip.author}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Gradient Overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {selectedTrip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTrip(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={featuredTrips.find(t => t.id === selectedTrip)?.imageUrl}
                  alt={featuredTrips.find(t => t.id === selectedTrip)?.title}
                  className="w-full h-auto"
                />
                <button
                  className="absolute top-4 right-4 bg-white rounded-full p-2"
                  onClick={() => setSelectedTrip(null)}
                >
                  <X className="h-6 w-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* AI Travel Planner Section */}
      <section className="py-24 bg-[#F8F5FF] relative overflow-hidden">
        {/* Decorative curves */}
        <div className="absolute left-0 top-0 w-1/3 h-full">
          <svg className="h-full w-full" viewBox="0 0 400 800" fill="none">
            <path d="M-100 0 Q 150 400 -100 800" stroke="#00C48C" strokeWidth="4" fill="none" />
            <path d="M-50 0 Q 200 400 -50 800" stroke="#7C3AED" strokeWidth="4" fill="none" opacity="0.8" />
          </svg>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg className="h-full w-full" viewBox="0 0 400 800" fill="none">
            <path d="M500 0 Q 250 400 500 800" stroke="#00C48C" strokeWidth="4" fill="none" />
            <path d="M450 0 Q 200 400 450 800" stroke="#7C3AED" strokeWidth="4" fill="none" opacity="0.8" />
          </svg>
        </div>

        <div className="stippl-container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[#666666] text-sm font-medium tracking-wider uppercase mb-4 block">
              YOUR TRIP IN JUST 2 MINUTES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your <span className="text-[#7C3AED]">AI travel planner</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Generate tailored itineraries in a matter of minutes. Use and personalize
              them to your needs. Generate day-by-day notes for each destination.
            </p>
            <button className="inline-flex items-center px-8 py-3 text-base font-medium rounded-full text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors">
              Learn more
            </button>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Mock UI Cards */}
            <div className="grid grid-cols-3 gap-6">
              {/* Generation Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 transform -rotate-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold">Your trip is being</h3>
                  <button className="text-gray-400">&times;</button>
                </div>
                <div className="text-center">
                  <p className="text-[#7C3AED] text-xl font-medium mb-8">generated</p>
                  <div className="w-24 h-24 mx-auto border-4 border-[#7C3AED] rounded-full border-t-transparent animate-spin"></div>
                  <p className="text-sm text-gray-500 mt-8">Discovering the best destinations...</p>
                </div>
              </div>

              {/* Trip Type Selection Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <button className="text-gray-600">&larr;</button>
                    <h3 className="text-lg font-semibold">Generate trip</h3>
                  </div>
                  <button className="text-gray-400">&times;</button>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">What <span className="text-[#7C3AED]">kind of trip</span> are you looking for?</h4>
                  <p className="text-sm text-gray-600 mb-6">Go for total relaxation, culture or beautiful adventures.</p>
                  <div className="space-y-4">
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#7C3AED] transition-colors">
                      <span className="flex items-center">
                        <span className="mr-3">🌅</span>
                        Relax
                      </span>
                    </button>
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#7C3AED] transition-colors">
                      <span className="flex items-center">
                        <span className="mr-3">🏛️</span>
                        Culture
                      </span>
                    </button>
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#7C3AED] transition-colors">
                      <span className="flex items-center">
                        <span className="mr-3">🏃</span>
                        Adventure
                      </span>
                    </button>
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#7C3AED] transition-colors">
                      <span className="flex items-center">
                        <span className="mr-3">🗺️</span>
                        Off the beaten track
                      </span>
                    </button>
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-[#7C3AED] transition-colors">
                      <span className="flex items-center">
                        <span className="mr-3">🌲</span>
                        Nature
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Itinerary Preview Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 transform rotate-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Day-by-day plan for Rome</h3>
                  <button className="text-gray-400">&times;</button>
                </div>
                <div className="space-y-4">
                  <div className="border-l-2 border-[#7C3AED] pl-4">
                    <h4 className="font-medium">JUNE 17: EXPLORING ROME'S HEART</h4>
                    <p className="text-sm text-gray-600">Upon your arrival in Rome, take the day to immerse yourself in the city's historic center. Visit the awe-inspiring Pantheon, make a wish at the Trevi Fountain, and enjoy the Spanish Steps.</p>
                  </div>
                  <div className="border-l-2 border-gray-200 pl-4">
                    <h4 className="font-medium">JUNE 18: VATICAN CITY DISCOVERY</h4>
                    <p className="text-sm text-gray-600">Dedicate your second day to exploring Vatican City. Start with the majestic St. Peter's Basilica.</p>
                  </div>
                  <button className="w-full py-3 bg-[#7C3AED] text-white rounded-full mt-4 hover:bg-[#6D28D9] transition-colors">
                    Add to plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="stippl-container">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] text-center mb-16">
            Join over half a million travelers on<br />
            their journey to easy trip planning
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Amazing App!!!</h3>
              <p className="text-gray-600 mb-4">
                I absolutely love all the features it offers and the UI is gorgeous! Very well done!! I love that you can plan your future trips, update them while your on a the trip, and even record past trips and most importantly keep your favorite memories and share them with friends. This app literally offers anything you can wish for in a travel app. Thank you for creating it!! :)
              </p>
              <p className="text-gray-500 italic">Kaytee023</p>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Been waiting for this</h3>
              <p className="text-gray-600 mb-4">
                If ever there was an app I would have built myself if I had more brains and motivation, this would be it. Only been using it for 5 minutes and managed to replace my (albeit amazing) 10 tab excel spreadsheet covering our upcoming itinerary, budget, bookings, spending... etc. into one place. Clearly, this review is based on a very short amount of use, but I've got about 400 other apps I've never even considered reviewing.
              </p>
              <p className="text-gray-500 italic">BB_85</p>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Amazing !</h3>
              <p className="text-gray-600 mb-4">
                Absolutely incredible app, super intuitive UI! You can put everything, places to visit, restaurants, accommodation. I don't see any fault in this application, I no longer go on a trip without it!!
              </p>
              <p className="text-gray-500 italic">Allan_bdk21</p>
            </div>

            {/* Review 4 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Great all-around app</h3>
              <p className="text-gray-600 mb-4">
                I think some people just don't understand the full potential of this app. There is so much you can add and do and accomplish with this. A fantastic travel go-to crutch!
              </p>
              <p className="text-gray-500 italic">Cormac A</p>
            </div>

            {/* Review 5 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">I've been using it for all my trips</h3>
              <p className="text-gray-600 mb-4">
                It's a really comprehensive app with so many features. I've been telling my friends about it. Really cool.
              </p>
              <p className="text-gray-500 italic">Catapt</p>
            </div>

            {/* Review 6 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">The best application</h3>
              <p className="text-gray-600 mb-4">
                Nothing ever like it. It's incredible. The important thing is that they are in the details, they understand everything the user needs.
              </p>
              <p className="text-gray-500 italic">Lulinna</p>
            </div>

            {/* Review 7 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">I love this app!</h3>
              <p className="text-gray-600 mb-4">
                We're planning our very first family holiday and Stippl made the process so much more exciting. The multi stop trip is fully tracked, hotels, and ESPECIALLY restaurant recommendations through the app - that was so helpful. We've shortlisted a whole bunch of places to go thanks to Stippl. Thank you for making our trip so much better ❤️
              </p>
              <p className="text-gray-500 italic">SoniaMenezes</p>
            </div>

            {/* Review 8 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Love this app!</h3>
              <p className="text-gray-600 mb-4">
                Using it for the first time for a trip with my friend around SE Asia! Love the various features such as recommended sights, budgeting and journaling. Stippl is definitely making life much easier :D Great work guys!
              </p>
              <p className="text-gray-500 italic">BB_85</p>
            </div>

            {/* Review 9 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex text-[#FFB800] mb-2">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-2">Brilliant App , highly recommended</h3>
              <p className="text-gray-600 mb-4">
                This app is so helpful. keeping track of our trip to Thailand sharing information with my travel buddies.We all loved it . Sharing with friends and family also You can add photos as you go.
              </p>
              <p className="text-gray-500 italic">Doyler S</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategorySelection />
        <ItinerarySection title="Most Popular Itineraries" country="Japan" filter="popular" />
        <ItinerarySection title="Handpicked for You" country="Japan" filter="handpicked" />
        <ItinerarySection title="2 Weeks in Japan" country="Japan" filter="2weeks" />
        <ItinerarySection title="1 Week in Japan" country="Japan" filter="1week" />
        <ItinerarySection title="Recently Added" country="Japan" filter="recent" />
        <ItinerarySection title="Most Liked" country="Japan" filter="liked" />
        <ItinerarySection title="Short Trips" country="Japan" filter="short-trips" />
      </div>

      {/* Sign Up Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 w-full h-full bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: 'url("https://www.stippl.io/assets/background_visual-85f87405.svg")',
              opacity: '1'
            }}
          ></div>
        </div>

        <div className="stippl-container relative z-10">
          <div className="text-center">
            <span className="text-[#4A90E2] text-sm font-medium tracking-wider uppercase mb-4 block">
              SIGN UP NOW
            </span>
            <h2 className="text-[#1B3A5B] text-5xl font-bold mb-8">
              Start your journey
            </h2>
            <div className="flex flex-col items-center gap-6">
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-3 text-base font-medium rounded-full text-white bg-[#00C48C] hover:bg-[#00B380] transition-colors"
              >
                Sign up free
              </Link>
              <div className="text-gray-600">or download the app</div>
              <div className="flex gap-4">
                <a href="#" className="transition-opacity hover:opacity-80">
                  <img
                    src="/images/app-store.svg"
                    alt="Download on the App Store"
                    className="h-12"
                  />
                </a>
                <a href="#" className="transition-opacity hover:opacity-80">
                  <img
                    src="/images/google-play.svg"
                    alt="Get it on Google Play"
                    className="h-12"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fcf7ec] py-16">
        <div className="stippl-container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Logo and Social Links */}
            <div className="md:col-span-3">
              <img
                src="/images/stippl-logo.svg"
                alt="Stippl"
                className="h-8 mb-6"
              />
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <circle cx="12" cy="12" r="5" strokeWidth="2" />
                    <circle cx="17" cy="7" r="1" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2C14 2 15 4 15 6V14C15 16 14 18 12 18C10 18 9 16 9 14C9 12 10 11 12 11" strokeWidth="2" />
                    <path d="M15 6C17 6 19 5 20 3" strokeWidth="2" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <path d="M15 8H13C12.4 8 12 8.4 12 9V21" strokeWidth="2" />
                    <line x1="9" y1="13" x2="15" y2="13" strokeWidth="2" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <circle cx="8" cy="8" r="2" strokeWidth="2" />
                    <path d="M6 12V18M10 12V18M14 12V18M18 12V18" strokeWidth="2" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Itinerary planner</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Budget planner</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Packing list</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Your map</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Travel profile</a></li>
              </ul>
            </div>

            {/* Work with us Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Work with us</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Travel bloggers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Influencers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">DMOs</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Travel agents</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Hotels</a></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">About us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Give us feedback</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact us</a></li>
              </ul>
            </div>

            {/* Download Links */}
            <div className="md:col-span-3">
              <h3 className="font-semibold text-gray-900 mb-4">Download the app</h3>
              <div className="flex flex-col gap-4">
                <a href="#" className="transition-opacity hover:opacity-80">
                  <img
                    src="/images/app-store.svg"
                    alt="Download on the App Store"
                    className="h-10"
                  />
                </a>
                <a href="#" className="transition-opacity hover:opacity-80">
                  <img
                    src="/images/google-play.svg"
                    alt="Get it on Google Play"
                    className="h-10"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 