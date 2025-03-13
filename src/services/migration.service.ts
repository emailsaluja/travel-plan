import { supabase } from '../lib/supabase';
import { ProfileService } from './profile.service';

export const MigrationService = {
    async migrateUserSettingsToProfiles() {
        try {
            // Get all user settings
            const { data: userSettings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*');

            if (settingsError) throw settingsError;

            // Migrate each user's settings to their profile
            for (const settings of userSettings || []) {
                try {
                    // Get existing profile or create new one
                    const { data: profile } = await ProfileService.getProfile(settings.user_id);

                    // Update profile with settings data
                    await ProfileService.updateProfile({
                        user_id: settings.user_id,
                        username: settings.username,
                        bio: settings.bio,
                        profile_picture_url: settings.profile_picture_url,
                        hero_banner_url: settings.hero_banner_url,
                        // Keep existing profile data
                        full_name: profile?.full_name || '',
                        measurement_system: profile?.measurement_system || 'metric',
                        privacy_setting: profile?.privacy_setting || 'approved_only'
                    }, settings.user_id);
                } catch (error) {
                    console.error(`Error migrating user ${settings.user_id}:`, error);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error during migration:', error);
            throw error;
        }
    }
}; 