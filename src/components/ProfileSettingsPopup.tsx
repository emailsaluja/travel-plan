import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProfileService, ProfileSettings } from '../services/profile.service';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileSettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileSettingsPopup: React.FC<ProfileSettingsPopupProps> = ({
    isOpen,
    onClose
}) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [settings, setSettings] = useState<ProfileSettings>({
        username: '',
        full_name: '',
        measurement_system: 'metric',
        privacy_setting: 'approved_only'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const { data } = await ProfileService.getProfile();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setError('Failed to load profile settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setError('');
            setIsSaving(true);
            await ProfileService.updateProfile(settings);
            onClose();
        } catch (error: any) {
            setError(error.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await ProfileService.deleteAccount();
                window.location.href = '/';
            } catch (error: any) {
                setError(error.message || 'Failed to delete account');
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            onClose();
            navigate('/signin');
        } catch (error) {
            setError('Failed to sign out');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-[#1B3A5B] text-2xl font-bold mb-8">Profile settings</h2>

                {error && (
                    <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Username */}
                    <div>
                        <label className="block text-[#1B3A5B] font-medium mb-2">Username</label>
                        <input
                            type="text"
                            value={settings.username}
                            onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C48C] focus:ring-1 focus:ring-[#00C48C] outline-none transition-colors"
                            placeholder="Choose a username"
                        />
                    </div>

                    {/* Your Name */}
                    <div>
                        <label className="block text-[#1B3A5B] font-medium mb-2">Your name</label>
                        <input
                            type="text"
                            value={settings.full_name}
                            onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C48C] focus:ring-1 focus:ring-[#00C48C] outline-none transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Measurement System */}
                    <div>
                        <label className="block text-[#1B3A5B] font-medium mb-2">Measurement System</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, measurement_system: 'metric' })}
                                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${settings.measurement_system === 'metric'
                                    ? 'border-[#00C48C] bg-[#00C48C]/10 text-[#00C48C]'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Metric (km)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, measurement_system: 'imperial' })}
                                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${settings.measurement_system === 'imperial'
                                    ? 'border-[#00C48C] bg-[#00C48C]/10 text-[#00C48C]'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Imperial (miles)
                            </button>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <label className="block text-[#1B3A5B] font-medium mb-2">Who can follow you?</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, privacy_setting: 'everyone' })}
                                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${settings.privacy_setting === 'everyone'
                                    ? 'border-[#00C48C] bg-[#00C48C]/10 text-[#00C48C]'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Everyone
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, privacy_setting: 'approved_only' })}
                                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${settings.privacy_setting === 'approved_only'
                                    ? 'border-[#00C48C] bg-[#00C48C]/10 text-[#00C48C]'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Only the people I approve
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="bg-[#00C48C] text-white px-6 py-3 rounded-full hover:bg-[#00B380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save settings'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            className="text-gray-400 hover:text-red-600 flex items-center gap-2"
                        >
                            <span className="text-sm">Delete my account</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 