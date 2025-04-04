import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/profile';

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

            // Try to get existing profile using maybeSingle() instead of single()
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', profileUserId)
                .maybeSingle();

            if (fetchError) throw fetchError;

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

    static async updateProfile(userId: string, data: Partial<UserProfile>) {
        try {
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existingProfile) {
                // Update existing profile
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('user_profiles')
                    .update(data)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return updatedProfile;
            } else {
                // Create new profile
                const { data: newProfile, error: insertError } = await supabase
                    .from('user_profiles')
                    .insert([{ user_id: userId, ...data }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                return newProfile;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    static async uploadProfilePicture(userId: string, file: File) {
        try {
            // Upload the file to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `profile-pictures/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            // Update the profile with the new picture URL
            const { data: profile, error: updateError } = await supabase
                .from('user_profiles')
                .update({ profile_picture_url: publicUrl })
                .eq('user_id', userId)
                .select()
                .single();

            if (updateError) throw updateError;
            return profile;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
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

    static async checkUsernameAvailability(username: string, currentUserId: string) {
        try {
            // First check if username exists at all
            const { data, error } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('username', username);

            if (error) throw error;

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
            console.error('Error checking username availability:', error);
            throw error;
        }
    }
} 