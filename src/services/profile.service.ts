import { supabase } from '../lib/supabase';

export interface ProfileSettings {
    username: string;
    full_name: string;
    measurement_system: 'metric' | 'imperial';
    privacy_setting: 'everyone' | 'approved_only';
}

export class ProfileService {
    static async getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Try to get existing profile
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // If profile exists, return it
            if (existingProfile) {
                return { data: existingProfile };
            }

            // If no profile exists, create one with default values
            const defaultProfile: ProfileSettings = {
                username: user.email?.split('@')[0] || '',
                full_name: '',
                measurement_system: 'metric',
                privacy_setting: 'approved_only'
            };

            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert([
                    {
                        user_id: user.id,
                        ...defaultProfile,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
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