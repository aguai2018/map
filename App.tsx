import React, { useState } from 'react';
import MapContainer from './components/MapContainer';
import ControlPanel from './components/ControlPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { MapStyle, Landmark, ViewState } from './types';
import { DEFAULT_VIEW_STATE } from './constants';

const App: React.FC = () => {
  const [currentStyle, setCurrentStyle] = useState<MapStyle>(MapStyle.NAVIGATION_NIGHT);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);

  const handleStyleChange = (style: MapStyle) => {
    setCurrentStyle(style);
  };

  const handleLandmarkSelect = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950 text-white">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary>
          <MapContainer 
            styleId={currentStyle} 
            selectedLandmark={selectedLandmark}
            onViewStateChange={setViewState}
          />
        </ErrorBoundary>
      </div>

      {/* UI Overlay */}
      <ControlPanel 
        currentStyle={currentStyle}
        onStyleChange={handleStyleChange}
        onLandmarkSelect={handleLandmarkSelect}
        viewState={viewState}
      />
    </div>
  );
};

export default App;