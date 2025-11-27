import React from 'react';
import { Landmark, MapStyle, ViewState } from '../types';
import { LANDMARKS, MAP_STYLES } from '../constants';
import { Navigation, Layers, Compass, Map as MapIcon, Info } from 'lucide-react';

interface ControlPanelProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  onLandmarkSelect: (landmark: Landmark) => void;
  viewState: ViewState;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStyle,
  onStyleChange,
  onLandmarkSelect,
  viewState,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 max-h-[calc(100vh-2rem)] w-80 pointer-events-none">
      
      {/* Header Card */}
      <div className="bg-black/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-blue-400" />
          杭州 3D Map
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          Explore Hangzhou's architecture and landscapes in 3D.
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 font-mono bg-black/50 p-2 rounded-lg">
          <div>LNG: {viewState.lng.toFixed(4)}</div>
          <div>LAT: {viewState.lat.toFixed(4)}</div>
          <div>PITCH: {viewState.pitch.toFixed(0)}°</div>
          <div>BEARING: {viewState.bearing.toFixed(0)}°</div>
        </div>
      </div>

      {/* Landmarks */}
      <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 pointer-events-auto overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Navigation className="w-4 h-4 text-emerald-400" />
          Key Landmarks
        </h2>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => onLandmarkSelect(landmark)}
              className="group flex flex-col items-start p-3 rounded-xl hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/5 text-left"
            >
              <span className="text-blue-200 font-medium group-hover:text-blue-400 transition-colors">
                {landmark.name}
              </span>
              <span className="text-xs text-gray-500 mt-1 line-clamp-2">
                {landmark.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Switcher */}
      <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 pointer-events-auto">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-purple-400" />
          Map Style
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {MAP_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={`
                flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all duration-200
                ${currentStyle === style.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-400' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
              `}
            >
              <span className="text-lg">{style.icon}</span>
              {style.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 pointer-events-auto">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-200 block mb-1">Navigation Controls:</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>Right Click + Drag to rotate/pitch</li>
              <li>Ctrl + Scroll to zoom deeply</li>
              <li>Click buildings for details (if avail)</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ControlPanel;