import React, { useEffect, useState } from 'react';
import { X, Car, Bus, Train, Plane, Ship, ArrowRight, ExternalLink, Plus, Clock, Navigation, Building, DollarSign, AlertCircle } from 'lucide-react';

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface TransportOption {
  mode: string;
  duration: string;
  distance: string;
  icon: React.ReactNode;
  details: string;
  price?: string;
  operator?: string;
  route?: RouteStep[];
  stops?: string[];
  departureTime?: string;
  arrivalTime?: string;
  alternateRoutes?: {
    duration: string;
    distance: string;
    route?: RouteStep[];
    via?: string;
  }[];
}

interface TransportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  fromDestination: string;
  toDestination: string;
  onTransportSelect: (transportDetails: string) => void;
  date?: string;
}

type TransportMode = 'Drive' | 'Flights' | 'Train' | 'Bus' | 'Ferry';

interface TrainService {
  name: string;
  frequency: string;
  stops: string[];
}

interface TrainRoute {
  type: string;
  duration: string;
  distance: string;
  operator: string;
  services: TrainService[];
}

interface JapanTrainRoutes {
  [key: string]: {
    routes: TrainRoute[];
  };
}

const JAPAN_TRAIN_ROUTES: JapanTrainRoutes = {
  'kyoto-tokyo': {
    routes: [
      {
        type: 'Shinkansen',
        duration: '2h 15m',
        distance: '513.6 km',
        operator: 'JR Central',
        services: [
          {
            name: 'Nozomi',
            frequency: 'Every 30 minutes',
            stops: ['Kyoto Station', 'Shinagawa Station'],
          },
          {
            name: 'Hikari',
            frequency: 'Hourly',
            stops: ['Kyoto Station', 'Shinagawa Station'],
          }
        ]
      }
    ]
  }
};

const normalizeLocation = (location: string): string => {
  return location.toLowerCase()
    .replace(/\s*,\s*japan/i, '')  // Remove ", Japan"
    .replace(/\s*city/i, '')       // Remove "City"
    .replace(/\s+/g, '-');         // Replace spaces with hyphens
};

const getTrainRouteKey = (from: string, to: string): string => {
  const normalizedFrom = normalizeLocation(from);
  const normalizedTo = normalizeLocation(to);
  
  // Try both directions
  const key1 = `${normalizedFrom}-${normalizedTo}`;
  const key2 = `${normalizedTo}-${normalizedFrom}`;
  
  return JAPAN_TRAIN_ROUTES[key1] ? key1 : 
         JAPAN_TRAIN_ROUTES[key2] ? key2 : '';
};

const TransportPopup: React.FC<TransportPopupProps> = ({
  isOpen,
  onClose,
  fromDestination,
  toDestination,
  onTransportSelect,
  date
}) => {
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportMode>('Drive');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const findTrainStations = async (location: string) => {
    return new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      service.textSearch({
        query: `train station in ${location}`,
        type: 'train_station'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`No train stations found in ${location}`));
        }
      });
    });
  };

  useEffect(() => {
    const fetchTransportOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo('');

        const directionsService = new google.maps.DirectionsService();
        const options: TransportOption[] = [];

        // Fetch driving directions with alternatives
        try {
          const result = await directionsService.route({
            origin: fromDestination,
            destination: toDestination,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            optimizeWaypoints: true
          });

          if (result.routes && result.routes.length > 0) {
            const mainRoute = result.routes[0].legs[0];
            const alternateRoutes = result.routes.slice(1).map(route => ({
              duration: route.legs[0].duration?.text || '',
              distance: route.legs[0].distance?.text || '',
              via: route.summary,
              route: route.legs[0].steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance?.text || '',
                duration: step.duration?.text || ''
              }))
            }));

            options.push({
              mode: 'Drive',
              duration: mainRoute.duration?.text || '',
              distance: mainRoute.distance?.text || '',
              icon: <Car className="w-5 h-5" />,
              details: `Drive · ${mainRoute.duration?.text || ''} · ${mainRoute.distance?.text || ''}`,
              route: mainRoute.steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance?.text || '',
                duration: step.duration?.text || ''
              })),
              alternateRoutes
            });
          }
        } catch (error) {
          console.error('Error fetching driving directions:', error);
        }

        // Check for known train routes first
        const trainRouteKey = getTrainRouteKey(fromDestination, toDestination);
        if (trainRouteKey) {
          setDebugInfo('Found predefined train route data\n');
          const routeData = JAPAN_TRAIN_ROUTES[trainRouteKey];
          
          routeData.routes.forEach(route => {
            route.services.forEach(service => {
              options.push({
                mode: 'Train',
                duration: route.duration,
                distance: route.distance,
                icon: <Train className="w-5 h-5" />,
                details: `${service.name} Train · ${route.duration} · ${route.distance}`,
                operator: route.operator,
                departureTime: service.frequency,
                stops: service.stops
              });
            });
          });
        } else {
          // Existing train station search code
          try {
            setDebugInfo('Searching for train stations...\n');

            // Find train stations in both cities
            const [fromStations, toStations] = await Promise.all([
              findTrainStations(fromDestination),
              findTrainStations(toDestination)
            ]);

            setDebugInfo(prev => prev + 
              `Found ${fromStations.length} stations in ${fromDestination}\n` +
              `Found ${toStations.length} stations in ${toDestination}\n`
            );

            const trainRoutes: TransportOption[] = [];
            const departureTimes = [
              new Date(), // now
              new Date(new Date().setHours(9, 0, 0, 0)), // 9 AM
              new Date(new Date().setHours(12, 0, 0, 0)), // 12 PM
              new Date(new Date().setHours(15, 0, 0, 0)), // 3 PM
            ];

            // Try each combination of stations
            for (const fromStation of fromStations.slice(0, 2)) { // Limit to top 2 stations
              for (const toStation of toStations.slice(0, 2)) { // Limit to top 2 stations
                setDebugInfo(prev => prev + 
                  `\nTrying route from ${fromStation.name} to ${toStation.name}\n`
                );

                for (const departureTime of departureTimes) {
                  try {
                    const transitResult = await directionsService.route({
                      origin: { placeId: fromStation.place_id },
                      destination: { placeId: toStation.place_id },
                      travelMode: google.maps.TravelMode.TRANSIT,
                      transitOptions: {
                        modes: [google.maps.TransitMode.TRAIN, google.maps.TransitMode.RAIL],
                        departureTime: departureTime
                      }
                    });

                    if (transitResult.routes && transitResult.routes.length > 0) {
                      transitResult.routes.forEach((route, routeIndex) => {
                        const leg = route.legs[0];
                        const transitSteps = leg.steps.filter(step => 
                          step.travel_mode === google.maps.TravelMode.TRANSIT &&
                          step.transit?.line.vehicle.type.toLowerCase().includes('train')
                        );

                        if (transitSteps.length > 0) {
                          const firstTransit = transitSteps[0].transit!;
                          const option: TransportOption = {
                            mode: 'Train',
                            duration: leg.duration?.text || '',
                            distance: leg.distance?.text || '',
                            icon: <Train className="w-5 h-5" />,
                            details: `Train · ${leg.duration?.text || ''} · ${leg.distance?.text || ''}`,
                            operator: firstTransit.line.agencies?.[0]?.name || firstTransit.line.name || 'Unknown operator',
                            departureTime: leg.departure_time?.text,
                            arrivalTime: leg.arrival_time?.text,
                            stops: transitSteps.map(step => 
                              `${step.transit!.departure_stop?.name} → ${step.transit!.arrival_stop?.name}`
                            )
                          };

                          // Only add if not already present
                          if (!trainRoutes.some(r => 
                            r.departureTime === option.departureTime && 
                            r.arrivalTime === option.arrivalTime
                          )) {
                            trainRoutes.push(option);
                            setDebugInfo(prev => prev + 
                              `Found train route: ${option.departureTime} - ${option.arrivalTime}\n`
                            );
                          }
                        }
                      });
                    }
                  } catch (error) {
                    setDebugInfo(prev => prev + 
                      `Error finding route between stations: ${error}\n`
                    );
                  }
                }
              }
            }

            if (trainRoutes.length > 0) {
              options.push(...trainRoutes);
            } else {
              setDebugInfo(prev => prev + '\nNo train routes found after trying all station combinations');
            }

          } catch (error) {
            console.error('Transit options not available:', error);
            setDebugInfo(prev => prev + `\nError finding train stations: ${error}`);
          }
        }

        // Add flight option for distances > 300km
        try {
          const distanceMatrix = await new google.maps.DistanceMatrixService().getDistanceMatrix({
            origins: [fromDestination],
            destinations: [toDestination],
            travelMode: google.maps.TravelMode.DRIVING
          });

          const distance = distanceMatrix.rows[0].elements[0].distance.value;
          if (distance > 300000) {
            const flightDuration = Math.round((distance / 1000) / 800 * 60); // Rough estimate based on 800km/h
            options.push({
              mode: 'Flights',
              duration: `~${Math.floor(flightDuration / 60)}h ${flightDuration % 60}m`,
              distance: `${Math.round(distance / 1000)} km`,
              icon: <Plane className="w-5 h-5" />,
              details: `Flight · ~${Math.floor(flightDuration / 60)}h ${flightDuration % 60}m · ${Math.round(distance / 1000)}km`,
              price: 'Check airlines for current prices',
              operator: 'Multiple airlines operate on this route'
            });
          }
        } catch (error) {
          console.error('Error calculating flight options:', error);
        }

        setTransportOptions(options);
      } catch (error) {
        console.error('Error fetching transport options:', error);
        setError('Failed to load transport options. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTransportOptions();
    }
  }, [isOpen, fromDestination, toDestination]);

  if (!isOpen) return null;

  const transportModes: { mode: TransportMode; icon: React.ReactNode }[] = [
    { mode: 'Drive', icon: <Car className="w-5 h-5" /> },
    { mode: 'Flights', icon: <Plane className="w-5 h-5" /> },
    { mode: 'Train', icon: <Train className="w-5 h-5" /> },
    { mode: 'Bus', icon: <Bus className="w-5 h-5" /> },
    { mode: 'Ferry', icon: <Ship className="w-5 h-5" /> },
  ];

  const currentOptions = transportOptions.filter(option => option.mode === selectedMode);

  const renderOptionDetails = (option: TransportOption) => {
    switch (option.mode) {
      case 'Drive':
        return (
          <div className="mt-4">
            {option.alternateRoutes && option.alternateRoutes.length > 0 && (
              <div className="text-gray-700">
                <h4 className="font-medium mb-2">Alternative Routes</h4>
                <div className="flex gap-4">
                  {option.alternateRoutes.map((alt, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg flex-1">
                      <div className="text-gray-500">{alt.duration} · {alt.distance}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'Flights':
        return (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Estimated flight time: {option.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-4 h-4" />
              <span>{option.price}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Building className="w-4 h-4" />
              <span>{option.operator}</span>
            </div>
          </div>
        );

      case 'Train':
        return option.operator ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Building className="w-4 h-4" />
              <span>Operator: {option.operator}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Frequency: {option.departureTime}</span>
            </div>
            {option.stops && option.stops.length > 0 && (
              <div className="text-gray-700">
                <div className="font-medium mb-1">Route:</div>
                <div className="text-sm space-y-1">
                  {option.stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span>{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-gray-500 italic">
            No train services found for this route
          </div>
        );

      case 'Bus':
        return option.operator ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Building className="w-4 h-4" />
              <span>Operator: {option.operator}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>{option.departureTime} - {option.arrivalTime}</span>
            </div>
            {option.stops && option.stops.length > 0 && (
              <div className="text-gray-700">
                <div className="font-medium mb-1">Stops:</div>
                <div className="text-sm space-y-1">
                  {option.stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span>{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-gray-500 italic">
            No {option.mode.toLowerCase()} services found for this route
          </div>
        );

      case 'Ferry':
        return (
          <div className="mt-4 text-gray-500 italic">
            No ferry services found for this route
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[800px] overflow-auto">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-medium text-lg">{fromDestination}</span>
              <ArrowRight className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-lg">{toDestination}</span>
            </div>
            {date && (
              <div className="text-base text-gray-500 mt-2">
                {date}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Transport Mode Tabs */}
        <div className="px-6 flex items-center gap-3 border-b border-gray-200 pb-3">
          {transportModes.map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-6 py-3 rounded-full flex items-center gap-3 ${
                selectedMode === mode
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {icon}
              <span className="text-base">{mode}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-lg">
              Loading transport options...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-lg">
              {error}
            </div>
          ) : currentOptions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-lg flex flex-col items-center gap-4">
              <div>No {selectedMode.toLowerCase()} options available for this route</div>
              {selectedMode === 'Train' && debugInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm font-mono whitespace-pre-wrap max-w-full overflow-auto">
                  <div className="flex items-center gap-2 mb-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Debug Information:</span>
                  </div>
                  {debugInfo}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {currentOptions.map((option, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-6">
                    <div className="bg-white p-4 rounded-full">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-medium">
                        {option.duration}
                      </div>
                      <div className="text-gray-500 text-lg">
                        {option.distance}
                      </div>
                    </div>
                    <button
                      onClick={() => onTransportSelect(option.details)}
                      className="px-6 py-3 rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 flex items-center gap-2 text-base"
                    >
                      <Plus className="w-5 h-5" />
                      Add to trip
                    </button>
                  </div>
                  {renderOptionDetails(option)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportPopup; 