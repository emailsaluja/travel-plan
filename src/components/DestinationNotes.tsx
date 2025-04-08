import React, { useState, useEffect } from 'react';
import { X, Youtube, Instagram } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface DestinationNotesProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    onSave: (notes: string, youtubeVideos: string[], youtubePlaylists: string[], instagramVideos: string[]) => void;
    initialNotes: string;
    initialYoutubeVideos?: string[];
    initialYoutubePlaylists?: string[];
    initialInstagramVideos?: string[];
    itineraryId: string;
    destinationIndex: number;
}

const DestinationNotes: React.FC<DestinationNotesProps> = ({
    isOpen,
    onClose,
    destination,
    onSave,
    initialNotes,
    initialYoutubeVideos = [],
    initialYoutubePlaylists = [],
    initialInstagramVideos = [],
    itineraryId,
    destinationIndex
}) => {
    const [notes, setNotes] = useState(initialNotes || '');
    const [youtubeVideos, setYoutubeVideos] = useState<string[]>(initialYoutubeVideos || []);
    const [youtubePlaylists, setYoutubePlaylists] = useState<string[]>(initialYoutubePlaylists || []);
    const [instagramVideos, setInstagramVideos] = useState<string[]>(initialInstagramVideos || []);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
    const [newInstagramUrl, setNewInstagramUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (notes !== (initialNotes || '')) {
                setNotes(initialNotes || '');
            }
            if (JSON.stringify(youtubeVideos) !== JSON.stringify(initialYoutubeVideos || [])) {
                setYoutubeVideos(initialYoutubeVideos || []);
            }
            if (JSON.stringify(youtubePlaylists) !== JSON.stringify(initialYoutubePlaylists || [])) {
                setYoutubePlaylists(initialYoutubePlaylists || []);
            }
            if (JSON.stringify(instagramVideos) !== JSON.stringify(initialInstagramVideos || [])) {
                setInstagramVideos(initialInstagramVideos || []);
            }
            setNewVideoUrl('');
            setNewPlaylistUrl('');
            setNewInstagramUrl('');
        }
    }, [isOpen]);

    const handleAddVideo = () => {
        if (newVideoUrl && !youtubeVideos.includes(newVideoUrl)) {
            setYoutubeVideos([...youtubeVideos, newVideoUrl]);
            setNewVideoUrl('');
        }
    };

    const handleAddPlaylist = () => {
        if (newPlaylistUrl && !youtubePlaylists.includes(newPlaylistUrl)) {
            setYoutubePlaylists([...youtubePlaylists, newPlaylistUrl]);
            setNewPlaylistUrl('');
        }
    };

    const handleAddInstagramVideo = () => {
        if (newInstagramUrl && !instagramVideos.includes(newInstagramUrl)) {
            setInstagramVideos([...instagramVideos, newInstagramUrl]);
            setNewInstagramUrl('');
        }
    };

    const handleRemoveVideo = (url: string) => {
        setYoutubeVideos(youtubeVideos.filter(v => v !== url));
    };

    const handleRemovePlaylist = (url: string) => {
        setYoutubePlaylists(youtubePlaylists.filter(p => p !== url));
    };

    const handleRemoveInstagramVideo = (url: string) => {
        setInstagramVideos(instagramVideos.filter(v => v !== url));
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            console.log('Saving overview for:', {
                itineraryId,
                destination,
                destinationIndex,
                notes,
                youtubeVideos,
                youtubePlaylists,
                instagramVideos
            });

            // First try to find the existing record
            const { data: existingData, error: findError } = await supabase
                .from('user_itinerary_destinations')
                .select('*')
                .eq('itinerary_id', itineraryId)
                .eq('destination', destination);

            if (findError) {
                console.error('Error finding destination record:', findError);
            }

            console.log('Existing data by destination:', existingData);

            // Try to find by order_index as a backup
            const { data: existingByIndex, error: indexError } = await supabase
                .from('user_itinerary_destinations')
                .select('*')
                .eq('itinerary_id', itineraryId)
                .eq('order_index', destinationIndex);

            if (indexError) {
                console.error('Error finding by index:', indexError);
            }

            console.log('Existing data by index:', existingByIndex);

            let success = false;
            let error = null;

            // Try updating by ID if we found a record
            if (existingData && existingData.length > 0) {
                const { error: updateError } = await supabase
                    .from('user_itinerary_destinations')
                    .update({
                        destination_overview: notes,
                        youtube_videos: youtubeVideos,
                        youtube_playlists: youtubePlaylists,
                        instagram_videos: instagramVideos
                    })
                    .eq('id', existingData[0].id);

                if (updateError) {
                    console.error('Error updating by destination name:', updateError);
                    error = updateError;
                } else {
                    success = true;
                }
            }

            // If first update failed, try updating by index
            if (!success && existingByIndex && existingByIndex.length > 0) {
                const { error: updateError } = await supabase
                    .from('user_itinerary_destinations')
                    .update({
                        destination_overview: notes,
                        youtube_videos: youtubeVideos,
                        youtube_playlists: youtubePlaylists,
                        instagram_videos: instagramVideos
                    })
                    .eq('id', existingByIndex[0].id);

                if (updateError) {
                    console.error('Error updating by index:', updateError);
                    error = updateError;
                } else {
                    success = true;
                }
            }

            // If both updates failed, try inserting a new record
            if (!success) {
                console.log('No existing record found or updates failed, attempting to insert');
                const { error: insertError } = await supabase
                    .from('user_itinerary_destinations')
                    .insert({
                        itinerary_id: itineraryId,
                        destination: destination,
                        order_index: destinationIndex,
                        destination_overview: notes,
                        youtube_videos: youtubeVideos,
                        youtube_playlists: youtubePlaylists,
                        instagram_videos: instagramVideos
                    });

                if (insertError) {
                    console.error('Error inserting new record:', insertError);
                    error = insertError;
                } else {
                    success = true;
                }
            }

            if (!success && error) {
                throw error;
            }

            console.log('Save operation completed successfully');
            onSave(notes, youtubeVideos, youtubePlaylists, instagramVideos);
            toast.success('Overview saved successfully');
            onClose();
        } catch (error) {
            console.error('Error saving overview:', error);
            toast.error('Error saving overview');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-200">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold">Overview for {destination}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your overview for this destination..."
                            className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] resize-none"
                        />
                    </div>

                    {/* YouTube Videos Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-700">
                            <Youtube className="w-4 h-4 text-red-600" />
                            YouTube Videos
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="Paste YouTube video URL"
                                className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C]"
                            />
                            <button
                                onClick={handleAddVideo}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                                Add Video
                            </button>
                        </div>
                        <div className="space-y-2">
                            {youtubeVideos.map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <span className="text-sm text-gray-600 truncate flex-1">{url}</span>
                                    <button
                                        onClick={() => handleRemoveVideo(url)}
                                        className="ml-2 text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* YouTube Playlists Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-700">
                            <Youtube className="w-4 h-4 text-red-600" />
                            YouTube Playlists
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPlaylistUrl}
                                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                                placeholder="Paste YouTube playlist URL"
                                className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C]"
                            />
                            <button
                                onClick={handleAddPlaylist}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                                Add Playlist
                            </button>
                        </div>
                        <div className="space-y-2">
                            {youtubePlaylists.map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <span className="text-sm text-gray-600 truncate flex-1">{url}</span>
                                    <button
                                        onClick={() => handleRemovePlaylist(url)}
                                        className="ml-2 text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instagram Videos Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-700">
                            <Instagram className="w-4 h-4 text-pink-600" />
                            Instagram Videos
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newInstagramUrl}
                                onChange={(e) => setNewInstagramUrl(e.target.value)}
                                placeholder="Paste Instagram video URL"
                                className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C]"
                            />
                            <button
                                onClick={handleAddInstagramVideo}
                                className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors"
                            >
                                Add Video
                            </button>
                        </div>
                        <div className="space-y-2">
                            {instagramVideos.map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <span className="text-sm text-gray-600 truncate flex-1">{url}</span>
                                    <button
                                        onClick={() => handleRemoveInstagramVideo(url)}
                                        className="ml-2 text-pink-600 hover:text-pink-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#00C48C] text-white rounded-full hover:bg-[#00B380] transition-colors flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DestinationNotes; 