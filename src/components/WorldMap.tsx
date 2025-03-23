import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface WorldMapProps {
    visitedCountries: string[];
    className?: string;
    onCountryToggle?: (countryCode: string, isVisited: boolean) => void;
    isEditable?: boolean;
}

const WorldMap: React.FC<WorldMapProps> = ({
    visitedCountries,
    className = '',
    onCountryToggle,
    isEditable = false
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const visitedCountriesLayer = useRef<string | null>(null);
    const [isHoveringCountry, setIsHoveringCountry] = useState(false);
    const [hoveredCountry, setHoveredCountry] = useState<{ code: string; name: string } | null>(null);

    // Effect to update visited countries layer when visitedCountries changes
    useEffect(() => {
        if (!map.current || !visitedCountriesLayer.current) return;

        map.current.setFilter(
            visitedCountriesLayer.current,
            ['in', ['get', 'iso_3166_1'], ['literal', visitedCountries]]
        );
    }, [visitedCountries]);

    // Add click handler effect
    useEffect(() => {
        if (!map.current || !onCountryToggle) return;

        const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
            if (!isEditable) return;

            const features = e.features;
            if (features && features.length > 0) {
                const countryCode = features[0].properties?.iso_3166_1;
                if (countryCode) {
                    const isVisited = visitedCountries.includes(countryCode);
                    onCountryToggle(countryCode, !isVisited);
                }
            }
        };

        // Add click event to the countries-fill layer
        map.current.on('click', 'countries-fill', handleClick);

        // Change cursor when hovering over countries in edit mode
        const handleMouseEnter = () => {
            if (isEditable && map.current) {
                map.current.getCanvas().style.cursor = 'pointer';
            }
        };

        const handleMouseLeave = () => {
            if (map.current) {
                map.current.getCanvas().style.cursor = '';
            }
        };

        map.current.on('mouseenter', 'countries-fill', handleMouseEnter);
        map.current.on('mouseleave', 'countries-fill', handleMouseLeave);

        return () => {
            if (map.current) {
                map.current.off('click', 'countries-fill', handleClick);
                map.current.off('mouseenter', 'countries-fill', handleMouseEnter);
                map.current.off('mouseleave', 'countries-fill', handleMouseLeave);
            }
        };
    }, [isEditable, onCountryToggle, visitedCountries]);

    // Initial map setup
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Initialize Mapbox access token
        mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbjlpbiIsImEiOiJjbThrdHZrcjQxNXByMmtvZ3d1cGlsYXA4In0.nUn4wFsWrbw2jC6ZMEJNPw';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [0, 0],
            zoom: 1.2,
            projection: 'mercator',
            attributionControl: false
        });

        map.current.on('load', () => {
            if (!map.current) return;

            // Add source for country boundaries
            map.current.addSource('countries', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1'
            });

            // Add layer for all countries
            map.current.addLayer({
                id: 'countries-fill',
                type: 'fill',
                source: 'countries',
                'source-layer': 'country_boundaries',
                paint: {
                    'fill-color': '#e5e7eb',
                    'fill-opacity': 0.8
                }
            });

            // Add layer for country borders
            map.current.addLayer({
                id: 'countries-border',
                type: 'line',
                source: 'countries',
                'source-layer': 'country_boundaries',
                paint: {
                    'line-color': '#9ca3af',
                    'line-width': 1
                }
            });

            // Add layer for visited countries
            visitedCountriesLayer.current = 'visited-countries';
            map.current.addLayer({
                id: visitedCountriesLayer.current,
                type: 'fill',
                source: 'countries',
                'source-layer': 'country_boundaries',
                paint: {
                    'fill-color': '#00C48C',
                    'fill-opacity': 0.8
                },
                filter: ['in', ['get', 'iso_3166_1'], ['literal', visitedCountries]]
            });

            // Add hover effect
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            // Handle mouse move
            map.current.on('mousemove', 'countries-fill', (e) => {
                if (!map.current || !e.features) return;

                const countryCode = e.features[0]?.properties?.iso_3166_1;
                const countryName = e.features[0]?.properties?.name_en;

                if (countryCode && countryName) {
                    const isVisited = visitedCountries.includes(countryCode);
                    setIsHoveringCountry(true);
                    setHoveredCountry({ code: countryCode, name: countryName });

                    // Update popup content
                    popup.setLngLat(e.lngLat)
                        .setHTML(`
                            <div class="p-2">
                                <div class="font-medium">${countryName}</div>
                                <div class="text-sm ${isVisited ? 'text-[#00C48C]' : 'text-gray-500'}">
                                    ${isVisited ? 'Visited' : 'Not visited'}
                                    ${isEditable ? `<br><span class="text-xs text-gray-400">Click to ${isVisited ? 'unmark' : 'mark'} as visited</span>` : ''}
                                </div>
                            </div>
                        `)
                        .addTo(map.current);
                }
            });

            // Handle mouse leave
            map.current.on('mouseleave', 'countries-fill', () => {
                if (!map.current) return;
                setIsHoveringCountry(false);
                setHoveredCountry(null);
                popup.remove();
            });
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    return (
        <div className="relative">
            <div ref={mapContainer} className={`w-full h-[480px] ${className}`} />
            {isEditable && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm">
                    <p className="text-gray-700">Click on countries to mark them as visited</p>
                </div>
            )}
        </div>
    );
};

export default WorldMap; 