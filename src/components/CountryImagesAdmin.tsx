import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { CountryImagesService } from '../services/country-images.service';
import { supabase } from '../lib/supabase';

interface CountryImage {
    name: string;
    url: string;
}

interface CountryImages {
    [country: string]: CountryImage[];
}

interface Country {
    id: string;
    name: string;
    code: string;
    folder_name: string;
}

export const CountryImagesAdmin: React.FC = () => {
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [countryImages, setCountryImages] = useState<CountryImages>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);

    useEffect(() => {
        // Load countries when component mounts
        const loadCountries = async () => {
            const countriesList = await CountryImagesService.getCountries();
            setCountries(countriesList);
        };
        loadCountries();
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!selectedCountry) {
            setError('Please select a country first');
            return;
        }

        setLoading(true);
        setError(null);

        for (const file of acceptedFiles) {
            try {
                const success = await CountryImagesService.uploadCountryImage(selectedCountry, file);
                if (success) {
                    // Refresh images for the selected country
                    loadImagesForCountry(selectedCountry);
                } else {
                    setError(`Failed to upload ${file.name}`);
                }
            } catch (err) {
                console.error('Error uploading file:', err);
                setError(`Error uploading ${file.name}`);
            }
        }

        setLoading(false);
    }, [selectedCountry]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        multiple: true
    });

    const loadImagesForCountry = async (countryName: string) => {
        try {
            // First get the country folder name
            const country = countries.find(c => c.name === countryName);
            if (!country) {
                setError('Country not found');
                return;
            }

            const { data: files, error } = await supabase.storage
                .from('country-images')
                .list(`${country.folder_name}/`);

            if (error) throw error;

            const images = await Promise.all(
                (files || []).map(async (file) => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('country-images')
                        .getPublicUrl(`${country.folder_name}/${file.name}`);

                    return {
                        name: file.name,
                        url: publicUrl
                    };
                })
            );

            setCountryImages(prev => ({
                ...prev,
                [countryName]: images
            }));
        } catch (err) {
            console.error('Error loading images:', err);
            setError('Failed to load images');
        }
    };

    const handleDeleteImage = async (countryName: string, imageName: string) => {
        try {
            const country = countries.find(c => c.name === countryName);
            if (!country) {
                setError('Country not found');
                return;
            }

            const { error } = await supabase.storage
                .from('country-images')
                .remove([`${country.folder_name}/${imageName}`]);

            if (error) throw error;

            // Refresh images for the country
            loadImagesForCountry(countryName);
        } catch (err) {
            console.error('Error deleting image:', err);
            setError('Failed to delete image');
        }
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryName = e.target.value;
        setSelectedCountry(countryName);
        if (countryName) {
            loadImagesForCountry(countryName);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Country Images Admin</h2>

            {/* Country Selection */}
            <div className="mb-6">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Country
                </label>
                <select
                    id="country"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
                >
                    <option value="">Select a country...</option>
                    {countries.map(country => (
                        <option key={country.id} value={country.name}>
                            {country.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#00C48C] bg-[#00C48C]/5' : 'border-gray-300 hover:border-[#00C48C]'}`}
            >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                    {isDragActive
                        ? 'Drop the images here...'
                        : 'Drag & drop country images here, or click to select files'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Supported formats: JPEG, PNG, WebP
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent mx-auto"></div>
                    <p className="text-gray-600 mt-2">Uploading images...</p>
                </div>
            )}

            {/* Images Grid */}
            {selectedCountry && countryImages[selectedCountry]?.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Uploaded Images for {selectedCountry}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {countryImages[selectedCountry].map((image) => (
                            <div
                                key={image.name}
                                className="relative group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                            >
                                <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.src = 'https://via.placeholder.com/200x150?text=Error+Loading+Image';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeleteImage(selectedCountry, image.name)}
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-2 text-sm text-gray-600 truncate">
                                    {image.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedCountry && (!countryImages[selectedCountry] || countryImages[selectedCountry].length === 0) && (
                <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No images uploaded for {selectedCountry}</p>
                </div>
            )}
        </div>
    );
}; 