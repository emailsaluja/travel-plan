import { supabase } from '../lib/supabase';

export interface UserSettings {
    user_id: string;
    username: string;
    bio: string;
    profile_picture_url?: string;
    hero_banner_url?: string;
    updated_at?: string;
}

export const UserSettingsService = {
    async getUserSettings(userId: string): Promise<UserSettings | null> {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return {
                    user_id: userId,
                    username: '@user',
                    bio: '',
                    profile_picture_url: '',
                    hero_banner_url: '',
                };
            }

            return data;
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return null;
        }
    },

    async uploadProfilePicture(file: File, userId: string): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/profile-picture.${fileExt}`;

            console.log('Attempting to upload file:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

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
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/hero-banner.${fileExt}`;

            console.log('Attempting to upload hero banner:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

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
            // First check if settings exist
            const { data: existingSettings } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            const settingsToSave = {
                user_id: userId,
                username: settings.username,
                bio: settings.bio,
                profile_picture_url: settings.profile_picture_url,
                hero_banner_url: settings.hero_banner_url,
                updated_at: new Date().toISOString()
            };

            let error;
            if (existingSettings) {
                // Update existing settings
                const { error: updateError } = await supabase
                    .from('user_settings')
                    .update(settingsToSave)
                    .eq('user_id', userId);
                error = updateError;
            } else {
                // Insert new settings
                const { error: insertError } = await supabase
                    .from('user_settings')
                    .insert([settingsToSave]);
                error = insertError;
            }

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }
}; 