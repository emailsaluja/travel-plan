export const config = {
    mapbox: {
        accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
        apiBaseUrl: 'https://api.mapbox.com',
        defaultMapStyle: 'mapbox://styles/mapbox/streets-v12',
    },
    unsplash: {
        apiBaseUrl: 'https://api.unsplash.com',
        accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
        defaultImageUrl: import.meta.env.VITE_DEFAULT_HERO_IMAGE || 'https://images.unsplash.com/photo-1469521669194-babb45599def',
    },
    map: {
        newZealand: {
            center: {
                lng: 174.7645,
                lat: -41.2865
            }
        }
    }
}; 