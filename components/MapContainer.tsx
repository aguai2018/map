import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, DEFAULT_VIEW_STATE, HANGZHOU_BOUNDS } from '../constants';
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
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  styleId, 
  selectedLandmark,
  onViewStateChange 
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
        
        // Disable telemetry to prevent frame access issues
        if (mapboxgl.config) {
             mapboxgl.config.SEND_EVENTS = false;
             mapboxgl.config.API_URL = 'https://api.mapbox.com';
        }
        mapboxgl.prewarm = false;

        // WORKAROUND: Create a local worker blob to bypass Cross-Origin restrictions in iframes
        // Using v2.15.0 worker specifically to match index.html
        if (!mapboxgl.workerUrl) {
           try {
               const workerResponse = await fetch('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl-csp-worker.js');
               const workerText = await workerResponse.text();
               const blob = new Blob([workerText], { type: 'application/javascript' });
               mapboxgl.workerUrl = window.URL.createObjectURL(blob);
           } catch (e) {
               console.warn("Failed to create local worker blob, using default CDN", e);
               // Do not fail here, let Mapbox try its default
           }
        }

        if (!mounted) return;

        // Wrap map construction to catch synchronous security errors
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
              trackResize: true, 
              crossSourceCollisions: false
            });
        } catch (constructError: any) {
             const msg = constructError.message || '';
             // If we get blocked frame here, it's fatal for the constructor.
             // WE DO NOT THROW HERE. We set error state to avoid React crash.
             if (msg.includes('Blocked a frame') || msg.includes('Location')) {
                 console.warn("Caught Map construction security error:", msg);
                 if (mounted) {
                    setError("Mapbox cannot load in this secure preview frame. Please try opening the page directly.");
                    setInitializing(false);
                 }
                 return;
             } else {
                 // For other errors, we might want to see them
                 console.error("Unknown map construction error:", constructError);
                 if (mounted) {
                    setError("Failed to initialize map engine: " + msg);
                    setInitializing(false);
                 }
                 return;
             }
        }

        if (!map) {
            setInitializing(false);
            return;
        }

        mapRef.current = map;
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.on('load', () => {
          if (!mounted) return;
          setMapLoaded(true);
          setInitializing(false);
          add3DBuildings(map);
          updateFog(map, styleId);
        });

        // Filter out benign security errors
        map.on('error', (e: any) => {
          const msg = e.error?.message || '';
          if (msg.includes('Location') || msg.includes('SecurityError') || msg.includes('Blocked a frame')) {
              console.warn('Suppressing iframe security error in Mapbox Event:', msg);
              return;
          }
          console.error('Mapbox fatal error:', e);
          if (mounted && !mapLoaded) {
             // Only set error if we haven't successfully loaded yet
             setError("Failed to load map data. Check connection.");
             setInitializing(false);
          }
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
        const msg = err.message || '';
        console.error("Map initialization critical failure:", err);
        if (mounted) {
           // Provide a user-friendly error message if it's a security block
           if (msg.includes('Blocked a frame') || msg.includes('Location')) {
             setError("Browser security prevented map loading. Please open in a new tab.");
           } else {
             setError(msg || "Failed to initialize map");
           }
        }
        setInitializing(false);
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
         try {
           mapRef.current.remove();
         } catch(e) { /* ignore cleanup errors */ }
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
        try {
            if (map.isStyleLoaded()) {
               if (!map.getLayer('3d-buildings')) {
                 add3DBuildings(map);
               }
               updateFog(map, styleId);
            }
        } catch(e) { console.warn("Style update error", e); }
    };

    try {
        map.setStyle(styleId);
        map.once('styledata', onStyleData);
    } catch(e) {
        console.warn("Failed to set style", e);
    }

  }, [styleId]);

  // Handle Landmark Selection (FlyTo)
  useEffect(() => {
    if (!mapRef.current || !selectedLandmark) return;

    try {
        mapRef.current.flyTo({
          center: [selectedLandmark.coordinates.lng, selectedLandmark.coordinates.lat],
          zoom: selectedLandmark.zoom,
          bearing: selectedLandmark.bearing,
          pitch: selectedLandmark.pitch,
          duration: 2000,
          essential: true
        });
    } catch(e) {
        console.warn("FlyTo failed", e);
    }
  }, [selectedLandmark]);

  const updateFog = (map: any, style: MapStyle) => {
      try {
          // v2 API for Fog
          if (style.includes('night') || style.includes('satellite') || style.includes('dark')) {
            map.setFog({
                'range': [0.8, 8],
                'color': '#242b4b',
                'horizon-blend': 0.1,
            });
          } else {
            map.setFog({
                "range": [0.5, 10],
                "color": "#ffffff",
                "horizon-blend": 0.2
            }); 
          }
      } catch (e) { console.log('Fog update skipped', e); }
  };

  const add3DBuildings = (map: any) => {
    try {
      const style = map.getStyle();
      if (!style || !style.layers) return; 

      const layers = style.layers;
      let labelLayerId;
      
      for (const layer of layers) {
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
                  'minzoom': 13,
                  'paint': {
                      'fill-extrusion-color': [
                          'interpolate',
                          ['linear'],
                          ['get', 'height'],
                          0, '#2a2a2a',    
                          50, '#4a4a4a',    
                          100, '#5a7a9a',   
                          300, '#8ab4d4'    
                      ],
                      'fill-extrusion-height': [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13,
                          0,
                          13.05,
                          ['get', 'height']
                      ],
                      'fill-extrusion-base': [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13,
                          0,
                          13.05,
                          ['get', 'min_height']
                      ],
                      'fill-extrusion-opacity': 0.9
                  }
              },
              labelLayerId
          );
      }
    } catch (e) {
      console.warn("Could not add 3D buildings", e);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-900">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 text-red-400 p-8 text-center">
          <div className="max-w-md bg-black/50 p-6 rounded-xl border border-red-900/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-2 text-white">Map Initialization Failed</h3>
            <p className="mb-4 text-sm opacity-90">{error}</p>
            <div className="p-3 bg-red-900/20 rounded text-xs text-left mb-4 font-mono">
                Common fix: Click "Open in new tab" or run this project locally without iframe restrictions.
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition text-sm font-medium"
            >
                Retry Loading
            </button>
          </div>
        </div>
      )}
      {initializing && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 text-white pointer-events-none">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm text-blue-300">Initializing 3D Engine...</p>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapContainer;