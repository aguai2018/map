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
  lng: 120.19,
  lat: 30.25,
  zoom: 13,
  pitch: 55,
  bearing: -10
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

// --- SimCity Logic: Facilities & Amenities ---
export const FACILITIES = [
  // Hospitals 🏥
  { name: "浙一医院 (First Affiliated)", type: "Hospital", icon: "🏥", boost: 15000, radius: 2.0, lng: 120.18, lat: 30.25, color: '#3b82f6' }, // Blue
  { name: "邵逸夫医院 (Sir Run Run Shaw)", type: "Hospital", icon: "🏥", boost: 18000, radius: 2.5, lng: 120.205, lat: 30.26, color: '#3b82f6' },
  
  // Schools 🎓 (Education districts are expensive!)
  { name: "浙江大学 (ZJU Yuquan)", type: "School", icon: "🎓", boost: 25000, radius: 1.5, lng: 120.125, lat: 30.263, color: '#10b981' }, // Green
  { name: "杭州高级中学 (Hangzhou High)", type: "School", icon: "🎓", boost: 30000, radius: 1.2, lng: 120.17, lat: 30.255, color: '#10b981' },
  { name: "学军中学 (Xuejun High)", type: "School", icon: "🎓", boost: 28000, radius: 1.2, lng: 120.135, lat: 30.275, color: '#10b981' },
  
  // Government ⚖️
  { name: "市民中心 (Citizen Center)", type: "Gov", icon: "⚖️", boost: 12000, radius: 3.0, lng: 120.212, lat: 30.245, color: '#f59e0b' }, // Orange
  { name: "省政府 (Provincial Gov)", type: "Gov", icon: "⚖️", boost: 10000, radius: 2.0, lng: 120.155, lat: 30.265, color: '#f59e0b' },
];

// Helper to generate a circle polygon (approximate)
const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points = 64) => {
  const coords = {
    latitude: center[1],
    longitude: center[0]
  };

  const km = radiusInKm;

  const ret = [];
  const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]); // Close loop

  return ret;
};

// Generate Facility Points
export const FACILITIES_GEOJSON = {
  type: 'FeatureCollection',
  features: FACILITIES.map((f, i) => ({
    type: 'Feature',
    id: `fac-${i}`,
    properties: {
      name: f.name,
      type: f.type,
      icon: f.icon,
      color: f.color,
      boost: f.boost,
      radius: f.radius,
      description: `Impact: +¥${f.boost} within ${f.radius}km`
    },
    geometry: { type: 'Point', coordinates: [f.lng, f.lat] }
  }))
};

// Generate Influence Zones (Circles)
export const INFLUENCE_ZONES_GEOJSON = {
  type: 'FeatureCollection',
  features: FACILITIES.map((f, i) => ({
    type: 'Feature',
    id: `zone-${i}`,
    properties: {
      type: f.type,
      color: f.color,
      boost: f.boost
    },
    geometry: { 
      type: 'Polygon', 
      coordinates: [createGeoJSONCircle([f.lng, f.lat], f.radius)] 
    }
  }))
};

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

// Procedurally generate City-Wide Data using "SimCity" land value logic
const generateCityWideData = () => {
  const features = [];
  
  // Grid settings
  const latStart = 30.12;
  const latEnd = 30.38;
  const lngStart = 120.00;
  const lngEnd = 120.35;
  const step = 0.0055; // Approx 500m grid

  // Economic Centers (Base Macro Value)
  const centers = [
    { lng: 120.2109, lat: 30.2442, basePrice: 90000, decay: 0.4 }, // CBD Base
    { lng: 120.1468, lat: 30.2476, basePrice: 85000, decay: 0.3 }, // West Lake Base
  ];

  let idCounter = 0;

  for (let lat = latStart; lat <= latEnd; lat += step) {
    for (let lng = lngStart; lng <= lngEnd; lng += step) {
      
      const jitterLat = lat + (Math.random() - 0.5) * 0.002;
      const jitterLng = lng + (Math.random() - 0.5) * 0.002;

      // 1. Calculate Base Macro Value (Distance to CBD/City Center)
      let macroPrice = 25000; // Minimum city price
      centers.forEach(center => {
        const dist = getDistance(jitterLng, jitterLat, center.lng, center.lat);
        const influence = center.basePrice * Math.exp(-center.decay * dist);
        if (influence > macroPrice) macroPrice = influence;
      });

      // 2. Calculate Facility Bonus (SimCity Logic)
      let facilityBonus = 0;
      FACILITIES.forEach(fac => {
        const dist = getDistance(jitterLng, jitterLat, fac.lng, fac.lat);
        if (dist < fac.radius) {
          // Linear falloff from center of facility
          const factor = 1 - (dist / fac.radius); 
          facilityBonus += fac.boost * factor;
        }
      });

      // 3. Combine & Add Noise
      const rawPrice = macroPrice + facilityBonus;
      // Add randomness (+/- 10%)
      const finalPrice = Math.floor(rawPrice * (0.9 + Math.random() * 0.2));

      // Skip invalid geographical areas (simple check for huge water bodies/mountains based on price drop-off)
      if (finalPrice < 28000) continue; 

      features.push({
        type: 'Feature',
        id: idCounter++,
        properties: {
          price: finalPrice,
          formattedPrice: `¥${(finalPrice / 10000).toFixed(1)}万`,
          // Normalize for heatmap
          heatmapWeight: Math.min(finalPrice, 160000) / 160000 
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