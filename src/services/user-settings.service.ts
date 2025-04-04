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
    }

    async uploadProfilePicture(file: File, userId: string): Promise<string | null> {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/profile-picture.${fileExt}`;
            const bucket = 'user-images';

            console.log('Attempting to upload file:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

            // Get the token for authorization
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Manually construct storage URL from the base URL
            const storageUrl = 'https://jotzzoyslukrscesyohn.supabase.co/storage/v1';

            // Create a promise to handle the XMLHttpRequest
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const url = `${storageUrl}/object/${bucket}/${fileName}`;

                xhr.open('POST', url, true);

                // Set headers
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('x-upsert', 'true');
                xhr.setRequestHeader('Content-Type', file.type);

                // Handle response
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log('Upload successful:', xhr.responseText);

                        // Get the public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(fileName);

                        console.log('Generated public URL:', publicUrl);
                        resolve(publicUrl);
                    } else {
                        console.error('Upload failed:', xhr.status, xhr.responseText);
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                    }
                };

                xhr.onerror = function () {
                    console.error('XHR error during upload');
                    reject(new Error('Network error during upload'));
                };

                // Send the file directly as binary data
                xhr.send(file);
            });
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
            const bucket = 'user-images';

            console.log('Attempting to upload hero banner:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

            // Get the token for authorization
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Manually construct storage URL from the base URL
            const storageUrl = 'https://jotzzoyslukrscesyohn.supabase.co/storage/v1';

            // Create a promise to handle the XMLHttpRequest
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const url = `${storageUrl}/object/${bucket}/${fileName}`;

                xhr.open('POST', url, true);

                // Set headers
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('x-upsert', 'true');
                xhr.setRequestHeader('Content-Type', file.type);

                // Handle response
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log('Upload successful:', xhr.responseText);

                        // Get the public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(fileName);

                        console.log('Generated public URL:', publicUrl);
                        resolve(publicUrl);
                    } else {
                        console.error('Upload failed:', xhr.status, xhr.responseText);
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                    }
                };

                xhr.onerror = function () {
                    console.error('XHR error during upload');
                    reject(new Error('Network error during upload'));
                };

                // Send the file directly as binary data
                xhr.send(file);
            });
        } catch (error) {
            console.error('Error uploading hero banner:', error);
            return null;
        }
    }

    async saveUserSettings(settings: UserSettings, userId: string): Promise<boolean> {
        try {
            // First get current settings to avoid overwriting fields not in the update
            const currentSettings = await UserSettingsService.getUserSettings(userId);

            // Create update object with all fields from settings
            const updateData = {
                username: settings.username,
                full_name: settings.full_name,
                bio: settings.bio,
                profile_picture_url: settings.profile_picture_url || (currentSettings?.profile_picture_url || null),
                hero_banner_url: settings.hero_banner_url || (currentSettings?.hero_banner_url || null),
                website_url: settings.website_url || '',
                youtube_url: settings.youtube_url || '',
                instagram_url: settings.instagram_url || '',
                updated_at: new Date().toISOString()
            };

            console.log('Updating user profile with data:', updateData);

            // Update the profile directly in user_profiles table
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Clear caches
            memoryCache.delete(userId);
            CacheService.clear(`user_settings_${userId}`);
            CacheService.clear(GLOBAL_CACHE_KEY);
            lastGlobalFetch = 0;

            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }
} 