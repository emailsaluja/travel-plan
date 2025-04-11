import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Plus, Sparkles, ShoppingBag, Globe, Star, MessageSquare } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import AIItineraryGenerator from '../components/AIItineraryGenerator';
import { AIItineraryService } from '../services/ai-itinerary.service';
import { PaymentService, PurchasedItinerary } from '../services/payment.service';
import { useUser } from '../hooks/useUser';
import { useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';

interface LoaderData {
  defaultTab?: string;
}

// This is a placeholder component for the user dashboard
// In a real application, you would fetch the user data and their itineraries

const UserDashboard: React.FC = () => {
  const { defaultTab } = useLoaderData() as LoaderData;
  const [activeTab, setActiveTab] = useState(defaultTab || 'myItineraries');
  const [aiGeneratedItineraries, setAiGeneratedItineraries] = useState<any[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [purchasedItineraries, setPurchasedItineraries] = useState<PurchasedItinerary[]>([]);
  const { user } = useUser();
  const paymentService = new PaymentService();
  const navigate = useNavigate();
  const location = useLocation();

  // Show thank you message if redirected from successful purchase
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('');

  useEffect(() => {
    // Check if we have a thank you message in the location state
    if (location.state?.showThankYou) {
      setShowThankYou(true);
      setThankYouMessage(location.state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setShowThankYou(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      loadPurchasedItineraries();
    }
  }, [user]);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const loadPurchasedItineraries = async () => {
    if (!user?.id) return;
    try {
      const itineraries = await paymentService.getPurchasedItineraries(user.id);
      setPurchasedItineraries(itineraries);
    } catch (error) {
      console.error('Error loading purchased itineraries:', error);
    }
  };

  // Mock user data
  const userData = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    myItineraries: [
      {
        id: '101',
        title: 'My Trip to Japan',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        duration: 14,
        cities: ['Tokyo', 'Kyoto', 'Osaka'],
        createdAt: '1 month ago'
      },
      {
        id: '102',
        title: 'Weekend in Paris',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80',
        duration: 3,
        cities: ['Paris'],
        createdAt: '2 weeks ago'
      }
    ],
    savedItineraries: [
      {
        id: '201',
        title: 'Italy in 10 days',
        imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
        duration: 10,
        cities: ['Rome', 'Florence', 'Venice'],
        author: 'Travel Expert',
        savedAt: '3 weeks ago'
      },
      {
        id: '202',
        title: 'Thailand in 14 days',
        imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        duration: 14,
        cities: ['Bangkok', 'Chiang Mai', 'Phuket'],
        author: 'Asia Traveler',
        savedAt: '1 month ago'
      }
    ]
  };

  const handleCreateItinerary = () => {
    setShowAIGenerator(true);
  };

  const handleAIItineraryGenerated = async (itinerary: any) => {
    setShowAIGenerator(false);
    // Refresh the list of AI-generated itineraries
    try {
      const generatedItineraries = await AIItineraryService.getGeneratedItineraries();
      setAiGeneratedItineraries(generatedItineraries);
    } catch (error) {
      console.error('Error fetching generated itineraries:', error);
    }
  };

  const handleLogout = () => {
    alert('User logged out');
  };

  return (
    <div className="min-h-screen">
      <TopNavigation />

      <div className="flex min-h-screen pt-[60px]">
        {/* Left Side Navigation */}
        <div className="w-[20%] bg-[#F0F8FF] border-r border-gray-300 min-h-screen fixed left-0 px-6 pt-0 flex flex-col">
          <div className="py-8">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-[#00C48C] to-[#00B380] mb-4 shadow-md">
              <img
                src={user?.user_metadata?.avatar_url || '/images/profile-icon.svg'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {user?.user_metadata?.full_name && (
              <p className="text-gray-700 font-medium mb-1">{user.user_metadata.full_name}</p>
            )}
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <Globe className="w-4 h-4 text-[#00C48C]" />
                <span>My Trips</span>
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate('/messages')}
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[#00C48C]" />
                <span>Messages</span>
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate('/dashboard?tab=aiItineraries')}
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#00C48C]" />
                <span>AI Itineraries</span>
              </button>
            </div>
            <div>
              <button
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#00C48C]" />
                <span>Purchases</span>
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate('/dashboard?tab=premium')}
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <Star className="w-4 h-4 text-[#00C48C]" />
                <span>Premium Itineraries</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-[80%] ml-[20%]">
          <div className="max-w-[1400px] px-8 py-8">
            {/* Thank you message */}
            {showThankYou && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {thankYouMessage}
              </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Purchased Itineraries</h2>
                {purchasedItineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">You haven't purchased any itineraries yet.</p>
                    <button
                      onClick={() => navigate('/discover')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00C48C] hover:bg-[#00B380]"
                    >
                      Discover Itineraries
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedItineraries.map((itinerary) => (
                      <div key={itinerary.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="relative">
                          <img
                            src={itinerary.featured_image_url || '/images/placeholder.jpg'}
                            alt={itinerary.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <div className="px-3 py-1.5 bg-[#00C48C] text-white text-sm font-medium rounded-full">
                              {itinerary.duration} days
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{itinerary.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{itinerary.description}</p>
                          <button
                            onClick={() => navigate(`/premium-itinerary/${itinerary.id}`)}
                            className="w-full px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors"
                          >
                            View Itinerary
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;