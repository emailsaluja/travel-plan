import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Upload,
  Heart,
  Copy,
  Eye,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserItineraryService } from '../services/user-itinerary.service';
import { ProfileSettingsPopup } from '../components/ProfileSettingsPopup';
import { CountryImagesService } from '../services/country-images.service';
import { UserSettingsService, UserSettings as UserSettingsType } from '../services/user-settings.service';
import { supabase } from '../lib/supabase';
import { cleanDestination } from '../utils/stringUtils';
import ItineraryTile from '../components/ItineraryTile';
import { LikesService } from '../services/likes.service';
import TopNavigation from '../components/TopNavigation';
import { aiItineraryService, SavedAIItinerary } from '../services/ai-itinerary.service';

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
  likesCount?: number;
}

interface UserSettings {
  username: string;
  full_name: string;
  bio: string;
  profilePicture?: string;
  heroBanner?: string;
  website_url?: string;
  youtube_url?: string;
  instagram_url?: string;
}

interface LikesState {
  counts: Record<string, number>;
  userLikes: Set<string>;
}

interface AIItinerary {
  id: string;
  trip_name: string;
  duration: number;
  country: string;
  destinations: Array<{
    destination: string;
  }>;
  created_at: string;
  generated_itinerary: {
    destinations: Array<{
      name: string;
      nights: number;
      description: string;
    }>;
    dailyPlans: Array<{
      day: number;
      activities: Array<{
        time: string;
        activity: string;
        description: string;
        type: string;
      }>;
    }>;
  };
}

const Dashboard = () => {
  const { userEmail, signOut } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const username = '@amandeepsingh';
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<'trips' | 'countries' | 'upcoming' | 'past' | 'liked' | 'aiItineraries'>('trips');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryImages, setCountryImages] = useState<Record<string, string[]>>({});
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<UserSettingsType>({
    user_id: '',
    username: '@user',
    full_name: '',
    bio: '',
    profile_picture_url: '',
    hero_banner_url: '',
    website_url: '',
    youtube_url: '',
    instagram_url: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [heroBannerFile, setHeroBannerFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [heroBannerPreview, setHeroBannerPreview] = useState<string>('');
  const [likedTrips, setLikedTrips] = useState<Itinerary[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [originalSettings, setOriginalSettings] = useState<UserSettingsType>({
    user_id: '',
    username: '@user',
    full_name: '',
    bio: '',
    profile_picture_url: '',
    hero_banner_url: '',
    website_url: '',
    youtube_url: '',
    instagram_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dataCache = useRef<{
    itineraries: Itinerary[];
    likedTrips: Itinerary[];
    userSettings: UserSettingsType | null;
    lastFetch: number;
  }>({
    itineraries: [],
    likedTrips: [],
    userSettings: null,
    lastFetch: 0
  });

  // Update likes data state with proper typing
  const [likesData, setLikesData] = useState<LikesState>({
    counts: {},
    userLikes: new Set<string>()
  });

  // Add state for AI itineraries
  const [aiItineraries, setAiItineraries] = useState<SavedAIItinerary[]>([]);

  const stats = {
    followers: 0,
    following: 0,
    countries: 9
  };

  // Memoize the data loading function
  const loadAllData = useCallback(async (forceRefresh = false) => {
    // If data is less than 1 minute old and no force refresh, use cached data
    const now = Date.now();
    if (!forceRefresh &&
      dataCache.current.lastFetch > 0 &&
      now - dataCache.current.lastFetch < 60000) {
      setItineraries(dataCache.current.itineraries);
      setLikedTrips(dataCache.current.likedTrips);
      if (dataCache.current.userSettings) {
        setSettings(dataCache.current.userSettings);
      }
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch all data in parallel including likes
        const [
          { data: userItineraries },
          { data: likedItinerariesData },
          userSettings,
          { counts, userLikes, error: likesError }
        ] = await Promise.all([
          UserItineraryService.getUserItineraries(),
          UserItineraryService.getLikedItineraries(),
          UserSettingsService.getUserSettings(user.id),
          LikesService.getAllLikesData()
        ]);

        // Update likes data state
        if (!likesError && counts && userLikes) {
          setLikesData({
            counts: counts as Record<string, number>,
            userLikes: userLikes as Set<string>
          });
        }

        if (userItineraries?.length) {
          // Process itineraries with likes
          const itinerariesWithLikes = userItineraries.map(itinerary => ({
            ...itinerary,
            likesCount: counts?.[itinerary.id] || 0
          }));

          // Sort by date
          const sortedItineraries = itinerariesWithLikes.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          setItineraries(sortedItineraries);
          dataCache.current.itineraries = sortedItineraries;
        }

        // Process liked trips
        if (likedItinerariesData) {
          const processedLikedTrips = likedItinerariesData.map((item: any) => ({
            id: item.id,
            trip_name: item.trip_name,
            country: item.country,
            start_date: item.start_date,
            duration: item.duration,
            passengers: item.passengers,
            created_at: item.created_at,
            destinations: item.destinations,
            likesCount: counts?.[item.id] || 0
          }));
          setLikedTrips(processedLikedTrips);
          dataCache.current.likedTrips = processedLikedTrips;
        }

        // Process user settings
        if (userSettings) {
          setSettings(userSettings);
          setIsUsernameSet(!!userSettings.username && userSettings.username !== '@user');
          if (userSettings.profile_picture_url) {
            setProfilePicturePreview(userSettings.profile_picture_url);
          }
          if (userSettings.hero_banner_url) {
            setHeroBannerPreview(userSettings.hero_banner_url);
          }
          dataCache.current.userSettings = userSettings;
        }

        // Update cache timestamp
        dataCache.current.lastFetch = now;
      }

      // Load AI itineraries
      await loadAIItineraries();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setIsDataLoaded(true);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Replace existing loadItineraries function
  const loadItineraries = () => loadAllData(true);

  // Replace existing loadLikedTrips function
  const loadLikedTrips = () => loadAllData(true);

  // Add URL query parameter handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'aiItineraries') {
      setView('aiItineraries');
    }
  }, []);

  // Update handleViewChange to handle URL updates
  const handleViewChange = (newView: 'trips' | 'countries' | 'upcoming' | 'past' | 'liked' | 'aiItineraries') => {
    setView(newView);
    setSelectedCountry(null);

    // Update URL hash and search params
    if (newView === 'liked') {
      window.location.hash = 'liked';
    } else if (window.location.hash === '#liked') {
      window.location.hash = '';
    }

    // Update search params for AI itineraries tab
    const params = new URLSearchParams(window.location.search);
    if (newView === 'aiItineraries') {
      params.set('tab', 'aiItineraries');
    } else {
      params.delete('tab');
    }
    window.history.pushState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
  };

  // Optimize handleUnlike with proper typing
  const handleUnlike = async (id: string) => {
    try {
      await LikesService.unlikeItinerary(id);

      // Update local state immediately
      setLikedTrips(prev => prev.filter(trip => trip.id !== id));

      // Update likes data with proper typing
      setLikesData(prev => {
        const newUserLikes = new Set(Array.from(prev.userLikes));
        newUserLikes.delete(id);

        return {
          counts: {
            ...prev.counts,
            [id]: Math.max(0, (prev.counts[id] || 1) - 1)
          },
          userLikes: newUserLikes
        };
      });

      // Update cache
      dataCache.current.likedTrips = dataCache.current.likedTrips.filter(trip => trip.id !== id);

      // Refresh likes data in background
      const { counts, userLikes } = await LikesService.getAllLikesData();
      if (counts && userLikes) {
        setLikesData({
          counts: counts as Record<string, number>,
          userLikes: userLikes as Set<string>
        });
      }
    } catch (error) {
      console.error('Error unliking itinerary:', error);
    }
  };

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
      try {
        // Fetch all country images in one call
        const allImages = await CountryImagesService.getAllCountryImages();
        setCountryImages(allImages);
      } catch (error) {
        console.error('Error fetching country images:', error);
      }
    };

    fetchCountryImages();
  }, []);

  const getRandomImageForCountry = (country: string): string => {
    const images = countryImages[country] || [];
    if (images.length === 0) return '/default-country-image.jpg';
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  };

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
  };

  // Add hash change handler
  useEffect(() => {
    // Set initial view based on hash
    if (window.location.hash === '#liked') {
      setView('liked');
    }

    // Listen for hash changes
    const handleHashChange = () => {
      if (window.location.hash === '#liked') {
        setView('liked');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilStart = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripDate = new Date(startDate);
    tripDate.setHours(0, 0, 0, 0);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatStartTime = (startDate: string) => {
    const days = getDaysUntilStart(startDate);
    if (days < 0) {
      return `${Math.abs(days)} days ago`;
    }
    return `Start in ${days} days`;
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Profile picture must be less than 2MB');
      return;
    }

    console.log('Selected profile picture:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Store the raw file object
    setProfilePictureFile(file);

    // Create a local preview
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleHeroBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Hero banner must be less than 5MB');
      return;
    }

    console.log('Selected hero banner:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Store the raw file object
    setHeroBannerFile(file);

    // Create a local preview
    const reader = new FileReader();
    reader.onload = () => {
      setHeroBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const checkUsernameUniqueness = async (username: string, currentUserId: string): Promise<boolean> => {
    try {
      // Get all matching usernames
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', username);

      if (error) {
        console.error('Error checking username uniqueness:', error);
        return false;
      }

      // If no data or empty array, username is available
      if (!data || data.length === 0) {
        return true;
      }

      // If there is exactly one result and it's the current user, username is available
      if (data.length === 1 && data[0].user_id === currentUserId) {
        return true;
      }

      // Username is taken by another user
      return false;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      return false;
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Check username uniqueness before saving
      if (settings.username !== originalSettings.username) {
        const isUnique = await checkUsernameUniqueness(settings.username, settings.user_id);
        if (!isUnique) {
          setError('This username is already taken. Please choose another one.');
          setIsSaving(false);
          return;
        }
      }

      // Handle file uploads first if there are any
      let profilePictureUrl = settings.profile_picture_url;
      let heroBannerUrl = settings.hero_banner_url;

      // Upload profile picture if there's a new file
      if (profilePictureFile) {
        console.log('Starting profile picture upload');

        try {
          const userSettingsService = new UserSettingsService();
          const uploadedUrl = await userSettingsService.uploadProfilePicture(profilePictureFile, settings.user_id);

          if (uploadedUrl) {
            profilePictureUrl = uploadedUrl;
            console.log('Profile picture uploaded successfully:', profilePictureUrl);
          } else {
            console.error('Failed to upload profile picture');
          }
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
        }
      }

      // Upload hero banner if there's a new file
      if (heroBannerFile) {
        console.log('Starting hero banner upload');

        try {
          const userSettingsService = new UserSettingsService();
          const uploadedUrl = await userSettingsService.uploadHeroBanner(heroBannerFile, settings.user_id);

          if (uploadedUrl) {
            heroBannerUrl = uploadedUrl;
            console.log('Hero banner uploaded successfully:', heroBannerUrl);
          } else {
            console.error('Failed to upload hero banner');
          }
        } catch (uploadError) {
          console.error('Error uploading hero banner:', uploadError);
        }
      }

      // Update the profile with all fields
      const updateData = {
        username: settings.username,
        full_name: settings.full_name,
        bio: settings.bio,
        profile_picture_url: profilePictureUrl,
        hero_banner_url: heroBannerUrl,
        website_url: settings.website_url || '',
        youtube_url: settings.youtube_url || '',
        instagram_url: settings.instagram_url || '',
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with data:', updateData);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', settings.user_id);

      if (updateError) {
        throw updateError;
      }

      // Update local settings
      setSettings(prev => ({
        ...prev,
        profile_picture_url: profilePictureUrl,
        hero_banner_url: heroBannerUrl
      }));

      setOriginalSettings({
        ...settings,
        profile_picture_url: profilePictureUrl,
        hero_banner_url: heroBannerUrl
      });

      setIsSettingsOpen(false);

      // Reset file states
      setProfilePictureFile(null);
      setHeroBannerFile(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this new function to get upcoming trips
  const getUpcomingTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return itineraries
      .filter(itinerary => {
        const startDate = new Date(itinerary.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= today;
      })
      .sort((a, b) => {
        const startDateA = new Date(a.start_date);
        const startDateB = new Date(b.start_date);
        return startDateA.getTime() - startDateB.getTime();
      });
  };

  const upcomingTrips = getUpcomingTrips();

  // Add this new function to get past trips
  const getPastTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return itineraries
      .filter(itinerary => {
        const startDate = new Date(itinerary.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate < today;
      })
      .sort((a, b) => {
        const startDateA = new Date(a.start_date);
        const startDateB = new Date(b.start_date);
        return startDateB.getTime() - startDateA.getTime(); // Most recent first
      });
  };

  const pastTrips = getPastTrips();

  const handleCopyTrip = async (id: string) => {
    try {
      await UserItineraryService.copyItinerary(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      await loadItineraries(); // Refresh the trips list
    } catch (error) {
      console.error('Error copying itinerary:', error);
    }
  };

  // Add click handler for closing menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.add-menu') && !target.closest('.add-button')) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add function to load AI itineraries
  const loadAIItineraries = async () => {
    try {
      const itineraries = await aiItineraryService.getItineraries();
      setAiItineraries(itineraries);
    } catch (error) {
      console.error('Error loading AI itineraries:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNavigation />

      <div className="flex min-h-screen pt-[60px]">
        {/* Left Sidebar - 20% width */}
        <div className="w-[20%] bg-[#F0F8FF] border-r border-gray-300 min-h-screen fixed left-0 px-6 pt-0 flex flex-col">
          {/* Profile Section */}
          <div className="py-8">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-[#00C48C] to-[#00B380] mb-4 shadow-md">
              <img
                src={settings.profile_picture_url || '/images/profile-icon.svg'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {settings.full_name && (
              <p className="text-gray-700 font-medium mb-1">{settings.full_name}</p>
            )}
            <Link to={`/${cleanDestination(settings.username.replace('@', ''))}`} className="text-[#00C48C] text-sm hover:underline mb-4 inline-block">
              {`localhost:3000/${cleanDestination(settings.username.replace('@', ''))}`}
            </Link>
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
          <div className="space-y-4 flex-1">
            <div>
              <button
                onClick={() => handleViewChange('trips')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'trips' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${view === 'trips' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} />
                  <span>Trips</span>
                </div>
                <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                  {itineraries.length}
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleViewChange('aiItineraries')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'aiItineraries' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 ${view === 'aiItineraries' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  <span>AI Itineraries</span>
                </div>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleViewChange('liked')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'liked' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${view === 'liked' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} />
                  <span>Liked Trips</span>
                </div>
                <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                  {likedTrips.length}
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleViewChange('upcoming')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'upcoming' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${view === 'upcoming' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} />
                  <span>Upcoming Trips</span>
                </div>
                <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                  {upcomingTrips.length}
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleViewChange('past')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'past' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${view === 'past' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} />
                  <span>Past Trips</span>
                </div>
                <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                  {pastTrips.length}
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleViewChange('countries')}
                className={`w-full flex items-center justify-between font-[600] font-['Inter_var'] p-2 rounded-lg transition-colors ${view === 'countries' ? 'bg-[#e5f8f3] text-[#13c892]' : 'text-[#1e293b] hover:bg-[#e5f8f3] hover:text-[#13c892]'}`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${view === 'countries' ? 'text-[#13c892]' : 'text-[#00C48C]'}`} />
                  <span>Countries</span>
                </div>
                <span className="bg-[#00C48C]/10 text-[#00C48C] px-2 py-0.5 rounded-full text-sm">
                  {Object.keys(countryStats).length}
                </span>
              </button>
            </div>
          </div>

          {/* Share Profile and Settings */}
          <div className="mt-auto pt-6 border-t border-gray-200 mb-8">
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#00C48C]" />
                <span>Share profile</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-2 text-[#1e293b] font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#00C48C]" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 text-gray-500 font-[600] font-['Inter_var'] p-2 rounded-lg hover:bg-[#e5f8f3] hover:text-[#13c892] transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#00C48C]" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - 80% width */}
        <div className="w-[80%] ml-[20%]">
          <div className="max-w-[1400px] px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {view === 'trips' ? (
                  <>
                    <Globe className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {selectedCountry ? `${countryStats[selectedCountry]?.count} trips in ${selectedCountry}` : `${itineraries.length} total trips`}
                    </h2>
                  </>
                ) : view === 'liked' ? (
                  <>
                    <Heart className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {likedTrips.length} liked trips
                    </h2>
                  </>
                ) : view === 'upcoming' ? (
                  <>
                    <Clock className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {upcomingTrips.length} upcoming trips
                    </h2>
                  </>
                ) : view === 'past' ? (
                  <>
                    <Calendar className="w-5 h-5 text-[#00C48C]" />
                    <h2 className="text-lg font-medium text-[#1e293b]">
                      {pastTrips.length} past trips
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(countryStats).map(([country, { count }]) => (
                  <div
                    key={country}
                    onClick={() => handleCountryClick(country)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getRandomImageForCountry(country)}
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
            ) : view === 'liked' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {likedTrips.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="relative h-48">
                        <img
                          src={getRandomImageForCountry(itinerary.country)}
                          alt={itinerary.trip_name}
                          className="w-full h-full object-cover"
                        />
                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTrip(itinerary.id);
                            }}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
                            title={copiedId === itinerary.id ? "Copied!" : "Copy itinerary"}
                          >
                            <Copy className="w-4 h-4 text-gray-700" strokeWidth={2} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlike(itinerary.id);
                            }}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
                            title="Unlike itinerary"
                          >
                            <Heart className="w-4 h-4 text-rose-500" fill="currentColor" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-gray-900 font-semibold mb-1">{itinerary.trip_name}</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {itinerary.duration} days in {itinerary.destinations.map(d => cleanDestination(d.destination)).join(', ')}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span>{formatStartTime(itinerary.start_date)}</span>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
                            <span>{likesData.counts[itinerary.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : view === 'aiItineraries' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-[#1e293b]">
                    AI-Generated Itineraries
                  </h2>
                  <button
                    onClick={() => navigate('/create-ai-itinerary')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate New Itinerary</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <div
                        onClick={() => navigate(`/view-ai-itinerary/${itinerary.id}`)}
                        className="cursor-pointer"
                      >
                        <div className="relative h-48">
                          <img
                            src={getRandomImageForCountry(itinerary.country)}
                            alt={itinerary.trip_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {itinerary.trip_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {itinerary.duration} days in {itinerary.country}
                          </p>
                          <div className="space-y-2">
                            {itinerary.generated_itinerary.destinations.slice(0, 2).map((dest: { name: string; nights: number }, index: number) => (
                              <div key={index} className="text-sm text-gray-500">
                                • {dest.name} ({dest.nights} nights)
                              </div>
                            ))}
                            {itinerary.generated_itinerary.destinations.length > 2 && (
                              <div className="text-sm text-gray-500">
                                +{itinerary.generated_itinerary.destinations.length - 2} more destinations
                              </div>
                            )}
                          </div>
                          <div className="mt-4 text-xs text-gray-400">
                            Generated {formatDate(itinerary.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Trip Grid
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {/* Create New Trip Card - Only show in main trips view */}
                  {(view === 'trips' || (view === 'countries' && selectedCountry)) && (
                    <div
                      onClick={() => navigate('/create-itinerary')}
                      className="cursor-pointer group"
                    >
                      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors h-48 flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium">Create New Trip</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trip Tiles */}
                  {(view === 'upcoming'
                    ? upcomingTrips
                    : view === 'past'
                      ? pastTrips
                      : selectedCountry
                        ? countryStats[selectedCountry]?.itineraries
                        : itineraries
                  ).map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="group relative overflow-hidden rounded-xl"
                    >
                      <div
                        onClick={() => navigate(`/viewmyitinerary/${itinerary.id}`)}
                        className="cursor-pointer"
                      >
                        <ItineraryTile
                          id={itinerary.id}
                          title={itinerary.trip_name}
                          description={`${itinerary.duration} days in ${itinerary.destinations
                            .map((d: { destination: string }) => cleanDestination(d.destination))
                            .join(', ')}`}
                          imageUrl={getRandomImageForCountry(itinerary.country)}
                          duration={itinerary.duration}
                          cities={itinerary.destinations.map((d: { destination: string }) => cleanDestination(d.destination))}
                          createdAt={itinerary.created_at}
                          loading="lazy"
                          showLike={false}
                        />
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span>{formatStartTime(itinerary.start_date)}</span>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
                            <span>{likesData.counts[itinerary.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/create-itinerary?id=${itinerary.id}`);
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
                          title="Edit itinerary"
                        >
                          <Edit className="w-4 h-4 text-gray-700" strokeWidth={2} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(itinerary.id, e);
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
                          title="Delete itinerary"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
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
                        accept="image/jpeg,image/png,image/webp,image/gif"
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

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                      disabled={isUsernameSet}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent ${isUsernameSet ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {isUsernameSet && (
                      <div className="mt-1 text-xs text-gray-500">
                        Username cannot be changed once set
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={settings.full_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, full_name: e.target.value }))}
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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
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
                      accept="image/jpeg,image/png,image/webp,image/gif"
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

                {/* Website URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={settings.website_url || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://your-website.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                  />
                </div>

                {/* YouTube URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Channel
                  </label>
                  <input
                    type="url"
                    value={settings.youtube_url || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                  />
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Profile
                  </label>
                  <input
                    type="url"
                    value={settings.instagram_url || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/yourusername"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Save Button - Full Width */}
            <div className="mt-6">
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