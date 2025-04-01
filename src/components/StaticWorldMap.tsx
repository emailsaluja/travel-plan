import React from 'react';

interface StaticWorldMapProps {
    visitedCountries: string[];
    className?: string;
}

const StaticWorldMap: React.FC<StaticWorldMapProps> = ({
    visitedCountries,
    className = ''
}) => {
    // Create marker overlays for visited countries
    const markers = visitedCountries
        .map(code => {
            const coords = countryCoordinates[code];
            if (!coords) return null;
            return `pin-s+00C4B4(${coords[0]},${coords[1]})`;
        })
        .filter(Boolean)
        .join(',');

    // Construct the static map URL with a cleaner style
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers}/0,25,1/1280x720@2x?access_token=pk.eyJ1IjoiYW1hbjlpbiIsImEiOiJjbThrdHZrcjQxNXByMmtvZ3d1cGlsYXA4In0.nUn4wFsWrbw2jC6ZMEJNPw`;

    return (
        <div className={`relative ${className}`}>
            <img
                src={mapUrl}
                alt="World Map with Visited Countries"
                className="w-full h-[50vh] object-cover rounded-none"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
                <div className="flex items-center gap-2">
                    <img src="/images/logo.svg" alt="Stippl" className="h-5 w-auto" />
                    <span className="text-sm font-medium text-gray-700">{visitedCountries.length} countries visited</span>
                </div>
            </div>
        </div>
    );
};

// Country coordinates for the markers
const countryCoordinates: { [key: string]: [number, number] } = {
    'US': [-95.7129, 37.0902],
    'GB': [-0.1276, 51.5074],
    'FR': [2.2137, 46.2276],
    'DE': [10.4515, 51.1657],
    'IT': [12.5674, 41.8719],
    'ES': [-3.7492, 40.4637],
    'IN': [78.9629, 20.5937],
    'CN': [104.1954, 35.8617],
    'JP': [138.2529, 36.2048],
    'AU': [133.7751, -25.2744],
    'BR': [-51.9253, -14.2350],
    'CA': [-106.3468, 56.1304],
    'RU': [105.3188, 61.5240],
    'ZA': [22.9375, -30.5595],
    'AE': [53.8478, 23.4241],
    'SG': [103.8198, 1.3521],
    'TH': [100.9925, 15.8700],
    'MY': [101.9758, 4.2105],
    'ID': [113.9213, -0.7893],
    'VN': [108.2772, 14.0583],
    'PH': [121.7740, 12.8797],
    'KR': [127.7669, 35.9078],
    'NZ': [172.8373, -40.9006],
    'NZ-CHC': [172.6362, -43.5320],
    'NZ-ZQN': [168.6626, -45.0312],
    'NZ-MON': [170.0982, -43.7340],
    'NZ-WKA': [169.1321, -44.7032],
    'NZ-FOX': [169.2474, -43.4668],
    'NZ-CHH': [172.6362, -43.5320]
};

export default StaticWorldMap; 