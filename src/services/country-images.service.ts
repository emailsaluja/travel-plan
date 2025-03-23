import { supabase } from '../lib/supabase';
import { CacheService } from './cache.service';
import fallbackImages from '../data/country-images.json';

interface Country {
    id: string;
    name: string;
    code: string;
    folder_name: string;
}

interface CountryImageCache {
    urls: string[];
    timestamp: number;
}

interface GlobalImageCache {
    images: Record<string, string[]>;
    timestamp: number;
}

// Type for the fallback images JSON structure
interface FallbackImages {
    [key: string]: string[] | string;
    default: string[];
}

// Cast the imported JSON to the correct type
const typedFallbackImages = fallbackImages as FallbackImages;

// Increased cache durations for better performance
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const GLOBAL_CACHE_KEY = 'all_country_images_v2';
const COUNTRIES_CACHE_KEY = 'all_countries_v2';

// Memory cache for instant access
const imageCache = new Map<string, CountryImageCache>();
let lastGlobalFetch = 0;
let isFetchingGlobal = false;
let globalImagesPromise: Promise<Record<string, string[]>> | null = null;

export const CountryImagesService = {
    async fetchAllCountryImages(): Promise<Record<string, string[]>> {
        if (isFetchingGlobal && globalImagesPromise) {
            return globalImagesPromise;
        }

        // Check global cache first
        const cached = CacheService.get<GlobalImageCache>(GLOBAL_CACHE_KEY);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.images;
        }

        isFetchingGlobal = true;
        globalImagesPromise = (async () => {
            try {
                // Get all countries in one call
                const { data: countries, error: countriesError } = await supabase
                    .from('countries')
                    .select('name,folder_name')
                    .order('name');

                if (countriesError) {
                    console.error('Error fetching countries:', countriesError);
                    return this.getFallbackImages();
                }

                if (!countries || countries.length === 0) {
                    console.warn('No countries found in database');
                    return this.getFallbackImages();
                }

                // Fetch all folders in parallel with batching
                const result: Record<string, string[]> = {};
                const batchSize = 5; // Reduced batch size for better reliability

                for (let i = 0; i < countries.length; i += batchSize) {
                    const batch = countries.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (country) => {
                        try {
                            if (!country.folder_name) {
                                console.warn(`No folder name for country: ${country.name}`);
                                result[country.name] = this.getFallbackImagesForCountry(country.name);
                                return;
                            }

                            const { data: files, error } = await supabase.storage
                                .from('country-images')
                                .list(`${country.folder_name}/`);

                            if (error) {
                                console.error(`Error listing files for ${country.name}:`, error);
                                result[country.name] = this.getFallbackImagesForCountry(country.name);
                                return;
                            }

                            if (!files || files.length === 0) {
                                console.warn(`No images found for ${country.name}`);
                                result[country.name] = this.getFallbackImagesForCountry(country.name);
                                return;
                            }

                            const urls = files.map(file => {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('country-images')
                                    .getPublicUrl(`${country.folder_name}/${file.name}`);
                                return publicUrl;
                            }).filter(url => url); // Filter out any undefined URLs

                            if (urls.length === 0) {
                                result[country.name] = this.getFallbackImagesForCountry(country.name);
                            } else {
                                result[country.name] = urls;
                                imageCache.set(country.name, {
                                    urls,
                                    timestamp: Date.now()
                                });
                            }
                        } catch (error) {
                            console.error(`Error processing images for ${country.name}:`, error);
                            result[country.name] = this.getFallbackImagesForCountry(country.name);
                        }
                    }));

                    // Small delay between batches to prevent rate limiting
                    if (i + batchSize < countries.length) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
                    }
                }

                // Cache the results globally
                CacheService.set(GLOBAL_CACHE_KEY, {
                    images: result,
                    timestamp: Date.now()
                }, CACHE_DURATION);

                lastGlobalFetch = Date.now();
                return result;
            } catch (error) {
                console.error('Error in fetchAllCountryImages:', error);
                return this.getFallbackImages();
            } finally {
                isFetchingGlobal = false;
                globalImagesPromise = null;
            }
        })();

        return globalImagesPromise;
    },

    getFallbackImages(): Record<string, string[]> {
        return Object.entries(typedFallbackImages).reduce((acc, [country, urls]) => {
            if (country !== 'default') {
                acc[country] = Array.isArray(urls) ? urls : [urls];
            }
            return acc;
        }, {} as Record<string, string[]>);
    },

    getFallbackImagesForCountry(country: string): string[] {
        if (country in typedFallbackImages) {
            const urls = typedFallbackImages[country];
            return Array.isArray(urls) ? urls : [urls];
        }
        return typedFallbackImages.default;
    },

    async getCountryImages(country: string): Promise<string[]> {
        // Check memory cache first
        const cached = imageCache.get(country);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.urls;
        }

        try {
            // Get from global cache
            const allImages = await this.fetchAllCountryImages();
            return allImages[country] || this.getFallbackImagesForCountry(country);
        } catch (error) {
            console.error(`Error getting images for ${country}:`, error);
            return this.getFallbackImagesForCountry(country);
        }
    },

    async getAllCountryImages(): Promise<Record<string, string[]>> {
        return this.fetchAllCountryImages();
    },

    async getBatchCountryImages(countries: string[]): Promise<Record<string, string[]>> {
        try {
            const allImages = await this.fetchAllCountryImages();
            return countries.reduce((acc: Record<string, string[]>, country) => {
                acc[country] = allImages[country] || this.getFallbackImagesForCountry(country);
                return acc;
            }, {});
        } catch (error) {
            console.error('Error in getBatchCountryImages:', error);
            return countries.reduce((acc: Record<string, string[]>, country) => {
                acc[country] = this.getFallbackImagesForCountry(country);
                return acc;
            }, {});
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

            const timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const filePath = `${countryData.folder_name}/${uniqueFilename}`;

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

            // Clear caches to force refresh
            imageCache.delete(country);
            CacheService.clear(GLOBAL_CACHE_KEY);
            lastGlobalFetch = 0;
            globalImagesPromise = null;

            return true;
        } catch (error) {
            console.error('Error in uploadCountryImage:', error);
            return false;
        }
    },

    async getCountryImage(country: string): Promise<string | null> {
        try {
            const images = await this.getCountryImages(country);
            if (images.length === 0) {
                return null;
            }
            return images[Math.floor(Math.random() * images.length)];
        } catch (error) {
            console.error(`Error getting single image for ${country}:`, error);
            const fallbackImages = this.getFallbackImagesForCountry(country);
            return fallbackImages[0] || null;
        }
    },

    async getCountries(): Promise<Country[]> {
        // Try cache first
        const cached = CacheService.get<Country[]>(COUNTRIES_CACHE_KEY);
        if (cached) return cached;

        try {
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .order('name');

            if (error) throw error;

            // Cache the results
            if (data) {
                CacheService.set(COUNTRIES_CACHE_KEY, data, CACHE_DURATION);
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching countries:', error);
            return [];
        }
    }
}; 