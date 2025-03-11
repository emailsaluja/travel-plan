import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Share2,
  MoreHorizontal,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  ChevronDown,
  Calendar,
  Users,
  MapPin,
  Trash2,
  Plus,
  Globe,
  Clock,
  Edit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserItineraryService } from '../services/user-itinerary.service';
import { ProfileSettingsPopup } from '../components/ProfileSettingsPopup';

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

const Dashboard = () => {
  const { userEmail } = useAuth();
  const username = '@amandeepsingh';
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const stats = {
    followers: 0,
    following: 0,
    countries: 9
  };

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      const { data: userItineraries } = await UserItineraryService.getUserItineraries();
      setItineraries(userItineraries || []);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        setLoading(true);
        await UserItineraryService.deleteItinerary(id);
        setItineraries(prev => prev.filter(item => item.id !== id));
        await loadItineraries();
      } catch (error) {
        console.error('Error deleting itinerary:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex-shrink-0">
              <img src="/images/stippl-logo.svg" alt="Stippl" className="h-8" />
            </Link>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <Link to="/you" className="flex items-center gap-2 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-[#00C48C] flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>You</span>
                </Link>
                <Link to="/discover" className="flex items-center gap-2 text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>Discover</span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <Link to="/invite" className="text-[#00C48C] hover:text-[#00B380] transition-colors">
                  Invite a friend
                </Link>
                <button className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00C48C] rounded-full"></span>
                </button>
                <Link
                  to="/create-itinerary"
                  className="bg-[#00C48C] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#00B380] transition-colors shadow-sm"
                >
                  <span>Add</span>
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 py-6 pt-20">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-[240px] flex-shrink-0">
            {/* Profile Section */}
            <div className="mb-8">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#00C48C] to-[#00B380] mb-4 shadow-md">
                <img src="/images/profile-icon.svg" alt="Profile" className="w-full h-full object-cover rounded-lg" />
              </div>
              <p className="text-gray-500 mb-4">{username}</p>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-medium text-[#1e293b] mb-1">{stats.followers}</div>
                  <div className="text-gray-500">followers</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-[#1e293b] mb-1">{stats.following}</div>
                  <div className="text-gray-500">following</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-[#1e293b] mb-1">{stats.countries}</div>
                  <div className="text-gray-500">countries</div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search.."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent transition-all"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <div>
                <Link
                  to="/trips"
                  className="flex items-center justify-between text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00C48C]" />
                    <span>Trips</span>
                  </div>
                  <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                    {itineraries.length}
                  </span>
                </Link>
              </div>
              <div>
                <Link
                  to="/countries"
                  className="flex items-center justify-between text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00C48C]" />
                    <span>Countries</span>
                  </div>
                  <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                    9
                  </span>
                </Link>
              </div>
            </div>

            {/* Share Profile and Settings */}
            <div className="mt-auto pt-6 space-y-2">
              <button
                className="w-full flex items-center gap-2 text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#00C48C]" />
                <span>Share profile</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-2 text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#00C48C]" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00C48C]" />
                <h2 className="text-lg font-medium text-[#1e293b]">{itineraries.length} upcoming trips</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <img
                  src="/images/empty-state.svg"
                  alt="No trips"
                  className="w-48 h-48 mx-auto mb-6"
                />
                <h3 className="text-xl font-semibold text-[#1e293b] mb-2">
                  No trips planned yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start planning your next adventure and create unforgettable memories
                </p>
                <Link
                  to="/create-itinerary"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {itineraries.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-[#1e293b]">{itinerary.trip_name}</h3>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/create-itinerary?id=${itinerary.id}`}
                            className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-[#00C48C] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(itinerary.id, e)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="w-4 h-4 text-[#00C48C]" />
                          <span>{itinerary.country}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-[#00C48C]" />
                            <span>{formatDate(itinerary.start_date)}</span>
                          </div>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-[#00C48C]" />
                            <span>{itinerary.duration} days</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4 text-[#00C48C]" />
                          <span>{itinerary.passengers} travelers</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-medium text-[#1e293b] mb-3">Destinations</h4>
                        <div className="space-y-2">
                          {itinerary.destinations?.map((dest, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-[#00C48C]" />
                              <span className="text-sm text-gray-600 flex-1">{dest.destination}</span>
                              <span className="text-sm text-[#00C48C] font-medium">{dest.nights} nights</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Popup */}
      <ProfileSettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Dashboard; 