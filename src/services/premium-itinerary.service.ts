import { supabase } from '../lib/supabase';

export interface PremiumItinerary {
    id: string;
    user_id: string;
    base_itinerary_id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    inclusions: string[];
    exclusions: string[];
    terms_and_conditions: string;
    cancellation_policy: string;
    featured_image_url?: string;
    gallery_image_urls?: string[];
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
    country: string;
    duration: number;
}

export class PremiumItineraryService {
    // Get all premium itineraries for a user
    static async getUserPremiumItineraries(): Promise<PremiumItinerary[]> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    // Get a specific premium itinerary by ID
    static async getPremiumItinerary(id: string): Promise<PremiumItinerary | null> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    // Create a new premium itinerary
    static async createPremiumItinerary(itinerary: Omit<PremiumItinerary, 'id' | 'created_at' | 'updated_at'>): Promise<PremiumItinerary> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .insert([itinerary])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    // Update a premium itinerary
    static async updatePremiumItinerary(id: string, updates: Partial<PremiumItinerary>): Promise<PremiumItinerary> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    // Delete a premium itinerary
    static async deletePremiumItinerary(id: string): Promise<void> {
        const { error } = await supabase
            .from('premium_itineraries')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    }

    // Upload featured image
    static async uploadFeaturedImage(file: File, userId: string): Promise<string> {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`;
            const bucket = 'premium_itineraries';

            console.log('Attempting to upload file:', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                userId
            });

            // Get the token for authorization
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Manually construct storage URL
            const storageUrl = 'https://jotzzoyslukrscesyohn.supabase.co/storage/v1';

            // Create a promise to handle the XMLHttpRequest
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const url = `${storageUrl}/object/${bucket}/${fileName}`;

                xhr.open('POST', url, true);

                // Set headers
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('x-upsert', 'true');
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.setRequestHeader('Cache-Control', '3600');

                // Handle response
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log('Upload successful:', xhr.responseText);

                        // Get the public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(fileName);

                        console.log('Generated public URL:', publicUrl);
                        resolve(publicUrl);
                    } else {
                        console.error('Upload failed:', xhr.status, xhr.responseText);
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                    }
                };

                xhr.onerror = function () {
                    console.error('XHR error during upload');
                    reject(new Error('Network error during upload'));
                };

                // Send the file directly as binary data
                xhr.send(file);
            });
        } catch (error) {
            console.error('Error in uploadFeaturedImage:', error);
            throw error;
        }
    }

    // Upload gallery images
    static async uploadGalleryImages(files: File[], userId: string): Promise<string[]> {
        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // First, check if the file exists and delete it if it does
            const { data: existingFiles } = await supabase.storage
                .from('premium_itineraries')
                .list(userId);

            if (existingFiles?.some(f => f.name === fileName)) {
                await supabase.storage
                    .from('premium_itineraries')
                    .remove([fileName]);
            }

            // Upload the new file
            const { error: uploadError } = await supabase.storage
                .from('premium_itineraries')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('premium_itineraries')
                .getPublicUrl(fileName);

            return publicUrl;
        });

        return Promise.all(uploadPromises);
    }

    // Get published premium itineraries
    static async getPublishedPremiumItineraries(): Promise<PremiumItinerary[]> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    // Change status of a premium itinerary
    static async updateStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<PremiumItinerary> {
        const { data, error } = await supabase
            .from('premium_itineraries')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
} 