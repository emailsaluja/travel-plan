import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
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
  Sparkles,
  ShoppingBag,
  Star,
  MessageCircle,
  Search,
  Pencil,
  Trash
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
import { PaymentService, PurchasedItinerary } from '../services/payment.service';

interface Itinerary {
  id: string;
  trip_name: string;
  country: string;
  start_date: string;
  duration: number;
  passengers: number;
  created_at: string;
  status?: 'draft' | 'published';
  destinations: {
    destination: string;
    nights: number;
  }[];
  likesCount?: number;
  cover_image?: string;
}

interface PremiumItinerary {
  id: string;
  user_id: string;
  base_itinerary_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  terms_and_conditions: string;
  cancellation_policy: string;
  featured_image_url: string;
  gallery_image_urls: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  country: string;
  duration: number;
  purchase_date?: string;
}

interface UserSettings {
  user_id: string;
  username: string;
  full_name: string;
  bio: string;
  profile_picture_url: string;
  hero_banner_url: string;
  website_url: string;
  youtube_url: string;
  instagram_url: string;
  updated_at?: string;
}

interface LikesData {
  counts: { [key: string]: number };
  userLikes: Set<string>;
  error: string | null;
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

interface DataCache {
  itineraries: Itinerary[];
  likedTrips: Itinerary[];
  premiumItineraries: PremiumItinerary[];
  userSettings: UserSettings | null;
  lastFetch: number;
}

type DashboardView =
  | 'overview'
  | 'trips'
  | 'countries'
  | 'upcoming'
  | 'past'
  | 'liked'
  | 'aiItineraries'
  | 'premium'
  | 'purchases'
  | 'sales';

const Dashboard = () => {
  const { userEmail, user, signOut } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const username = '@amandeepsingh';
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[] | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'draft' | 'completed'>('all');
  const [premiumItineraries, setPremiumItineraries] = useState<PremiumItinerary[]>([]);
  const [purchasedItineraries, setPurchasedItineraries] = useState<PurchasedItinerary[]>([]);
  const [soldItineraries, setSoldItineraries] = useState<PremiumItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<DashboardView>('overview');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryImages, setCountryImages] = useState<Record<string, string[]>>({});
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('');
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
  const dataCache = useRef<DataCache>({
    itineraries: [],
    likedTrips: [],
    premiumItineraries: [],
    userSettings: null,
    lastFetch: 0
  });

  const [likesData, setLikesData] = useState<LikesData>({
    counts: {},
    userLikes: new Set(),
    error: null
  });

  const [aiItineraries, setAiItineraries] = useState<SavedAIItinerary[]>([]);

  const stats = {
    followers: 0,
    following: 0,
    countries: 9
  };

  const paymentService = new PaymentService();

  const location = useLocation();

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    if (weeks > 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    return 'Just now';
  };

  // Move getPastTrips function before it's used
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
        return startDateB.getTime() - startDateA.getTime();
      });
  };

  const [recentActivities, setRecentActivities] = useState<Array<{
    type: 'completed' | 'saved' | 'published' | 'commented';
    title: string;
    entityId: string;
    timestamp: string;
    icon: React.ReactNode;
  }>>([]);

  const loadRecentActivities = useCallback(async () => {
    if (!userId) return;

    const activities: Array<{
      type: 'completed' | 'saved' | 'published' | 'commented';
      title: string;
      entityId: string;
      timestamp: string;
      icon: React.ReactNode;
    }> = [];

    // Get completed trips (past trips)
    const pastTrips = getPastTrips().slice(0, 3);
    for (const trip of pastTrips) {
      activities.push({
        type: 'completed',
        title: `You completed ${trip.trip_name}`,
        entityId: trip.id,
        timestamp: trip.start_date,
        icon: <Star className="w-3.5 h-3.5 text-amber-500" />
      });
    }

    // Get liked trips
    const recentLikes = likedTrips.slice(0, 3);
    for (const trip of recentLikes) {
      activities.push({
        type: 'saved',
        title: `You saved ${trip.trip_name} in ${trip.country}`,
        entityId: trip.id,
        timestamp: trip.created_at,
        icon: <Heart className="w-3.5 h-3.5 text-purple-500" />
      });
    }

    // Get AI generated itineraries
    for (const itinerary of aiItineraries.slice(0, 3)) {
      activities.push({
        type: 'published',
        title: `You published ${itinerary.trip_name}`,
        entityId: itinerary.id,
        timestamp: itinerary.created_at,
        icon: (
          <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )
      });
    }

    // Sort by timestamp, most recent first
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setRecentActivities(activities.slice(0, 4)); // Keep only the 4 most recent activities
  }, [userId, likedTrips, aiItineraries]);

  useEffect(() => {
    loadRecentActivities();
  }, [loadRecentActivities]);

  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      if (!forceRefresh && dataCache.current.lastFetch && now - dataCache.current.lastFetch < 60000) {
        if (dataCache.current.itineraries) setItineraries(dataCache.current.itineraries);
        if (dataCache.current.likedTrips) setLikedTrips(dataCache.current.likedTrips);
        if (dataCache.current.userSettings) {
          setSettings(dataCache.current.userSettings);
          setIsUsernameSet(!!dataCache.current.userSettings.username && dataCache.current.userSettings.username !== '@user');
          if (dataCache.current.userSettings.profile_picture_url) {
            setProfilePicturePreview(dataCache.current.userSettings.profile_picture_url);
          }
          if (dataCache.current.userSettings.hero_banner_url) {
            setHeroBannerPreview(dataCache.current.userSettings.hero_banner_url);
          }
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      setUserId(user.id);

      // Load purchased itineraries
      const purchasedItineraries = await paymentService.getPurchasedItineraries(user.id);
      setPurchasedItineraries(purchasedItineraries);

      // Load sold itineraries
      const { data: soldData } = await supabase
        .from('premium_itinerary_purchases')
        .select(`
          premium_itineraries!inner (
            id,
            title,
            description,
            price,
            currency,
            duration,
            featured_image_url,
            country,
            base_itinerary_id,
            user_id
          ),
          purchase_date
        `)
        .eq('premium_itineraries.user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (soldData) {
        const soldItineraries = soldData
          .filter((sale: any) => sale.premium_itineraries !== null)
          .map((sale: any) => ({
            ...sale.premium_itineraries,
            purchase_date: sale.purchase_date
          }));
        setSoldItineraries(soldItineraries);
      }

      const { data: itinerariesData } = await supabase
        .from('user_itineraries')
        .select(`
          *,
          destinations:user_itinerary_destinations(
            destination,
            nights
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itinerariesData) {
        setItineraries(itinerariesData);
        dataCache.current.itineraries = itinerariesData;
      }

      const { data: premiumData } = await supabase
        .from('premium_itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (premiumData) {
        setPremiumItineraries(premiumData);
        dataCache.current.premiumItineraries = premiumData;
      }

      await loadUserSettings(user.id);

      dataCache.current.lastFetch = now;

      await loadAIItineraries();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setIsDataLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      loadUserSettings(user.id);
    }
  }, [user]);

  const loadUserSettings = async (userId: string) => {
    try {
      const userSettings = await UserSettingsService.getUserSettings(userId);
      if (userSettings) {
        setSettings(userSettings);
        setOriginalSettings(userSettings);
        setIsUsernameSet(!!userSettings.username && userSettings.username !== '@user');
        if (userSettings.profile_picture_url) {
          setProfilePicturePreview(userSettings.profile_picture_url);
        }
        if (userSettings.hero_banner_url) {
          setHeroBannerPreview(userSettings.hero_banner_url);
        }
        dataCache.current.userSettings = userSettings;
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      setError('Failed to load user settings');
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const loadItineraries = () => loadAllData(true);

  const loadLikedTrips = () => loadAllData(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'aiItineraries') {
      setView('aiItineraries');
    }
  }, []);

  const handleViewChange = (newView: DashboardView) => {
    setView(newView);
    setSelectedCountry(null);

    if (newView === 'liked') {
      window.location.hash = 'liked';
    } else if (window.location.hash === '#liked') {
      window.location.hash = '';
    }

    const params = new URLSearchParams(window.location.search);
    if (newView === 'aiItineraries') {
      params.set('tab', 'aiItineraries');
    } else {
      params.delete('tab');
    }
    window.history.pushState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleUnlike = async (id: string) => {
    try {
      await LikesService.unlikeItinerary(id);

      setLikedTrips(prev => prev.filter(trip => trip.id !== id));

      setLikesData(prev => {
        const newUserLikes = new Set(Array.from(prev.userLikes));
        newUserLikes.delete(id);

        return {
          counts: {
            ...prev.counts,
            [id]: Math.max(0, (prev.counts[id] || 1) - 1)
          },
          userLikes: newUserLikes,
          error: null
        };
      });

      const { counts, userLikes } = await LikesService.getAllLikesData();
      if (counts && userLikes) {
        setLikesData({
          counts: counts as Record<string, number>,
          userLikes: userLikes as Set<string>,
          error: null
        });
      }
    } catch (error) {
      console.error('Error unliking itinerary:', error);
    }
  };

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

  useEffect(() => {
    const fetchCountryImages = async () => {
      try {
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

  useEffect(() => {
    if (window.location.hash === '#liked') {
      setView('liked');
    }

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
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture must be less than 2MB');
      return;
    }

    console.log('Selected profile picture:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setProfilePictureFile(file);

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
    if (file.size > 5 * 1024 * 1024) {
      alert('Hero banner must be less than 5MB');
      return;
    }

    console.log('Selected hero banner:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setHeroBannerFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setHeroBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const checkUsernameUniqueness = async (username: string, currentUserId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', username);

      if (error) {
        console.error('Error checking username uniqueness:', error);
        return false;
      }

      if (!data || data.length === 0) {
        return true;
      }

      if (data.length === 1 && data[0].user_id === currentUserId) {
        return true;
      }

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

      if (settings.username !== originalSettings.username) {
        const isUnique = await checkUsernameUniqueness(settings.username, settings.user_id);
        if (!isUnique) {
          setError('This username is already taken. Please choose another one.');
          setIsSaving(false);
          return;
        }
      }

      let profilePictureUrl = settings.profile_picture_url;
      let heroBannerUrl = settings.hero_banner_url;

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

      setProfilePictureFile(null);
      setHeroBannerFile(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

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

  const pastTrips = getPastTrips();

  const handleCopyTrip = async (id: string) => {
    try {
      await UserItineraryService.copyItinerary(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      await loadItineraries();
    } catch (error) {
      console.error('Error copying itinerary:', error);
    }
  };

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

  const loadAIItineraries = async () => {
    try {
      const itineraries = await aiItineraryService.getItineraries();
      setAiItineraries(itineraries);
    } catch (error) {
      console.error('Error loading AI itineraries:', error);
    }
  };

  const handleEditPremiumItinerary = (id: string) => {
    navigate(`/create-premium-itinerary/${id}`);
  };

  const handleLike = async (itineraryId: string) => {
    try {
      const newUserLikes = new Set(likesData.userLikes);
      const isLiked = newUserLikes.has(itineraryId);
      const newCount = likesData.counts[itineraryId] + (isLiked ? -1 : 1);

      if (isLiked) {
        newUserLikes.delete(itineraryId);
        await LikesService.unlikeItinerary(itineraryId);
      } else {
        newUserLikes.add(itineraryId);
        await LikesService.likeItinerary(itineraryId);
      }

      setLikesData(prev => ({
        counts: {
          ...prev.counts,
          [itineraryId]: newCount
        },
        userLikes: newUserLikes,
        error: null
      }));
    } catch (error) {
      console.error('Error updating like:', error);
      setLikesData(prev => ({
        ...prev,
        error: 'Failed to update like'
      }));
    }
  };

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

    // Set the view to purchases if specified in location state
    if (location.state?.defaultView === 'purchases') {
      setView('purchases');
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      <TopNavigation />

      <div className="flex min-h-screen pt-[60px]">
        <div className="w-[20%] bg-white border-r border-gray-200 fixed left-0 top-[60px] bottom-0 flex flex-col overflow-hidden">
          <div className="h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="px-6">
              <div className="py-8">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-[#00C48C] to-[#00B380] mb-4 shadow-md">
                  <img
                    src={settings.profile_picture_url || '/images/profile-icon.svg'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                {settings.full_name && (
                  <p className="text-[#1e293b] text-[15px] font-medium mb-1">{settings.full_name}</p>
                )}
                <Link to={`/${cleanDestination(settings.username.replace('@', ''))}`} className="text-[#64748b] text-[13px] hover:text-[#00C48C] mb-4 inline-block">
                  {`localhost:3000/${cleanDestination(settings.username.replace('@', ''))}`}
                </Link>
                {settings.bio && <p className="text-[13px] text-[#64748b] mb-4">{settings.bio}</p>}

                <div className="space-y-1 pr-2">
                  <button
                    onClick={() => handleViewChange('overview')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'overview' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3zM14 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6z" />
                    </svg>
                    <span className="text-[14px] font-medium">Overview</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('trips')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${view === 'trips' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-[18px] h-[18px]" />
                      <span className="text-[14px] font-medium">Trips</span>
                    </div>
                    <span className="bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded text-[13px]">
                      {itineraries.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleViewChange('purchases')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'purchases' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <ShoppingBag className="w-[18px] h-[18px]" />
                    <span className="text-[14px] font-medium">Purchases</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('aiItineraries')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'aiItineraries' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    <span className="text-[14px] font-medium">AI Itineraries</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('premium')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'premium' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <Star className="w-[18px] h-[18px]" />
                    <span className="text-[14px] font-medium">Premium Itineraries</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('sales')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'sales' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[14px] font-medium">Sales & Earnings</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('liked')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${view === 'liked' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-[18px] h-[18px]" />
                      <span className="text-[14px] font-medium">Liked Trips</span>
                    </div>
                    <span className="bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded text-[13px]">
                      {likedTrips.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleViewChange('countries')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${view === 'countries' ? 'bg-[#00C48C] bg-opacity-10 text-[#00C48C]' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-[18px] h-[18px]" />
                      <span className="text-[14px] font-medium">Countries</span>
                    </div>
                    <span className="bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded text-[13px]">
                      {Object.keys(countryStats).length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-auto px-6 py-6 border-t border-[#f1f5f9]">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors">
                  <Share2 className="w-[18px] h-[18px]" />
                  <span className="text-[14px] font-medium">Share profile</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors"
                >
                  <Settings className="w-[18px] h-[18px]" />
                  <span className="text-[14px] font-medium">Settings</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span className="text-[14px] font-medium">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[80%] ml-[20%]">
          <div className="max-w-[1400px] px-8 py-8">
            {showThankYou && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{thankYouMessage}</span>
                </div>
                <button onClick={() => setShowThankYou(false)} className="text-green-700 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
            ) : view === 'overview' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-semibold text-[#1e293b] mb-1">Welcome back, {settings.full_name || 'User'}</h1>
                    <p className="text-[#64748b] text-sm">Here's what's happening with your travel journey</p>
                  </div>
                  <button
                    onClick={() => navigate('/create-itinerary')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Journey</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Countries Visited</h3>
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">{Object.keys(countryStats).length}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Itineraries Created</h3>
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <Star className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">{itineraries.length}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Articles Published</h3>
                      <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">{aiItineraries.length}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Saved Places</h3>
                      <div className="p-1.5 bg-rose-50 rounded-lg">
                        <Heart className="w-4 h-4 text-rose-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">{likedTrips.length}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-[#1e293b] text-sm font-semibold">Quick Actions</h2>
                      <p className="text-[#64748b] text-xs">Get started with these common tasks</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <button
                      onClick={() => navigate('/create-itinerary')}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[#1e293b] font-medium text-[11px] text-center leading-tight">Create New Itinerary</span>
                    </button>

                    <button
                      onClick={() => navigate('/schedule-trip')}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[#1e293b] font-medium text-[11px] text-center leading-tight">Schedule a Trip</span>
                    </button>

                    <button
                      onClick={() => navigate('/write-article')}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <span className="text-[#1e293b] font-medium text-[11px] text-center leading-tight">Write an Article</span>
                    </button>

                    <button
                      onClick={() => navigate('/save-place')}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[#1e293b] font-medium text-[11px] text-center leading-tight">Save a Place</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[#1e293b] text-base font-semibold">Upcoming Trips</h2>
                      <button
                        onClick={() => handleViewChange('upcoming')}
                        className="text-[#00C48C] text-xs hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <p className="text-[#64748b] text-xs mb-4">Your scheduled adventures</p>

                    <div className="space-y-3">
                      {upcomingTrips.slice(0, 2).map((trip) => (
                        <div
                          key={trip.id}
                          onClick={() => navigate(`/viewmyitinerary/${trip.id}`)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img
                              src={getRandomImageForCountry(trip.country)}
                              alt={trip.trip_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h3 className="text-[#1e293b] text-sm font-medium mb-1">{trip.trip_name}</h3>
                            <div className="flex items-center text-xs text-[#64748b]">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              {formatDate(trip.start_date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[#1e293b] text-base font-semibold">Recent Activity</h2>
                      <button className="text-[#00C48C] text-xs hover:underline">See all</button>
                    </div>
                    <p className="text-[#64748b] text-xs mb-4">Your latest travel updates</p>

                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'completed' ? 'bg-amber-50' :
                            activity.type === 'saved' ? 'bg-purple-50' :
                              activity.type === 'published' ? 'bg-emerald-50' :
                                'bg-blue-50'
                            }`}>
                            {activity.icon}
                          </div>
                          <div>
                            <p className="text-[#1e293b] text-sm font-medium">
                              {activity.title}
                            </p>
                            <p className="text-[#64748b] text-xs">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {recentActivities.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-[#64748b] text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[#1e293b] text-base font-semibold">Recent Purchases</h2>
                      <button
                        onClick={() => handleViewChange('purchases')}
                        className="text-[#00C48C] text-xs hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <p className="text-[#64748b] text-sm mb-6">Your recently purchased itineraries</p>

                    <div className="space-y-4">
                      {purchasedItineraries.slice(0, 2).map((itinerary) => (
                        <div
                          key={itinerary.id}
                          onClick={() => navigate(`/viewmyitinerary/${itinerary.base_itinerary_id}`)}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <img
                              src={itinerary.featured_image_url || getRandomImageForCountry(itinerary.country)}
                              alt={itinerary.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h3 className="text-[#1e293b] font-medium mb-1">{itinerary.title}</h3>
                            <div className="flex items-center text-sm text-[#64748b]">
                              <Calendar className="w-4 h-4 mr-1" />
                              {itinerary.purchase_date ? formatDate(itinerary.purchase_date) : formatDate(itinerary.created_at)}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[#00C48C] text-sm font-medium">{itinerary.currency} {itinerary.price}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-[#64748b] text-sm">{itinerary.duration} days</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {purchasedItineraries.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No purchases yet</p>
                          <button
                            onClick={() => navigate('/discover')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00C48C] hover:bg-[#00B380]"
                          >
                            Discover Itineraries
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[#1e293b] text-base font-semibold">Recently Sold</h2>
                      <button
                        onClick={() => handleViewChange('premium')}
                        className="text-[#00C48C] text-xs hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <p className="text-[#64748b] text-sm mb-6">Your recently sold premium itineraries</p>

                    <div className="space-y-4">
                      {soldItineraries.slice(0, 2).map((itinerary: PremiumItinerary) => (
                        <div
                          key={itinerary.id}
                          onClick={() => navigate(`/premium-itinerary/${itinerary.id}`)}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <img
                              src={itinerary.featured_image_url || getRandomImageForCountry(itinerary.country)}
                              alt={itinerary.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h3 className="text-[#1e293b] font-medium mb-1">{itinerary.title}</h3>
                            <div className="flex items-center text-sm text-[#64748b]">
                              <Calendar className="w-4 h-4 mr-1" />
                              {itinerary.purchase_date ? formatDate(itinerary.purchase_date) : 'Recently sold'}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[#00C48C] text-sm font-medium">{itinerary.currency} {itinerary.price}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-[#64748b] text-sm">{itinerary.duration} days</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {soldItineraries.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No sales yet</p>
                          <button
                            onClick={() => navigate('/create-premium-itinerary')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00C48C] hover:bg-[#00B380]"
                          >
                            Create Premium Itinerary
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : view === 'countries' && !selectedCountry ? (
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
                              handleLike(itinerary.id);
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
            ) : view === 'premium' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-[#1e293b]">
                    Premium Itineraries
                  </h2>
                  <button
                    onClick={() => navigate('/create-premium-itinerary')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Premium Itinerary</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="relative h-64">
                        <img
                          src={itinerary.featured_image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop'}
                          alt={itinerary.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <div className="flex items-center gap-1.5 text-white/90 text-[15px] mb-1.5">
                            <MapPin className="w-[18px] h-[18px]" />
                            {itinerary.country}
                          </div>
                          <h3 className="text-[22px] font-medium text-white leading-tight">
                            {itinerary.title}
                          </h3>
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1.5 bg-[#EAB308] text-white text-[13px] font-medium rounded-full">
                            {itinerary.currency} {itinerary.price}
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-[15px] text-gray-600 mb-4 line-clamp-2">
                          {itinerary.description}
                        </p>
                        <div className="flex items-center gap-2 text-[15px] text-gray-500 mb-4">
                          <Calendar className="w-[18px] h-[18px] text-[#00C48C]" />
                          {itinerary.duration} days
                        </div>
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => navigate(`/premium-itinerary/${itinerary.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#00C48C] text-white rounded-lg hover:bg-[#00B380] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleEditPremiumItinerary(itinerary.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : view === 'sales' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-[#1e293b]">Sales & Earnings</h2>
                    <p className="text-sm text-gray-500">Track your premium itinerary sales and revenue</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Total Sales</h3>
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">{soldItineraries.length}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Total Revenue</h3>
                      <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">
                      {soldItineraries.reduce((total, sale) => total + sale.price, 0).toLocaleString('en-US', {
                        style: 'currency',
                        currency: soldItineraries[0]?.currency || 'USD'
                      })}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">Avg. Price</h3>
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">
                      {soldItineraries.length > 0
                        ? (soldItineraries.reduce((total, sale) => total + sale.price, 0) / soldItineraries.length).toLocaleString('en-US', {
                          style: 'currency',
                          currency: soldItineraries[0]?.currency || 'USD'
                        })
                        : '-'
                      }
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#64748b] text-sm">This Month</h3>
                      <div className="p-1.5 bg-purple-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-[#1e293b]">
                      {(() => {
                        const now = new Date();
                        const thisMonth = soldItineraries.filter(sale => {
                          if (!sale.purchase_date) return false;
                          const saleDate = new Date(sale.purchase_date);
                          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
                        });
                        return thisMonth.reduce((total, sale) => total + sale.price, 0).toLocaleString('en-US', {
                          style: 'currency',
                          currency: soldItineraries[0]?.currency || 'USD'
                        });
                      })()}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-[#1e293b] font-medium">Sales History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Itinerary</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Price</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Country</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Duration</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {soldItineraries.map((sale) => (
                          <tr key={sale.id} className="border-b border-gray-100">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden">
                                  <img
                                    src={sale.featured_image_url || getRandomImageForCountry(sale.country)}
                                    alt={sale.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{sale.title}</h4>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-gray-500">
                                {sale.purchase_date ? formatDate(sale.purchase_date) : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm font-medium text-[#00C48C]">
                                {sale.currency} {sale.price}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-gray-500">{sale.country}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-gray-500">{sale.duration} days</span>
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => navigate(`/premium-itinerary/${sale.id}`)}
                                className="text-[#00C48C] text-sm font-medium hover:text-[#00B380]"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                        {soldItineraries.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              <p className="mb-4">No sales yet</p>
                              <button
                                onClick={() => navigate('/create-premium-itinerary')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00C48C] hover:bg-[#00B380]"
                              >
                                Create Premium Itinerary
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : view === 'trips' || (view === 'countries' && selectedCountry) ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-2xl">
                    <input
                      type="text"
                      placeholder="Search itineraries..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const filtered = itineraries.filter(itinerary =>
                          itinerary.trip_name.toLowerCase().includes(searchTerm)
                        );
                        setFilteredItineraries(filtered);
                      }}
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2.5 text-[15px] font-medium ${activeTab === 'all' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2.5 text-[15px] font-medium ${activeTab === 'upcoming' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActiveTab('draft')}
                    className={`px-4 py-2.5 text-[15px] font-medium ${activeTab === 'draft' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Drafts
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2.5 text-[15px] font-medium ${activeTab === 'completed' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Completed
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let displayItineraries = filteredItineraries || itineraries;

                    // Filter based on active tab
                    if (activeTab !== 'all') {
                      displayItineraries = displayItineraries.filter(itinerary => {
                        const startDate = new Date(itinerary.start_date);
                        startDate.setHours(0, 0, 0, 0);

                        switch (activeTab) {
                          case 'upcoming':
                            return startDate > today;
                          case 'completed':
                            return startDate <= today;
                          case 'draft':
                            return itinerary.status === 'draft';
                          default:
                            return true;
                        }
                      });
                    }

                    return displayItineraries.map((itinerary) => (
                      <div key={itinerary.id} className="flex bg-white rounded-xl overflow-hidden border border-gray-100">
                        <div className="w-[200px] h-[140px] bg-gray-100">
                          <img
                            src={getRandomImageForCountry(itinerary.country)}
                            alt={itinerary.trip_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="w-[14px] h-[14px] text-gray-500" />
                            <span className="text-[13px] text-gray-600">{itinerary.country}</span>
                          </div>
                          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{itinerary.trip_name}</h3>
                          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-[14px] h-[14px]" />
                              <span>{formatDate(itinerary.start_date)}</span>
                            </div>
                            <span className="mx-1.5">•</span>
                            <span>{itinerary.duration} days</span>
                          </div>
                          <div className="mt-3">
                            {(() => {
                              const startDate = new Date(itinerary.start_date);
                              const today = new Date();
                              const isCompleted = startDate <= today;
                              const isDraft = itinerary.status === 'draft';

                              if (isDraft) {
                                return (
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[12px] font-medium bg-gray-50 text-gray-600">
                                    Draft
                                  </span>
                                );
                              }

                              return (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[12px] font-medium ${isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                  {isCompleted ? 'Completed' : 'Upcoming'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-2">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(itinerary.id, e);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/create-itinerary?id=${itinerary.id}`);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
              <div className="space-y-6">
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

              <div className="space-y-6">
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