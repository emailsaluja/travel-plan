import { supabase } from '../lib/supabase';
import { ProfileService, ProfileSettings } from './profile.service';
import { CacheService } from './cache.service';

export interface UserSettings {
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

interface UserSettingsCache {
    data: UserSettings;
    timestamp: number;
}

interface GlobalCache {
    users: Record<string, UserSettings>;
    timestamp: number;
}

// Memory cache for faster access
const memoryCache = new Map<string, UserSettingsCache>();
const usernameCache = new Map<string, { isUnique: boolean; timestamp: number }>();

// Increased cache durations
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const USERNAME_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const GLOBAL_CACHE_KEY = 'global_user_settings';
const GLOBAL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let lastGlobalFetch = 0;
let isFetchingGlobal = false;

export class UserSettingsService {
    private static async fetchAllUsers(): Promise<Record<string, UserSettings>> {
        if (isFetchingGlobal) {
            // Wait for existing fetch to complete
            while (isFetchingGlobal) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return CacheService.get<GlobalCache>(GLOBAL_CACHE_KEY)?.users || {};
        }

        isFetchingGlobal = true;
        try {
            // Try to get from global cache first
            const globalCache = CacheService.get<GlobalCache>(GLOBAL_CACHE_KEY);
            if (globalCache && (Date.now() - globalCache.timestamp < GLOBAL_CACHE_DURATION)) {
                return globalCache.users;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*');

            if (error) throw error;

            const users: Record<string, UserSettings> = {};
            (data || []).forEach(user => {
                users[user.user_id] = user;
                // Update individual memory cache
                memoryCache.set(user.user_id, {
                    data: user,
                    timestamp: Date.now()
                });
            });

            // Update global cache
            CacheService.set(GLOBAL_CACHE_KEY, {
                users,
                timestamp: Date.now()
            }, GLOBAL_CACHE_DURATION);

            lastGlobalFetch = Date.now();
            return users;
        } catch (error) {
            console.error('Error fetching all users:', error);
            return {};
        } finally {
            isFetchingGlobal = false;
        }
    }

    private static async fetchAndCacheUserSettings(userId: string): Promise<UserSettings | null> {
        try {
            // If it's been a while since last global fetch, do a global fetch instead
            if (Date.now() - lastGlobalFetch > CACHE_DURATION) {
                const allUsers = await this.fetchAllUsers();
                return allUsers[userId] || null;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            if (data) {
                memoryCache.set(userId, {
                    data,
                    timestamp: Date.now()
                });
                CacheService.set(`user_settings_${userId}`, data, CACHE_DURATION);
            }

            return data;
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return null;
        }
    }

    static async getUserSettings(userId: string): Promise<UserSettings | null> {
        // Check memory cache first
        const cached = memoryCache.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        // Try global cache
        const globalCache = CacheService.get<GlobalCache>(GLOBAL_CACHE_KEY);
        if (globalCache && (Date.now() - globalCache.timestamp < GLOBAL_CACHE_DURATION)) {
            const userData = globalCache.users[userId];
            if (userData) {
                memoryCache.set(userId, {
                    data: userData,
                    timestamp: Date.now()
                });
                return userData;
            }
        }

        return this.fetchAndCacheUserSettings(userId);
    }

    static async getBatchUserSettings(userIds: string[]): Promise<Record<string, UserSettings>> {
        // Try to get all from global cache first
        const globalCache = CacheService.get<GlobalCache>(GLOBAL_CACHE_KEY);
        if (globalCache && (Date.now() - globalCache.timestamp < GLOBAL_CACHE_DURATION)) {
            const result: Record<string, UserSettings> = {};
            let allFound = true;

            userIds.forEach(userId => {
                if (globalCache.users[userId]) {
                    result[userId] = globalCache.users[userId];
                    // Update memory cache while we're at it
                    memoryCache.set(userId, {
                        data: globalCache.users[userId],
                        timestamp: Date.now()
                    });
                } else {
                    allFound = false;
                }
            });

            if (allFound) return result;
        }

        // If we don't have all users in cache, fetch all users
        const allUsers = await this.fetchAllUsers();
        return userIds.reduce((acc, userId) => {
            if (allUsers[userId]) {
                acc[userId] = allUsers[userId];
            }
            return acc;
        }, {} as Record<string, UserSettings>);
    }

    static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update(settings)
                .eq('user_id', userId);

            if (error) throw error;

            // Clear all caches
            memoryCache.delete(userId);
            CacheService.clear(`user_settings_${userId}`);
            CacheService.clear(GLOBAL_CACHE_KEY);
            lastGlobalFetch = 0;

            // Fetch and cache new settings
            await this.fetchAndCacheUserSettings(userId);

            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    static async checkUsernameUniqueness(username: string, currentUserId: string): Promise<boolean> {
        const cacheKey = `${username}_${currentUserId}`;
        const cached = usernameCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < USERNAME_CACHE_DURATION)) {
            return cached.isUnique;
        }

        try {
            // Try to use global cache first
            const globalCache = CacheService.get<GlobalCache>(GLOBAL_CACHE_KEY);
            if (globalCache && (Date.now() - globalCache.timestamp < GLOBAL_CACHE_DURATION)) {
                const existingUser = Object.values(globalCache.users).find(
                    user => user.username === username && user.user_id !== currentUserId
                );
                const isUnique = !existingUser;
                usernameCache.set(cacheKey, {
                    isUnique,
                    timestamp: Date.now()
                });
                return isUnique;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('username', username)
                .neq('user_id', currentUserId)
                .single();

            const isUnique = !data && error?.code === 'PGRST116';
            usernameCache.set(cacheKey, {
                isUnique,
                timestamp: Date.now()
            });

            return isUnique;
        } catch (error) {
            return false;
        }
    }

    async uploadProfilePicture(file: File, userId: string): Promise<string | null> {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/profile-picture.${fileExt}`;

            console.log('Attempting to upload file:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

            // Upload the file with its proper content type
            const { data, error: uploadError } = await supabase.storage
                .from('user-images')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Upload error details:', uploadError);
                throw uploadError;
            }

            console.log('Upload successful:', data);

            const { data: { publicUrl } } = supabase.storage
                .from('user-images')
                .getPublicUrl(fileName);

            console.log('Generated public URL:', publicUrl);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            return null;
        }
    }

    async uploadHeroBanner(file: File, userId: string): Promise<string | null> {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/hero-banner.${fileExt}`;

            console.log('Attempting to upload hero banner:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

            // Upload the file with its proper content type
            const { data, error: uploadError } = await supabase.storage
                .from('user-images')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Upload error details:', uploadError);
                throw uploadError;
            }

            console.log('Upload successful:', data);

            const { data: { publicUrl } } = supabase.storage
                .from('user-images')
                .getPublicUrl(fileName);

            console.log('Generated public URL:', publicUrl);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading hero banner:', error);
            return null;
        }
    }

    async saveUserSettings(settings: UserSettings, userId: string): Promise<boolean> {
        try {
            // Get existing profile
            const { data: existingProfile } = await ProfileService.getProfile(userId);

            // Update profile with new settings
            await ProfileService.updateProfile({
                user_id: userId,
                username: settings.username,
                full_name: settings.full_name,
                bio: settings.bio,
                profile_picture_url: settings.profile_picture_url,
                hero_banner_url: settings.hero_banner_url,
                website_url: settings.website_url,
                youtube_url: settings.youtube_url,
                instagram_url: settings.instagram_url,
                // Keep existing profile data
                measurement_system: existingProfile?.measurement_system || 'metric',
                privacy_setting: existingProfile?.privacy_setting || 'approved_only'
            }, userId);

            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }
} 