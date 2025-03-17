import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMapsScript } from '../hooks/useGoogleMapsScript';
import { cleanDestination } from '../utils/stringUtils';

// Add country code mapping
const COUNTRY_CODES: { [key: string]: string } = {
  'Afghanistan': 'AF',
  'Albania': 'AL',
  'Algeria': 'DZ',
  'Andorra': 'AD',
  'Angola': 'AO',
  'Argentina': 'AR',
  'Armenia': 'AM',
  'Australia': 'AU',
  'Austria': 'AT',
  'Azerbaijan': 'AZ',
  'Bahamas': 'BS',
  'Bahrain': 'BH',
  'Bangladesh': 'BD',
  'Barbados': 'BB',
  'Belarus': 'BY',
  'Belgium': 'BE',
  'Belize': 'BZ',
  'Bhutan': 'BT',
  'Bolivia': 'BO',
  'Bosnia and Herzegovina': 'BA',
  'Botswana': 'BW',
  'Brazil': 'BR',
  'Brunei': 'BN',
  'Bulgaria': 'BG',
  'Cambodia': 'KH',
  'Cameroon': 'CM',
  'Canada': 'CA',
  'Chile': 'CL',
  'China': 'CN',
  'Colombia': 'CO',
  'Costa Rica': 'CR',
  'Croatia': 'HR',
  'Cuba': 'CU',
  'Cyprus': 'CY',
  'Czech Republic': 'CZ',
  'Denmark': 'DK',
  'Dominican Republic': 'DO',
  'Ecuador': 'EC',
  'Egypt': 'EG',
  'El Salvador': 'SV',
  'Estonia': 'EE',
  'Ethiopia': 'ET',
  'Fiji': 'FJ',
  'Finland': 'FI',
  'France': 'FR',
  'Georgia': 'GE',
  'Germany': 'DE',
  'Ghana': 'GH',
  'Greece': 'GR',
  'Guatemala': 'GT',
  'Haiti': 'HT',
  'Honduras': 'HN',
  'Hong Kong': 'HK',
  'Hungary': 'HU',
  'Iceland': 'IS',
  'India': 'IN',
  'Indonesia': 'ID',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Ireland': 'IE',
  'Israel': 'IL',
  'Italy': 'IT',
  'Jamaica': 'JM',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Kazakhstan': 'KZ',
  'Kenya': 'KE',
  'Kuwait': 'KW',
  'Kyrgyzstan': 'KG',
  'Laos': 'LA',
  'Latvia': 'LV',
  'Lebanon': 'LB',
  'Libya': 'LY',
  'Liechtenstein': 'LI',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Macau': 'MO',
  'Madagascar': 'MG',
  'Malaysia': 'MY',
  'Maldives': 'MV',
  'Malta': 'MT',
  'Mexico': 'MX',
  'Monaco': 'MC',
  'Mongolia': 'MN',
  'Montenegro': 'ME',
  'Morocco': 'MA',
  'Myanmar': 'MM',
  'Nepal': 'NP',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Nicaragua': 'NI',
  'Nigeria': 'NG',
  'North Korea': 'KP',
  'Norway': 'NO',
  'Oman': 'OM',
  'Pakistan': 'PK',
  'Panama': 'PA',
  'Papua New Guinea': 'PG',
  'Paraguay': 'PY',
  'Peru': 'PE',
  'Philippines': 'PH',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Qatar': 'QA',
  'Romania': 'RO',
  'Russia': 'RU',
  'Saudi Arabia': 'SA',
  'Serbia': 'RS',
  'Singapore': 'SG',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'Spain': 'ES',
  'Sri Lanka': 'LK',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Syria': 'SY',
  'Taiwan': 'TW',
  'Tajikistan': 'TJ',
  'Tanzania': 'TZ',
  'Thailand': 'TH',
  'Tunisia': 'TN',
  'Turkey': 'TR',
  'Turkmenistan': 'TM',
  'Uganda': 'UG',
  'Ukraine': 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Uruguay': 'UY',
  'Uzbekistan': 'UZ',
  'Vatican City': 'VA',
  'Venezuela': 'VE',
  'Vietnam': 'VN',
  'Yemen': 'YE',
  'Zimbabwe': 'ZW'
};

// Add this interface to handle date display
interface DateDisplayProps {
  startDate: string;
  nights: number;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ startDate, nights }) => {
  // Don't render if no startDate
  if (!startDate) return null;

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
  const [isUserInteracted, setIsUserInteracted] = useState(false);

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
  }, [isGoogleMapsLoaded]);

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

  const fetchPredictions = (input: string) => {
    // Change minimum character check to 2
    if (input.length < 2) {
      console.log('Skipping predictions: Input less than 2 characters');
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

  const handlePlaceSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['name', 'geometry', 'formatted_address']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const cleanedName = cleanDestination(prediction.description);
        onChange(cleanedName);
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
          const newValue = e.target.value;
          onChange(newValue);
          if (isInitialized && country) {
            fetchPredictions(newValue);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          // If there's a value and we're initialized, show predictions again
          if (value && isInitialized && country) {
            fetchPredictions(value);
          }
        }}
        placeholder={placeholder}
        className={`w-full border-none focus:ring-0 bg-transparent ${className}`}
      />

      {/* Only show DateDisplay when both value and startDate exist */}
      {value && startDate && <DateDisplay startDate={startDate} nights={nights} />}

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