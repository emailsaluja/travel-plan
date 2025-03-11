import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserSettingsService, UserSettings } from '../services/user-settings.service';
import { UserItineraryService } from '../services/user-itinerary.service';

interface Itinerary {
    id: string;
    user_email: string;
    trip_name: string;
    // ... other itinerary fields ...
}

const ViewItinerary = () => {
    const { id } = useParams();
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

    // Load itinerary data
    useEffect(() => {
        const loadItinerary = async () => {
            if (!id) return;

            try {
                const { data } = await UserItineraryService.getItineraryById(id);
                if (data) {
                    setItinerary(data);
                }
            } catch (error) {
                console.error('Error loading itinerary:', error);
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, [id]);

    // Load user settings
    useEffect(() => {
        const loadUserSettings = async () => {
            if (itinerary?.user_email) {
                const settings = await UserSettingsService.getUserSettings(itinerary.user_email);
                if (settings) {
                    setUserSettings(settings);
                }
            }
        };

        loadUserSettings();
    }, [itinerary?.user_email]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="max-w-[1400px] mx-auto px-4 py-6">
                {/* User Profile Section */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#00C48C] to-[#00B380]">
                        <img
                            src={userSettings?.profile_picture_url || '/images/profile-icon.svg'}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{userSettings?.username || 'User'}</h3>
                        {userSettings?.bio && <p className="text-sm text-gray-500">{userSettings.bio}</p>}
                    </div>
                </div>

                {/* Rest of your itinerary display code */}
            </div>
        </div>
    );
};

export default ViewItinerary; 