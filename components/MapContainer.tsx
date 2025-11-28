import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, DEFAULT_VIEW_STATE, HANGZHOU_BOUNDS, COMMUNITY_DATA } from '../constants';
import { MapStyle, Landmark, ViewState } from '../types';

// Access the global mapboxgl object injected by the script tag
declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface MapContainerProps {
  styleId: MapStyle;
  selectedLandmark: Landmark | null;
  onViewStateChange: (viewState: ViewState) => void;
  showPrices: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  styleId, 
  selectedLandmark,
  onViewStateChange,
  showPrices
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize Map
  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return; // Initialize only once
      
      const mapboxgl = window.mapboxgl;
      if (!mapboxgl) {
        if (mounted) setError("Mapbox library not loaded");
        setInitializing(false);
        return;
      }

      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        // Disable telemetry
        if (mapboxgl.config) {
             mapboxgl.config.SEND_EVENTS = false;
        }
        mapboxgl.prewarm = false;

        // CSP Worker workaround
        if (!mapboxgl.workerUrl) {
           try {
               const workerResponse = await fetch('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl-csp-worker.js');
               const workerText = await workerResponse.text();
               const blob = new Blob([workerText], { type: 'application/javascript' });
               mapboxgl.workerUrl = window.URL.createObjectURL(blob);
           } catch (e) {
               console.warn("Failed to create local worker blob", e);
           }
        }

        if (!mounted) return;

        let map: any;
        try {
            map = new mapboxgl.Map({
              container: mapContainerRef.current,
              style: styleId,
              center: [DEFAULT_VIEW_STATE.lng, DEFAULT_VIEW_STATE.lat],
              zoom: DEFAULT_VIEW_STATE.zoom,
              pitch: DEFAULT_VIEW_STATE.pitch,
              bearing: DEFAULT_VIEW_STATE.bearing,
              antialias: true,
              maxBounds: HANGZHOU_BOUNDS,
              minZoom: 10,
              attributionControl: false,
              trackResize: true
            });
        } catch (constructError: any) {
             console.error("Map construction error:", constructError);
             if (mounted) {
                setError("Failed to initialize map: " + constructError.message);
                setInitializing(false);
             }
             return;
        }

        if (!map) return;

        mapRef.current = map;
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.on('load', () => {
          if (!mounted) return;
          setMapLoaded(true);
          setInitializing(false);
          
          addPriceSource(map);
          setup3DBuildings(map);
          updateVisualizationLayers(map, showPrices);
          updateFog(map, styleId);
        });

        map.on('move', () => {
            if (!mounted) return;
            const center = map.getCenter();
            onViewStateChange({
                lng: center.lng,
                lat: center.lat,
                zoom: map.getZoom(),
                pitch: map.getPitch(),
                bearing: map.getBearing()
            });
        });

      } catch (err: any) {
        setInitializing(false);
        setError(err.message || "Failed to initialize map");
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
         try { mapRef.current.remove(); } catch(e) {}
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Style Change
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const onStyleData = () => {
        if (!mapRef.current) return;
        if (map.isStyleLoaded()) {
           addPriceSource(map);
           setup3DBuildings(map);
           updateVisualizationLayers(map, showPrices);
           updateFog(map, styleId);
        }
    };

    map.setStyle(styleId);
    map.once('styledata', onStyleData);
  }, [styleId]);

  // Handle Landmark Selection
  useEffect(() => {
    if (!mapRef.current || !selectedLandmark) return;
    mapRef.current.flyTo({
      center: [selectedLandmark.coordinates.lng, selectedLandmark.coordinates.lat],
      zoom: selectedLandmark.zoom,
      bearing: selectedLandmark.bearing,
      pitch: selectedLandmark.pitch,
      duration: 2000,
      essential: true
    });
  }, [selectedLandmark]);

  // Handle Price Toggle (Dynamic Styling)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    
    updateVisualizationLayers(map, showPrices);
  }, [showPrices, mapLoaded]);

  const updateFog = (map: any, style: MapStyle) => {
      if (style.includes('night') || style.includes('satellite') || style.includes('dark')) {
        map.setFog({ 'range': [0.8, 8], 'color': '#242b4b', 'horizon-blend': 0.1 });
      } else {
        map.setFog({ "range": [0.5, 10], "color": "#ffffff", "horizon-blend": 0.2 }); 
      }
  };

  const addPriceSource = (map: any) => {
    if (!map.getSource('communities')) {
       map.addSource('communities', { type: 'geojson', data: COMMUNITY_DATA });
    }

    // 1. Heatmap Layer (Ground glow)
    if (!map.getLayer('price-heatmap')) {
      map.addLayer({
        id: 'price-heatmap',
        type: 'heatmap',
        source: 'communities',
        maxzoom: 15,
        paint: {
          // Increase the heatmap weight based on frequency and property magnitude
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'price'],
            30000, 0,
            150000, 1
          ],
          // Increase the heatmap color weight weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            11, 1,
            15, 3
          ],
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparency color
          // to create a blur-like effect.
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 25,
            15, 60
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0.6,
            15, 0
          ],
        }
      }, 'waterway-label'); // Insert below labels
    }
    
    // 2. Text Labels
    if (!map.getLayer('community-labels')) {
      map.addLayer({
        'id': 'community-labels',
        'type': 'symbol',
        'source': 'communities',
        'minzoom': 13,
        'layout': {
          'text-field': ['get', 'formattedPrice'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.5,
          'text-justify': 'auto',
          'visibility': 'visible',
          // Allow some overlap to show density, but not total chaos
          'text-allow-overlap': false, 
          'text-ignore-placement': false
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            13.5, 1
          ]
        }
      });
    }
  };

  const setup3DBuildings = (map: any) => {
    const style = map.getStyle();
    if (!style || !style.layers) return; 

    let labelLayerId;
    for (const layer of style.layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
            labelLayerId = layer.id;
            break;
        }
    }

    if (!map.getLayer('3d-buildings')) {
        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 12,
                'paint': {
                    'fill-extrusion-opacity': 0.8
                }
            },
            labelLayerId
        );
    }
  };

  const updateVisualizationLayers = (map: any, showPrices: boolean) => {
    if (!map.getLayer('3d-buildings')) return;

    if (showPrices) {
      // PRICE MODE: 
      // 1. Color buildings based on height (Proxy for value)
      // 2. Exaggerate height for analysis effect
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#064e3b',      // 0m: Deep Green
        15, '#10b981',     // 15m: Green (Low rise)
        40, '#f59e0b',     // 40m: Orange (Mid rise)
        100, '#ef4444',    // 100m: Red (High rise)
        250, '#7f1d1d'     // 250m+: Deep Red (Skyscraper)
      ]);

      // Slight height exaggeration to accentuate the "Bar Chart" feel
      map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        '*', ['get', 'height'], 1.2
      ]);
      
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.9);

      // Show overlay layers
      if (map.getLayer('community-labels')) map.setLayoutProperty('community-labels', 'visibility', 'visible');
      if (map.getLayer('price-heatmap')) map.setLayoutProperty('price-heatmap', 'visibility', 'visible');

    } else {
      // NORMAL MODE
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#2a2a2a',
        50, '#4a4a4a',
        100, '#5a7a9a',
        300, '#8ab4d4'
      ]);
      
      map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
         'interpolate', ['linear'], ['zoom'],
         13, 0,
         13.05, ['get', 'height']
      ]);

      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.6);

      // Hide overlay layers
      if (map.getLayer('community-labels')) map.setLayoutProperty('community-labels', 'visibility', 'none');
      if (map.getLayer('price-heatmap')) map.setLayoutProperty('price-heatmap', 'visibility', 'none');
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-900">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 text-red-400 p-8 text-center">
          <div className="max-w-md bg-black/50 p-6 rounded-xl border border-red-900/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-2">Map Error</h3>
            <p className="mb-4 text-sm opacity-90">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded">Reload</button>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapContainer;