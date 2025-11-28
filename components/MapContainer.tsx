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
          updateBuildingStyle(map, showPrices);
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
           // Re-apply layers and sources after style switch
           addPriceSource(map);
           setup3DBuildings(map);
           updateBuildingStyle(map, showPrices);
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
    
    updateBuildingStyle(map, showPrices);
    
    // Toggle labels
    if (map.getLayer('community-labels')) {
      map.setLayoutProperty('community-labels', 'visibility', showPrices ? 'visible' : 'none');
    }
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
    
    // Add text labels for prices
    if (!map.getLayer('community-labels')) {
      map.addLayer({
        'id': 'community-labels',
        'type': 'symbol',
        'source': 'communities',
        'layout': {
          'text-field': ['get', 'formattedPrice'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, -1.5],
          'text-anchor': 'bottom',
          'visibility': 'visible'
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      });
    }
  };

  const setup3DBuildings = (map: any) => {
    const style = map.getStyle();
    if (!style || !style.layers) return; 

    // Find where to insert the layer
    let labelLayerId;
    for (const layer of style.layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
            labelLayerId = layer.id;
            break;
        }
    }

    // Ensure the 3d-buildings layer exists
    if (!map.getLayer('3d-buildings')) {
        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 13,
                'paint': {
                    'fill-extrusion-opacity': 0.8
                }
            },
            labelLayerId
        );
    }
  };

  const updateBuildingStyle = (map: any, showPrices: boolean) => {
    if (!map.getLayer('3d-buildings')) return;

    if (showPrices) {
      // PRICE MODE: 
      // 1. Color buildings based on their height (Proxy for value/price)
      // 2. Exaggerate height slightly to make the "Bar Chart" effect clearer
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#374151',      // Low/Podium -> Dark Gray
        30, '#10b981',     // 30m -> Green (Affordable)
        80, '#eab308',     // 80m -> Yellow (Mid-range)
        200, '#ef4444',    // 200m -> Red (High Value)
        400, '#7f1d1d'     // 400m -> Deep Red (Luxury/Landmark)
      ]);

      map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        '*', ['get', 'height'], 1.2 // 20% height boost for dramatic effect
      ]);
      
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.9);

    } else {
      // NORMAL MODE: Standard visual style
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
