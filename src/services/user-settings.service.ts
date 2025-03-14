import { supabase } from '../lib/supabase';
import { ProfileService, ProfileSettings } from './profile.service';

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

export const UserSettingsService = {
    async getUserSettings(userId: string): Promise<UserSettings | null> {
        try {
            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

            const { data: profile } = await ProfileService.getProfile(userId);

            if (!profile) {
                return {
                    user_id: userId,
                    username: '@user',
                    full_name: '',
                    bio: '',
                    profile_picture_url: '',
                    hero_banner_url: '',
                    website_url: '',
                    youtube_url: '',
                    instagram_url: '',
                };
            }

            return {
                user_id: profile.user_id,
                username: profile.username,
                full_name: profile.full_name,
                bio: profile.bio,
                profile_picture_url: profile.profile_picture_url,
                hero_banner_url: profile.hero_banner_url,
                website_url: profile.website_url,
                youtube_url: profile.youtube_url,
                instagram_url: profile.instagram_url,
                updated_at: profile.updated_at
            };
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return null;
        }
    },

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
    },

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
    },

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
}; 