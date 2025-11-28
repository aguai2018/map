import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, DEFAULT_VIEW_STATE, HANGZHOU_BOUNDS, COMMUNITY_DATA, FACILITIES_GEOJSON, INFLUENCE_ZONES_GEOJSON } from '../constants';
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
          
          addSources(map);
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
           addSources(map);
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

  const addSources = (map: any) => {
    if (!map.getSource('communities')) {
       map.addSource('communities', { type: 'geojson', data: COMMUNITY_DATA });
    }
    if (!map.getSource('facilities')) {
       map.addSource('facilities', { type: 'geojson', data: FACILITIES_GEOJSON });
    }
    if (!map.getSource('influence-zones')) {
       map.addSource('influence-zones', { type: 'geojson', data: INFLUENCE_ZONES_GEOJSON });
    }

    // 1. Heatmap Layer (Ground glow)
    if (!map.getLayer('price-heatmap')) {
      map.addLayer({
        id: 'price-heatmap',
        type: 'heatmap',
        source: 'communities',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['get', 'heatmapWeight'],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            11, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 20,
            15, 50
          ],
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0.6,
            15.5, 0.2
          ],
        }
      }, 'waterway-label');
    }
    
    // 2. Influence Zones (SimCity style Green Circles)
    if (!map.getLayer('influence-fill')) {
      map.addLayer({
        'id': 'influence-fill',
        'type': 'fill',
        'source': 'influence-zones',
        'layout': { 'visibility': 'none' },
        'paint': {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.15
        }
      });
    }
    if (!map.getLayer('influence-outline')) {
      map.addLayer({
        'id': 'influence-outline',
        'type': 'line',
        'source': 'influence-zones',
        'layout': { 'visibility': 'none' },
        'paint': {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2] // Dashed line for technical look
        }
      });
    }

    // 3. Text Labels for Price
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
          'text-allow-overlap': false, 
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

    // 4. Facility Icons (SimCity style markers)
    if (!map.getLayer('facility-markers')) {
      map.addLayer({
        'id': 'facility-markers',
        'type': 'symbol',
        'source': 'facilities',
        'minzoom': 11,
        'layout': {
          'text-field': ['format', 
            ['get', 'icon'], { 'font-scale': 1.5 },
            '\n', {},
            ['get', 'name'], { 'font-scale': 0.8 }
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-variable-anchor': ['top', 'bottom'],
          'text-radial-offset': 0.8,
          'text-justify': 'auto',
          'visibility': 'visible',
          'text-allow-overlap': true,
        },
        'paint': {
          'text-color': ['get', 'color'],
          'text-halo-color': '#000000',
          'text-halo-width': 2,
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
      // PRICE MODE (SimCity Analysis View)
      
      // 1. Color buildings by "Value/Height" (SimCity uses white/grey blocks for low, colors for high)
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#374151',      // Dark Grey (Low)
        30, '#10b981',     // Green (Mid-Low)
        80, '#3b82f6',     // Blue (Mid-High)
        150, '#f59e0b',    // Orange (High)
        300, '#ef4444'     // Red (Extreme)
      ]);

      map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        '*', ['get', 'height'], 1.2
      ]);
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.9);

      // 2. Show Overlay Layers
      const layersToShow = ['community-labels', 'price-heatmap', 'facility-markers', 'influence-fill', 'influence-outline'];
      layersToShow.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
      });

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

      // Hide Overlay Layers
      const layersToHide = ['community-labels', 'price-heatmap', 'facility-markers', 'influence-fill', 'influence-outline'];
      layersToHide.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      });
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