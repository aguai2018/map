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