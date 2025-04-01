import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export { mapboxgl }; 