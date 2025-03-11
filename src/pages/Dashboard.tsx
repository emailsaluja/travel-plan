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
  Edit,
  LogOut,
  X,
  User,
  Image,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserItineraryService } from '../services/user-itinerary.service';
import { ProfileSettingsPopup } from '../components/ProfileSettingsPopup';
import { CountryImagesService } from '../services/country-images.service';
import { UserSettingsService, UserSettings as UserSettingsType } from '../services/user-settings.service';
import { supabase } from '../lib/supabase';

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

interface UserSettings {
  username: string;
  bio: string;
  profilePicture?: string;
  heroBanner?: string;
}

const Dashboard = () => {
  const { userEmail, signOut } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const username = '@amandeepsingh';
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<'trips' | 'countries'>('trips');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryImages, setCountryImages] = useState<Record<string, string[]>>({});
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<UserSettingsType>({
    user_id: '',
    username: '@user',
    bio: '',
    profile_picture_url: '',
    hero_banner_url: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [heroBannerFile, setHeroBannerFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [heroBannerPreview, setHeroBannerPreview] = useState<string>('');

  const stats = {
    followers: 0,
    following: 0,
    countries: 9
  };

  useEffect(() => {
    loadItineraries();
  }, []);

  // Add effect to get user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Update loadUserSettings to handle loading state
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;

      try {
        const userSettings = await UserSettingsService.getUserSettings(userId);
        if (userSettings) {
          setSettings(userSettings);
          if (userSettings.profile_picture_url) {
            setProfilePicturePreview(userSettings.profile_picture_url);
          }
          if (userSettings.hero_banner_url) {
            setHeroBannerPreview(userSettings.hero_banner_url);
          }
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, [userId]);

  // Group itineraries by country
  const countryStats = React.useMemo(() => {
    const stats: Record<string, { count: number; itineraries: Itinerary[] }> = {};
    itineraries.forEach(itinerary => {
      if (!stats[itinerary.country]) {
        stats[itinerary.country] = { count: 0, itineraries: [] };
      }
      stats[itinerary.country].count += 1;
      stats[itinerary.country].itineraries.push(itinerary);
    });
    return stats;
  }, [itineraries]);

  // Fetch country images
  useEffect(() => {
    const fetchCountryImages = async () => {
      const countries = Object.keys(countryStats);
      const images: Record<string, string[]> = {};

      for (const country of countries) {
        try {
          const imageUrls = await CountryImagesService.getCountryImages(country);
          if (imageUrls && imageUrls.length > 0) {
            images[country] = imageUrls;
          }
        } catch (error) {
          console.error(`Error fetching images for ${country}:`, error);
        }
      }

      setCountryImages(images);

      // Assign random images for each itinerary
      const selected: Record<string, string> = {};
      itineraries.forEach(itinerary => {
        const countryImageList = images[itinerary.country] || [];
        if (countryImageList.length > 0) {
          const randomIndex = Math.floor(Math.random() * countryImageList.length);
          selected[itinerary.id] = countryImageList[randomIndex];
        }
      });

      // Also assign random images for country view
      Object.keys(countryStats).forEach(country => {
        const countryImageList = images[country] || [];
        if (countryImageList.length > 0) {
          const randomIndex = Math.floor(Math.random() * countryImageList.length);
          selected[country] = countryImageList[randomIndex];
        }
      });

      setSelectedImages(selected);
    };

    fetchCountryImages();
  }, [countryStats, itineraries]);

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
  };

  const handleViewChange = (newView: 'trips' | 'countries') => {
    setView(newView);
    setSelectedCountry(null);
    // Update URL without hash
    navigate('/dashboard');
  };

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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Profile picture must be less than 2MB');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Hero banner must be less than 5MB');
        return;
      }
      setHeroBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) return;

    try {
      let updatedSettings = { ...settings };

      // Upload profile picture if changed
      if (profilePictureFile) {
        const profilePictureUrl = await UserSettingsService.uploadProfilePicture(profilePictureFile, userId);
        if (profilePictureUrl) {
          updatedSettings.profile_picture_url = profilePictureUrl;
        }
      }

      // Upload hero banner if changed
      if (heroBannerFile) {
        const heroBannerUrl = await UserSettingsService.uploadHeroBanner(heroBannerFile, userId);
        if (heroBannerUrl) {
          updatedSettings.hero_banner_url = heroBannerUrl;
        }
      }

      // Save settings
      const success = await UserSettingsService.saveUserSettings(updatedSettings, userId);
      if (success) {
        setSettings(updatedSettings);
        setIsSettingsOpen(false);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
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
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-[#00C48C] to-[#00B380] mb-4 shadow-md">
                <img
                  src={settings.profile_picture_url || '/images/profile-icon.svg'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-500 mb-4">{settings.username}</p>
              {settings.bio && <p className="text-sm text-gray-600 mb-4">{settings.bio}</p>}

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
                <button
                  onClick={() => handleViewChange('trips')}
                  className={`w-full flex items-center justify-between text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors ${view === 'trips' ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00C48C]" />
                    <span>Trips</span>
                  </div>
                  <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                    {itineraries.length}
                  </span>
                </button>
              </div>
              <div>
                <button
                  onClick={() => handleViewChange('countries')}
                  className={`w-full flex items-center justify-between text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors ${view === 'countries' ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00C48C]" />
                    <span>Countries</span>
                  </div>
                  <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                    {Object.keys(countryStats).length}
                  </span>
                </button>
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
              <Link
                to="/admin/country-images"
                className="w-full flex items-center gap-2 text-[#1e293b] font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4 text-[#00C48C]" />
                <span>Manage Country Images</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 text-gray-500 font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#00C48C]" />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {view === 'trips' ? (
                  <>
                    <Clock className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {selectedCountry ? `${countryStats[selectedCountry]?.count} trips in ${selectedCountry}` : `${itineraries.length} upcoming trips`}
                    </h2>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {Object.keys(countryStats).length} countries visited
                    </h2>
                  </>
                )}
              </div>
              {selectedCountry && (
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to all countries
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
              </div>
            ) : view === 'countries' && !selectedCountry ? (
              // Countries Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(countryStats).map(([country, { count }]) => (
                  <div
                    key={country}
                    onClick={() => handleCountryClick(country)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={selectedImages[country] || '/images/default-country.jpg'}
                        alt={`${country} landscape`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-semibold mb-1">{country}</h3>
                        <p className="text-white/90 text-sm">{count} {count === 1 ? 'trip' : 'trips'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Itineraries Grid View (filtered by country if selected)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(selectedCountry ? countryStats[selectedCountry]?.itineraries : itineraries).map((itinerary) => (
                  <div
                    key={itinerary.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/view-itinerary/${itinerary.id}`)}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={selectedImages[itinerary.id] || '/images/default-country.jpg'}
                        alt={`${itinerary.country} landscape`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
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
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="w-4 h-4 text-[#00C48C]" />
                          <span className="text-sm text-gray-600 flex-1">
                            {itinerary.destinations?.map((dest, index) => (
                              <span key={index}>
                                {dest.destination.split(',')[0].trim()}
                                {index < itinerary.destinations.length - 1 && <span className="mx-2">•</span>}
                              </span>
                            ))}
                          </span>
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
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Picture
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 400x400px, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Banner
                </label>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  {heroBannerPreview ? (
                    <img
                      src={heroBannerPreview}
                      alt="Hero Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroBannerChange}
                    className="hidden"
                    id="hero-banner"
                  />
                  <label
                    htmlFor="hero-banner"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 1920x1080px, max 5MB
                  </p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                className="w-full bg-[#00C48C] text-white py-2 px-4 rounded-md hover:bg-[#00B37D] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 