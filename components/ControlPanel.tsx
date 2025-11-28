import React from 'react';
import { Landmark, MapStyle, ViewState } from '../types';
import { LANDMARKS, MAP_STYLES } from '../constants';
import { Navigation, Layers, Map as MapIcon, Info, Building2, BarChart3, GraduationCap, Hospital, Scale } from 'lucide-react';

interface ControlPanelProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  onLandmarkSelect: (landmark: Landmark) => void;
  viewState: ViewState;
  showPrices: boolean;
  onTogglePrices: (show: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStyle,
  onStyleChange,
  onLandmarkSelect,
  viewState,
  showPrices,
  onTogglePrices
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

      {/* SimCity Land Value Tool */}
      <div className="bg-black/90 backdrop-blur-lg p-1 rounded-2xl shadow-xl border border-blue-500/30 pointer-events-auto overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
          <h2 className="text-sm font-bold text-blue-100 mb-0 flex items-center gap-2 uppercase tracking-widest">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Land Value Analysis
          </h2>
        </div>
        
        <div className="p-4">
          <button
            onClick={() => onTogglePrices(!showPrices)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border-2 ${
              showPrices 
                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' 
                : 'bg-white/5 border-gray-700 text-gray-400 hover:bg-white/10 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className={`w-6 h-6 ${showPrices ? 'text-white' : 'text-gray-500'}`} />
              <div className="text-left">
                <div className="font-bold text-base">{showPrices ? 'Analysis Active' : 'Enable Data View'}</div>
                <div className="text-xs opacity-80">{showPrices ? 'Showing Influence Zones' : 'Click to visualize value'}</div>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${showPrices ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          </button>

          {showPrices && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Value Gradient */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono uppercase tracking-wider">
                  <span>Standard</span>
                  <span>Premium</span>
                  <span>Elite</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-gray-700 via-green-500 via-blue-500 via-orange-500 to-red-600 border border-white/10" />
              </div>

              {/* Influencers Legend */}
              <div className="bg-white/5 rounded-lg p-3 space-y-2 border border-white/5">
                <div className="text-xs font-semibold text-gray-300 mb-2 uppercase">Value Boosters</div>
                
                <div className="flex items-center gap-3 text-xs text-green-200">
                  <div className="p-1.5 bg-green-500/20 rounded-md border border-green-500/30">
                    <GraduationCap className="w-3 h-3 text-green-400" />
                  </div>
                  <span>Schools (+Value)</span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-blue-200">
                  <div className="p-1.5 bg-blue-500/20 rounded-md border border-blue-500/30">
                    <Hospital className="w-3 h-3 text-blue-400" />
                  </div>
                  <span>Hospitals (+Value)</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-orange-200">
                  <div className="p-1.5 bg-orange-500/20 rounded-md border border-orange-500/30">
                    <Scale className="w-3 h-3 text-orange-400" />
                  </div>
                  <span>Government (+Value)</span>
                </div>
              </div>
            </div>
          )}
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

    </div>
  );
};

export default ControlPanel;