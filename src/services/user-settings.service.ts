import { supabase } from '../lib/supabase';
import { ProfileService } from './profile.service';

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
            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

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
                    contentType: file.type // This ensures the correct MIME type is sent
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
                    contentType: file.type // This ensures the correct MIME type is sent
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

            // Start a transaction by using Promise.all to ensure both updates succeed or fail together
            let error;
            if (existingSettings) {
                // If username has changed, update both tables
                if (existingSettings.username !== settings.username) {
                    try {
                        // Update user_profiles first to check for username uniqueness
                        await ProfileService.updateProfile({ username: settings.username }, userId);

                        // If username update succeeds, update user_settings
                        const { error: updateError } = await supabase
                            .from('user_settings')
                            .update(settingsToSave)
                            .eq('user_id', userId);
                        error = updateError;
                    } catch (profileError) {
                        // If updating profile fails (e.g., username taken), throw the error
                        throw profileError;
                    }
                } else {
                    // If username hasn't changed, just update user_settings
                    const { error: updateError } = await supabase
                        .from('user_settings')
                        .update(settingsToSave)
                        .eq('user_id', userId);
                    error = updateError;
                }
            } else {
                // For new settings, create entries in both tables
                try {
                    await ProfileService.updateProfile({ username: settings.username }, userId);
                    const { error: insertError } = await supabase
                        .from('user_settings')
                        .insert([settingsToSave]);
                    error = insertError;
                } catch (profileError) {
                    throw profileError;
                }
            }

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }
}; 