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
  zoom: 15.5,
  pitch: 60,
  bearing: -17.6
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

// Helper to generate a small square polygon around a point
const createBlock = (lng: number, lat: number, name: string, price: number) => {
  const size = 0.0015; // roughly 150m
  return {
    type: 'Feature',
    properties: {
      name,
      price,
      formattedPrice: `¥${price.toLocaleString()}/㎡`
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng - size, lat - size],
        [lng + size, lat - size],
        [lng + size, lat + size],
        [lng - size, lat + size],
        [lng - size, lat - size]
      ]]
    }
  };
};

export const COMMUNITY_DATA = {
  type: 'FeatureCollection',
  features: [
    createBlock(120.2050, 30.2420, 'Golden Riverside', 85000),
    createBlock(120.2080, 30.2450, 'CBD Central Park', 110000),
    createBlock(120.2120, 30.2410, 'Hangzhou Heights', 92000),
    createBlock(120.2150, 30.2460, 'Sunshine City', 65000),
    createBlock(120.2020, 30.2480, 'Old Town Residency', 45000),
    createBlock(120.2180, 30.2430, 'Future Tech Home', 72000),
    createBlock(120.2090, 30.2390, 'River View Palace', 98000),
    createBlock(120.2200, 30.2480, 'Eastern Garden', 55000),
    createBlock(120.2010, 30.2380, 'Civic Center Apt', 88000),
    createBlock(120.2220, 30.2410, 'Green Plaza', 62000),
    createBlock(120.2140, 30.2350, 'South Bank Loft', 75000),
    createBlock(120.1980, 30.2450, 'West End Court', 58000),
    createBlock(120.2250, 30.2450, 'Metro Complex', 42000),
    createBlock(120.2060, 30.2500, 'North Star Villas', 68000),
    createBlock(120.2190, 30.2370, 'Sapphire Tower', 105000),
  ]
};