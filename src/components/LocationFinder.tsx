import { MapPin, Navigation, Phone, Clock, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface RecyclingCenter {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  types: string[];
  distance?: string;
  maps?: string;
}

const RECYCLING_CENTERS: Record<string, RecyclingCenter[]> = {
  Delhi: [
    {
      name: 'Delhi E-Waste Collection Center',
      address: 'Mayapuri Industrial Area, Phase 1, New Delhi',
      phone: '+91-11-2811-5555',
      hours: '9:00 AM - 6:00 PM',
      types: ['E-waste', 'Metal'],
      distance: '2.3 km',
      maps: 'https://maps.google.com/?q=Mayapuri+Industrial+Area+New+Delhi',
    },
    {
      name: 'Green Delhi Recycling Hub',
      address: 'Sector 18, Rohini, Delhi',
      phone: '+91-11-2345-6789',
      hours: '8:00 AM - 8:00 PM',
      types: ['Plastic', 'Paper', 'Glass', 'Cardboard'],
      distance: '4.5 km',
      maps: 'https://maps.google.com/?q=Sector+18+Rohini+Delhi',
    },
    {
      name: 'Organic Waste Composting Center',
      address: 'Okhla Phase 3, New Delhi',
      phone: '+91-11-4567-8900',
      hours: '7:00 AM - 7:00 PM',
      types: ['Organic'],
      distance: '5.8 km',
      maps: 'https://maps.google.com/?q=Okhla+Phase+3+New+Delhi',
    },
  ],
  Bengaluru: [
    {
      name: 'Bangalore E-Waste Facility',
      address: 'Peenya Industrial Area, Bengaluru',
      phone: '+91-80-2345-6789',
      hours: '9:00 AM - 6:00 PM',
      types: ['E-waste', 'Metal'],
      distance: '3.2 km',
      maps: 'https://maps.google.com/?q=Peenya+Industrial+Area+Bengaluru',
    },
    {
      name: 'Hasiru Dala Recycling Center',
      address: 'Whitefield, Bengaluru',
      phone: '+91-80-4567-8901',
      hours: '8:00 AM - 7:00 PM',
      types: ['Plastic', 'Paper', 'Glass', 'Cardboard'],
      distance: '6.1 km',
      maps: 'https://maps.google.com/?q=Whitefield+Bengaluru',
    },
  ],
  Mumbai: [
    {
      name: 'Mumbai Recycle Center',
      address: 'Malad West, Mumbai',
      phone: '+91-22-2345-6789',
      hours: '9:00 AM - 8:00 PM',
      types: ['Plastic', 'Paper', 'Glass', 'Metal'],
      distance: '2.8 km',
      maps: 'https://maps.google.com/?q=Malad+West+Mumbai',
    },
    {
      name: 'E-Waste Management Mumbai',
      address: 'Andheri East, Mumbai',
      phone: '+91-22-4567-8901',
      hours: '10:00 AM - 6:00 PM',
      types: ['E-waste'],
      distance: '4.2 km',
      maps: 'https://maps.google.com/?q=Andheri+East+Mumbai',
    },
  ],
};

RECYCLING_CENTERS.Chennai = [
  {
    name: 'Chennai Recycling Hub',
    address: 'Ambattur Industrial Estate, Chennai',
    phone: '+91-44-2345-6789',
    hours: '9:00 AM - 7:00 PM',
    types: ['Plastic', 'Paper', 'Glass', 'Metal', 'E-waste'],
    distance: '3.5 km',
    maps: 'https://maps.google.com/?q=Ambattur+Industrial+Estate+Chennai',
  },
];

RECYCLING_CENTERS.Hyderabad = [
  {
    name: 'Hyderabad Waste Management',
    address: 'Kukatpally, Hyderabad',
    phone: '+91-40-2345-6789',
    hours: '8:00 AM - 8:00 PM',
    types: ['Plastic', 'Paper', 'Glass', 'Metal', 'E-waste'],
    distance: '2.1 km',
    maps: 'https://maps.google.com/?q=Kukatpally+Hyderabad',
  },
];

RECYCLING_CENTERS.Kolkata = [
  {
    name: 'Kolkata Recycling Center',
    address: 'Salt Lake, Kolkata',
    phone: '+91-33-2345-6789',
    hours: '9:00 AM - 6:00 PM',
    types: ['Plastic', 'Paper', 'Glass', 'Metal'],
    distance: '3.8 km',
    maps: 'https://maps.google.com/?q=Salt+Lake+Kolkata',
  },
];

RECYCLING_CENTERS.Pune = [
  {
    name: 'Pune E-Waste Collection',
    address: 'Hinjewadi, Pune',
    phone: '+91-20-2345-6789',
    hours: '9:00 AM - 7:00 PM',
    types: ['E-waste', 'Metal'],
    distance: '4.5 km',
    maps: 'https://maps.google.com/?q=Hinjewadi+Pune',
  },
];

RECYCLING_CENTERS.Ahmedabad = [
  {
    name: 'Ahmedabad Recycling Hub',
    address: 'Narol, Ahmedabad',
    phone: '+91-79-2345-6789',
    hours: '8:00 AM - 7:00 PM',
    types: ['Plastic', 'Paper', 'Glass', 'Metal'],
    distance: '3.2 km',
    maps: 'https://maps.google.com/?q=Narol+Ahmedabad',
  },
];

interface LocationFinderProps {
  city: string;
  wasteType?: string;
}

export default function LocationFinder({ city, wasteType }: LocationFinderProps) {
  const [selectedType, setSelectedType] = useState<string>(wasteType || 'All');
  
  const centers = RECYCLING_CENTERS[city] || [];
  const filteredCenters = selectedType === 'All' 
    ? centers 
    : centers.filter(center => center.types.includes(selectedType));

  const wasteTypes = ['All', 'E-waste', 'Plastic', 'Paper', 'Glass', 'Metal', 'Organic', 'Cardboard'];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
      <div className="space-y-4">
        {}
        <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-200">
          <MapPin className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Nearby Centers</h2>
        </div>

        {}
        <div className="flex flex-wrap gap-2">
          {wasteTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCenters.map((center, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                {}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 flex-1">
                    {center.name}
                  </h3>
                  {center.distance && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {center.distance}
                    </span>
                  )}
                </div>

                {}
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {center.address}
                </p>

                {}
                {center.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {center.phone}
                  </p>
                )}

                {}
                {center.hours && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {center.hours}
                  </p>
                )}

                {}
                <div className="flex flex-wrap gap-1.5">
                  {center.types.map((type) => (
                    <span
                      key={type}
                      className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {}
                {center.maps && (
                  <a
                    href={center.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {}
        {filteredCenters.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No centers found for {selectedType}</p>
            <p className="text-xs text-gray-400 mt-1">Try selecting "All" or a different type</p>
          </div>
        )}
      </div>
    </div>
  );
}
