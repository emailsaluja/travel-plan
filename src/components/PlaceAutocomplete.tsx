import React, { useEffect, useRef, useState } from 'react';
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

interface LocationIQResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface PlaceAutocompleteProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: { name: string; geometry?: { location: { lat: number; lng: number } } }) => void;
  placeholder?: string;
  className?: string;
  startDate: string;
  nights: number;
}

const LOCATIONIQ_API_KEY = 'pk.62ccf28ef762d570bcd430490039ee56';

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
  const [predictions, setPredictions] = useState<LocationIQResult[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchDebounceTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const fetchPredictions = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!input || !country) {
      return;
    }

    const countryCode = COUNTRY_CODES[country];
    if (!countryCode) {
      console.warn(`Country code not found for: ${country}`);
      return;
    }

    try {
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(input)}&countrycodes=${countryCode}&limit=5&tag=place:city,place:town&dedupe=1`
      );

      if (!response.ok) {
        throw new Error('LocationIQ API request failed');
      }

      const results: LocationIQResult[] = await response.json();
      setPredictions(results);
      setShowPredictions(true);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePlaceSelect = (prediction: LocationIQResult) => {
    const cleanedName = cleanDestination(prediction.display_name);
    onChange(cleanedName);
    onPlaceSelect({
      name: cleanedName,
      geometry: {
        location: {
          lat: parseFloat(prediction.lat),
          lng: parseFloat(prediction.lon)
        }
      }
    });
    setShowPredictions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (searchDebounceTimeout.current) {
      clearTimeout(searchDebounceTimeout.current);
    }

    searchDebounceTimeout.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  return (
    <div className="relative place-autocomplete">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onClick={(e) => {
          e.stopPropagation();
          if (value) {
            fetchPredictions(value);
          }
        }}
        placeholder={placeholder}
        className={`w-full border-none focus:ring-0 bg-transparent ${className}`}
      />

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
              {prediction.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete; 