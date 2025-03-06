import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMapsScript } from '../hooks/useGoogleMapsScript';

// Add country code mapping
const COUNTRY_CODES: { [key: string]: string } = {
  'Japan': 'JP',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Australia': 'AU',
  'Canada': 'CA',
  'China': 'CN',
  'India': 'IN',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'Spain': 'ES',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Russia': 'RU',
  'South Korea': 'KR',
  // Add more countries as needed
};

// Add this interface to handle date display
interface DateDisplayProps {
  startDate: string;
  nights: number;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ startDate, nights }) => {
  const formatDate = (date: Date) => {
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
  };

  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + nights);

  return (
    <div className="text-sm text-gray-500 mt-1">
      {formatDate(start)} - {formatDate(end)}
    </div>
  );
};

interface PlaceAutocompleteProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  startDate: string;  // Add this
  nights: number;     // Add this
}

const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  country,
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Add destination',
  className = '',
  startDate,
  nights,
}) => {
  const isGoogleMapsLoaded = useGoogleMapsScript();
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const componentMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    componentMounted.current = true;

    const initializeServices = () => {
      if (!componentMounted.current) return;
      
      try {
        if (window.google && !isInitialized) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          const dummyElement = document.createElement('div');
          placesService.current = new window.google.maps.places.PlacesService(dummyElement);
          setIsInitialized(true);
          console.log('Google Maps services initialized');

          // Try to fetch predictions for existing value after initialization
          if (value && country) {
            setTimeout(() => {
              fetchPredictions(value);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error initializing Google Maps services:', error);
      }
    };

    if (isGoogleMapsLoaded) {
      initializeServices();
    }

    return () => {
      componentMounted.current = false;
    };
  }, [isGoogleMapsLoaded, country, value]);

  // Watch for country changes
  useEffect(() => {
    if (isInitialized && country && value) {
      console.log('Country changed, refetching predictions');
      fetchPredictions(value);
    }
  }, [country, isInitialized]);

  const fetchPredictions = (input: string) => {
    // Add minimum character check
    if (input.length < 3) {
      console.log('Skipping predictions: Input less than 3 characters');
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!input || !isInitialized || !autocompleteService.current) {
      console.log('Skipping predictions:', { 
        input, 
        isInitialized, 
        hasAutocompleteService: !!autocompleteService.current,
        country 
      });
      return;
    }
    
    if (!country) {
      console.warn('No country selected');
      return;
    }

    const countryCode = COUNTRY_CODES[country];
    if (!countryCode) {
      console.warn(`Country code not found for: ${country}`);
      return;
    }

    console.log('Fetching predictions for:', {
      input,
      country,
      countryCode,
      isInitialized,
      elementFocused: document.activeElement === inputRef.current
    });

    const request = {
      input,
      componentRestrictions: { country: countryCode },
      types: ['(cities)']
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (results, status) => {
        if (!componentMounted.current) return;
        
        console.log('Prediction results:', { status, results });
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.place-autocomplete')) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handlePlaceSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['name', 'geometry', 'formatted_address']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        onChange(prediction.description);
        onPlaceSelect(place);
        setShowPredictions(false);
      }
    });
  };

  return (
    <div className="relative place-autocomplete">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (isInitialized) {
            fetchPredictions(e.target.value);
          }
        }}
        onFocus={() => {
          console.log('Input focused, current value:', value);
          if (value && isInitialized) {
            fetchPredictions(value);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (value && isInitialized) {
            fetchPredictions(value);
          }
        }}
        placeholder={placeholder}
        className={`w-full border-none focus:ring-0 bg-transparent ${className}`}
      />
      
      {value && <DateDisplay startDate={startDate} nights={nights} />}
      
      {showPredictions && predictions.length > 0 && (
        <div 
          className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 max-h-60 overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => handlePlaceSelect(prediction)}
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete; 