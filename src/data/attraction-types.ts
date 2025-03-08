import {
  Building2,
  Trees,
  Waves,
  Landmark,
  Clock,
  TreePine,
  ShoppingBag,
  FootprintsIcon,
  Mountain,
  CloudSun,
  Utensils,
  Ticket,
  Camera,
  Music,
  Church,
  Train,
  Coffee,
  Wine,
  Tent,
  Bike,
  Castle,
  Building,
  ParkingSquare
} from 'lucide-react';

export interface AttractionType {
  icon: any; // Lucide icon component
  label: string;
  keywords: string[]; // Keywords to match in the attraction name or type
  color: string; // Tailwind color class
  bgColor: string; // Tailwind background color class
}

export const attractionTypes: { [key: string]: AttractionType } = {
  castle: {
    icon: Castle,
    label: 'Castle',
    keywords: ['castle', 'palace', 'fortress', 'chateau'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  museum: {
    icon: Building,
    label: 'Museum',
    keywords: ['museum', 'gallery', 'exhibition'],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  park: {
    icon: ParkingSquare,
    label: 'Park',
    keywords: ['park', 'garden', 'playground', 'recreation'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  building: {
    icon: Building2,
    label: 'Building',
    keywords: ['building', 'tower', 'skyscraper', 'architecture', 'structure'],
    color: 'text-slate-600',
    bgColor: 'bg-slate-50'
  },
  nature: {
    icon: Trees,
    label: 'Nature',
    keywords: ['nature', 'forest', 'botanical', 'flora'],
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  water: {
    icon: Waves,
    label: 'Water',
    keywords: ['water', 'beach', 'ocean', 'lake', 'river', 'waterfall'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  monument: {
    icon: Landmark,
    label: 'Monument',
    keywords: ['monument', 'memorial', 'statue', 'sculpture'],
    color: 'text-stone-600',
    bgColor: 'bg-stone-50'
  },
  historical: {
    icon: Clock,
    label: 'Historical',
    keywords: ['historical', 'ancient', 'ruins', 'heritage'],
    color: 'text-amber-700',
    bgColor: 'bg-amber-50'
  },
  shopping: {
    icon: ShoppingBag,
    label: 'Shopping',
    keywords: ['shopping', 'mall', 'market', 'store', 'shop', 'boutique'],
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  walking: {
    icon: FootprintsIcon,
    label: 'Walking',
    keywords: ['walking', 'trail', 'path', 'hike', 'trek'],
    color: 'text-lime-600',
    bgColor: 'bg-lime-50'
  },
  mountain: {
    icon: Mountain,
    label: 'Mountain',
    keywords: ['mountain', 'hill', 'peak', 'summit', 'volcano'],
    color: 'text-stone-700',
    bgColor: 'bg-stone-50'
  },
  viewpoint: {
    icon: CloudSun,
    label: 'Viewpoint',
    keywords: ['viewpoint', 'observation', 'lookout', 'vista', 'panorama', 'sky'],
    color: 'text-sky-600',
    bgColor: 'bg-sky-50'
  },
  dining: {
    icon: Utensils,
    label: 'Dining',
    keywords: ['restaurant', 'dining', 'food', 'cuisine'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  entertainment: {
    icon: Ticket,
    label: 'Entertainment',
    keywords: ['entertainment', 'theater', 'cinema', 'show', 'performance'],
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  photography: {
    icon: Camera,
    label: 'Photography',
    keywords: ['photography', 'photo', 'spot', 'instagram'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  nightlife: {
    icon: Music,
    label: 'Nightlife',
    keywords: ['nightlife', 'bar', 'club', 'pub', 'lounge'],
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50'
  },
  religious: {
    icon: Church,
    label: 'Religious',
    keywords: ['temple', 'shrine', 'church', 'mosque', 'religious'],
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  transportation: {
    icon: Train,
    label: 'Transportation',
    keywords: ['station', 'terminal', 'port', 'transport'],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  cafe: {
    icon: Coffee,
    label: 'Cafe',
    keywords: ['cafe', 'coffee', 'tea', 'bakery'],
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  winery: {
    icon: Wine,
    label: 'Winery',
    keywords: ['winery', 'vineyard', 'wine', 'brewery'],
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  camping: {
    icon: Tent,
    label: 'Camping',
    keywords: ['camping', 'campsite', 'outdoor', 'wilderness'],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  cycling: {
    icon: Bike,
    label: 'Cycling',
    keywords: ['cycling', 'bike', 'bicycle', 'riding'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  }
};

// Helper function to find the most appropriate icon for an attraction
export const getAttractionIcon = (attractionName: string): AttractionType => {
  if (!attractionName) return attractionTypes.monument;
  
  const nameLower = attractionName.toLowerCase();
  
  // Religious places
  if (nameLower.includes('shrine') || nameLower.includes('temple') || 
      nameLower.includes('jingu') || nameLower.includes('church') || 
      nameLower.includes('mosque')) {
    return attractionTypes.religious;
  }

  // Government buildings
  if (nameLower.includes('government') || nameLower.includes('parliament') || 
      nameLower.includes('capitol')) {
    return attractionTypes.building;
  }

  // Parks and Gardens
  if (nameLower.includes('park') || nameLower.includes('garden') || 
      nameLower.includes('grove') || nameLower.includes('botanical')) {
    return attractionTypes.park;
  }

  // Find the first matching type based on keywords
  for (const [_, type] of Object.entries(attractionTypes)) {
    if (type.keywords.some(keyword => nameLower.includes(keyword))) {
      return type;
    }
  }
  
  // Default to monument if no match found
  return attractionTypes.monument;
}; 