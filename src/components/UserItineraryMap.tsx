import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { cleanDestination } from '../utils/stringUtils';
import { Loader } from '@googlemaps/js-api-loader';

interface Destination {
  destination: string;
  nights: number;
  discover: string;
  transport: string;
  notes: string;
  food: string;
  food_desc?: string;
  manual_hotel?: string;
  manual_hotel_desc?: string;
  manual_discover?: string;
  order_index: number;
}

interface UserItineraryMapProps {
  destinations: Destination[];
  className?: string;
}

const UserItineraryMap: React.FC<UserItineraryMapProps> = ({ destinations, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const googleRef = useRef<typeof google | null>(null);
  const coordinatesRef = useRef<google.maps.LatLng[]>([]);

  const clearMapObjects = useCallback(() => {
    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Clear coordinates
    coordinatesRef.current = [];
  }, []);

  const updatePolyline = useCallback(() => {
    if (!mapInstanceRef.current || !googleRef.current) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Add new polyline if there are multiple coordinates
    if (coordinatesRef.current.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: coordinatesRef.current,
        geodesic: true,
        strokeColor: '#00C48C',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: mapInstanceRef.current
      });
    }
  }, []);

  const updateMapMarkers = useCallback(async () => {
    if (!mapInstanceRef.current || !googleRef.current) return;

    // Clear everything
    clearMapObjects();

    // If no destinations, reset map view
    if (!destinations.length) {
      mapInstanceRef.current.setCenter({ lat: 41.9028, lng: 12.4964 }); // Rome, Italy
      mapInstanceRef.current.setZoom(5);
      return;
    }

    const google = googleRef.current;
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();

    // Process each destination
    for (const [index, dest] of destinations.entries()) {
      if (!dest.destination) continue;

      try {
        const response = await geocoder.geocode({ address: dest.destination });
        if (response.results[0]) {
          const position = response.results[0].geometry.location;
          coordinatesRef.current.push(position);
          bounds.extend(position);

          // Create marker with animation
          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: dest.destination,
            label: {
              text: `${index + 1}`,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#00C48C',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            animation: google.maps.Animation.DROP
          });

          markersRef.current.push(marker);
        }
      } catch (error) {
        console.error(`Error geocoding ${dest.destination}:`, error);
      }
    }

    // Update polyline after all coordinates are collected
    updatePolyline();

    // Fit map to show all markers with padding
    if (coordinatesRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
    }
  }, [destinations, clearMapObjects, updatePolyline]);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places']
      });

      try {
        const google = await loader.load();
        googleRef.current = google;

        // Initialize map if not already initialized
        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 41.9028, lng: 12.4964 }, // Center on Rome, Italy
            zoom: 5,
            mapTypeControl: false,
            streetViewControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          // Update markers after map is initialized
          await updateMapMarkers();
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      clearMapObjects();
    };
  }, []); // Only run on mount

  // Update markers when destinations change
  useEffect(() => {
    if (mapInstanceRef.current && googleRef.current) {
      updateMapMarkers();
    }
  }, [destinations, updateMapMarkers]);

  return (
    <div ref={mapRef} className={`w-full h-full ${className}`} />
  );
};

export default UserItineraryMap; 