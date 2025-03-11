import { supabase } from '../lib/supabase';

interface Country {
    id: string;
    name: string;
    code: string;
    folder_name: string;
}

export const CountryImagesService = {
    async getCountries(): Promise<Country[]> {
        try {
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching countries:', error);
            return [];
        }
    },

    async getCountryImage(country: string): Promise<string | null> {
        try {
            // First get the country folder name
            const { data: countryData, error: countryError } = await supabase
                .from('countries')
                .select('folder_name')
                .eq('name', country)
                .single();

            if (countryError || !countryData) {
                console.error('Error fetching country:', countryError);
                return null;
            }

            // Then get images from that folder
            const { data: files, error } = await supabase.storage
                .from('country-images')
                .list(`${countryData.folder_name}/`);

            if (error) {
                console.error('Error fetching country images:', error);
                return null;
            }

            if (!files || files.length === 0) {
                return null;
            }

            // Randomly select one image
            const randomImage = files[Math.floor(Math.random() * files.length)];

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('country-images')
                .getPublicUrl(`${countryData.folder_name}/${randomImage.name}`);

            return publicUrl;
        } catch (error) {
            console.error('Error in getCountryImage:', error);
            return null;
        }
    },

    async uploadCountryImage(country: string, file: File): Promise<boolean> {
        try {
            // First get the country folder name
            const { data: countryData, error: countryError } = await supabase
                .from('countries')
                .select('folder_name')
                .eq('name', country)
                .single();

            if (countryError || !countryData) {
                console.error('Error fetching country:', countryError);
                return false;
            }

            // Generate a unique filename to avoid conflicts
            const timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const filePath = `${countryData.folder_name}/${uniqueFilename}`;

            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error('User not authenticated');
                return false;
            }

            // Upload the file
            const { error } = await supabase.storage
                .from('country-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading country image:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in uploadCountryImage:', error);
            return false;
        }
    },

    async getCountryImages(country: string): Promise<string[]> {
        try {
            // First get the country folder name
            const { data: countryData, error: countryError } = await supabase
                .from('countries')
                .select('folder_name')
                .eq('name', country)
                .single();

            if (countryError || !countryData) {
                console.error('Error fetching country:', countryError);
                return [];
            }

            // Then get all images from that folder
            const { data: files, error } = await supabase.storage
                .from('country-images')
                .list(`${countryData.folder_name}/`);

            if (error) {
                console.error('Error fetching country images:', error);
                return [];
            }

            if (!files || files.length === 0) {
                return [];
            }

            // Get public URLs for all images
            const imageUrls = files.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('country-images')
                    .getPublicUrl(`${countryData.folder_name}/${file.name}`);
                return publicUrl;
            });

            return imageUrls;
        } catch (error) {
            console.error('Error in getCountryImages:', error);
            return [];
        }
    },
}; 