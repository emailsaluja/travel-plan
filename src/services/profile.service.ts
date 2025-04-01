import { supabase } from '../lib/supabase';

export interface ProfileSettings {
    user_id: string;
    username: string;
    full_name: string;
    bio: string;
    measurement_system: 'metric' | 'imperial';
    privacy_setting: 'everyone' | 'approved_only';
    profile_picture_url?: string;
    hero_banner_url?: string;
    created_at?: string;
    updated_at?: string;
}

export class ProfileService {
    static async getProfile(userId?: string) {
        try {
            let profileUserId: string;
            if (userId) {
                profileUserId = userId;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error('User not authenticated');
                }
                profileUserId = user.id;
            }

            // Try to get existing profile
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', profileUserId)
                .single();

            // If profile exists, return it
            if (existingProfile) {
                return { data: existingProfile };
            }

            // If no profile exists, create one with default values
            const defaultProfile: ProfileSettings = {
                user_id: profileUserId,
                username: profileUserId.split('-')[0], // Use first part of UUID as default username
                full_name: '',
                bio: '',
                measurement_system: 'metric',
                privacy_setting: 'approved_only',
                profile_picture_url: '',
                hero_banner_url: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert([defaultProfile])
                .select()
                .single();

            if (insertError) throw insertError;
            return { data: newProfile };
        } catch (error) {
            console.error('Error fetching/creating profile:', error);
            throw error;
        }
    }

    static async updateProfile(settings: Partial<ProfileSettings>, userId?: string) {
        try {
            // If userId is not provided, get it from the current session
            let profileUserId: string;
            if (userId) {
                profileUserId = userId;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error('User not authenticated');
                }
                profileUserId = user.id;
            }

            // If updating username, check if it's unique
            if (settings.username) {
                const { count, error: checkError } = await supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('username', settings.username)
                    .neq('user_id', profileUserId);

                if (checkError) {
                    throw checkError;
                }

                if (count && count > 0) {
                    throw new Error('Username is already taken');
                }
            }

            // Get existing profile
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', profileUserId)
                .single();

            // Prepare the data to save
            const dataToSave = {
                user_id: profileUserId,
                ...existingProfile, // Keep existing data
                ...settings, // Override with new settings
                updated_at: new Date().toISOString()
            };

            // Update or insert the profile
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert(dataToSave)
                .select('*')
                .single();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    static async deleteAccount() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Delete user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', user.id);

            if (profileError) throw profileError;

            // Delete user account
            const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

            if (authError) throw authError;

            return { success: true };
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }
} 