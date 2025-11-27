export interface Coordinates {
  lng: number;
  lat: number;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  bearing: number;
  pitch: number;
  zoom: number;
}

export enum MapStyle {
  STREETS = 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS = 'mapbox://styles/mapbox/outdoors-v12',
  LIGHT = 'mapbox://styles/mapbox/light-v11',
  DARK = 'mapbox://styles/mapbox/dark-v11',
  SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12',
  NAVIGATION_NIGHT = 'mapbox://styles/mapbox/navigation-night-v1'
}

export interface ViewState {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
}