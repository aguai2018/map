import { Landmark, MapStyle } from './types';

// Provided by user
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWd1YWkyMDEyIiwiYSI6ImNtaWg3ZHgzeDBhMGkzZXEwOWU3ZTFjZ3QifQ.hTIuWWkWxSr36NDJD7CmbQ';

export const HANGZHOU_COORDS = {
  lng: 120.1551,
  lat: 30.2741
};

// Southwest and Northeast corners of Hangzhou urban area
export const HANGZHOU_BOUNDS: [[number, number], [number, number]] = [
  [119.90, 30.10], // SW
  [120.45, 30.45]  // NE
];

export const DEFAULT_VIEW_STATE = {
  lng: 120.2109,
  lat: 30.2442,
  zoom: 13.5,
  pitch: 60,
  bearing: -20
};

export const LANDMARKS: Landmark[] = [
  {
    id: 'cbd',
    name: '钱江新城 (CBD)',
    description: 'Modern central business district with iconic architecture.',
    coordinates: { lng: 120.2109, lat: 30.2442 },
    bearing: -20,
    pitch: 65,
    zoom: 15.5
  },
  {
    id: 'westlake',
    name: '西湖 (West Lake)',
    description: 'UNESCO World Heritage site, classical beauty.',
    coordinates: { lng: 120.1468, lat: 30.2476 },
    bearing: 90,
    pitch: 50,
    zoom: 14
  },
  {
    id: 'binjiang',
    name: '滨江 (Binjiang)',
    description: 'High-tech district, home to major tech companies.',
    coordinates: { lng: 120.2155, lat: 30.1834 },
    bearing: 45,
    pitch: 60,
    zoom: 15
  },
  {
    id: 'gongshu',
    name: '拱墅 (Gongshu)',
    description: 'Historic district along the Grand Canal.',
    coordinates: { lng: 120.1588, lat: 30.3200 },
    bearing: 0,
    pitch: 45,
    zoom: 14.5
  },
  {
    id: 'xixi',
    name: '西溪湿地 (Xixi Wetland)',
    description: 'Urban wetland park and ecological preserve.',
    coordinates: { lng: 120.0636, lat: 30.2608 },
    bearing: 0,
    pitch: 40,
    zoom: 13.5
  }
];

export const MAP_STYLES = [
  { id: MapStyle.NAVIGATION_NIGHT, name: 'Night (3D)', icon: '🌙' },
  { id: MapStyle.SATELLITE, name: 'Satellite', icon: '🛰️' },
  { id: MapStyle.LIGHT, name: 'Light', icon: '☀️' },
  { id: MapStyle.STREETS, name: 'Streets', icon: '🛣️' },
];

// Helper to calculate distance between two points (Haversine approx for simple weighting)
const getDistance = (lng1: number, lat1: number, lng2: number, lat2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Procedurally generate City-Wide Data
const generateCityWideData = () => {
  const features = [];
  
  // Grid settings
  const latStart = 30.12;
  const latEnd = 30.40;
  const lngStart = 119.95;
  const lngEnd = 120.35;
  const step = 0.006; // Density of grid (~600m spacing)

  // Economic Centers (Hotspots)
  const centers = [
    { lng: 120.2109, lat: 30.2442, basePrice: 120000, decay: 0.3 }, // CBD
    { lng: 120.1468, lat: 30.2476, basePrice: 110000, decay: 0.25 }, // West Lake
    { lng: 120.2155, lat: 30.1834, basePrice: 85000, decay: 0.35 },  // Binjiang
    { lng: 120.0636, lat: 30.2608, basePrice: 70000, decay: 0.4 },   // Xixi/Future Sci-Tech
    { lng: 120.2900, lat: 30.3000, basePrice: 45000, decay: 0.5 },   // Xiasha (Univ City)
  ];

  let idCounter = 0;

  for (let lat = latStart; lat <= latEnd; lat += step) {
    for (let lng = lngStart; lng <= lngEnd; lng += step) {
      
      // Add random jitter to position so it looks organic
      const jitterLat = lat + (Math.random() - 0.5) * 0.003;
      const jitterLng = lng + (Math.random() - 0.5) * 0.003;

      // Calculate Price based on Gravity Model (Inverse Distance)
      let maxInfluencedPrice = 30000; // Minimum baseline price

      centers.forEach(center => {
        const dist = getDistance(jitterLng, jitterLat, center.lng, center.lat);
        // Exponential decay function
        const priceInfluence = center.basePrice * Math.exp(-center.decay * dist);
        if (priceInfluence > maxInfluencedPrice) {
          maxInfluencedPrice = priceInfluence;
        }
      });

      // Add noise (+/- 15%)
      const finalPrice = Math.floor(maxInfluencedPrice * (0.85 + Math.random() * 0.3));

      // Skip if likely water/mountain (simple bounds check for West Lake center mostly)
      const distToWestLakeCenter = getDistance(jitterLng, jitterLat, 120.14, 30.24);
      if (distToWestLakeCenter < 2.0 && finalPrice < 100000) continue; // Skip likely lake points unless very high value (islands)

      features.push({
        type: 'Feature',
        id: idCounter++,
        properties: {
          price: finalPrice,
          formattedPrice: `¥${(finalPrice / 10000).toFixed(1)}万`,
          // Weight property for heatmap intensity (0 to 1 normalized approx)
          heatmapWeight: Math.min(finalPrice, 150000) / 150000
        },
        geometry: {
          type: 'Point',
          coordinates: [jitterLng, jitterLat]
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

export const COMMUNITY_DATA = generateCityWideData();