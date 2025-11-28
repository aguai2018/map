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
  zoom: 14.5,
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
  }
];

export const MAP_STYLES = [
  { id: MapStyle.NAVIGATION_NIGHT, name: 'Night (3D)', icon: '🌙' },
  { id: MapStyle.SATELLITE, name: 'Satellite', icon: '🛰️' },
  { id: MapStyle.LIGHT, name: 'Light', icon: '☀️' },
  { id: MapStyle.STREETS, name: 'Streets', icon: '🛣️' },
];

// Helper to generate a square polygon (Block) around a point
const createBlockFeature = (lng: number, lat: number, name: string, price: number) => {
  // Size of the block in degrees (approx 150m-200m)
  const size = 0.0015;
  const half = size / 2;

  return {
    type: 'Feature',
    properties: {
      name,
      price, // numeric price for height scaling
      formattedPrice: `¥${(price / 10000).toFixed(1)}万/㎡`, // string for display
      height: price * 0.005, // pre-calculate height scaling if needed, though we do it in style
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng - half, lat - half],
        [lng + half, lat - half],
        [lng + half, lat + half],
        [lng - half, lat + half],
        [lng - half, lat - half]
      ]]
    }
  };
};

// Generate Mock Data for Residential Communities around CBD
const communities = [
  // Luxury / CBD Core
  { name: "Yuefu (The MixC)", price: 120000, lng: 120.2120, lat: 30.2530 },
  { name: "River Metropolis", price: 105000, lng: 120.2080, lat: 30.2510 },
  { name: "Sunshine Coast", price: 135000, lng: 120.2180, lat: 30.2380 },
  { name: "Golden Landmark", price: 95000, lng: 120.2050, lat: 30.2480 },
  
  // High End / Nearby
  { name: "Green Garden", price: 85000, lng: 120.2010, lat: 30.2550 },
  { name: "Oriental Mansion", price: 78000, lng: 120.2220, lat: 30.2580 },
  { name: "Blue Horizon", price: 82000, lng: 120.1980, lat: 30.2450 },
  { name: "Crystal City", price: 88000, lng: 120.2250, lat: 30.2420 },

  // Mid Range / Further out
  { name: "City Plaza A", price: 65000, lng: 120.1900, lat: 30.2600 },
  { name: "City Plaza B", price: 62000, lng: 120.1920, lat: 30.2620 },
  { name: "Harmony Heights", price: 58000, lng: 120.2300, lat: 30.2650 },
  { name: "Future Park", price: 55000, lng: 120.2350, lat: 30.2300 },
  
  // Older / More Affordable
  { name: "Old Town North", price: 42000, lng: 120.1850, lat: 30.2700 },
  { name: "Canal View", price: 45000, lng: 120.1950, lat: 30.2750 },
  { name: "East District", price: 38000, lng: 120.2400, lat: 30.2700 },
];

export const COMMUNITY_DATA = {
  type: 'FeatureCollection',
  features: communities.map(c => createBlockFeature(c.lng, c.lat, c.name, c.price))
};