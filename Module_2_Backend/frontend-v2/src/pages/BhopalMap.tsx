import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; 
import { apiService } from '../api/apiService';
import { Activity, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// 🎨 Custom Icon for Nodes
const createPoleIcon = (isActive: boolean, isEmergency: boolean) => {
  const color = isEmergency ? '#ef4444' : (isActive ? '#9333ea' : '#475569');
  return L.divIcon({
    className: 'custom-pole-icon',
    html: `<div style="background-color: ${color}; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// 🔥 BULLETPROOF HEATLAYER: Uses setLatLngs to bypass React rendering bugs
const HeatLayer = ({ data, hour, mode, isVisible }: { data: any[], hour: number, mode: 'hourly' | 'daily', isVisible: boolean }) => {
  const map = useMap(); 
  const heatLayerRef = useRef<any>(null);

  // 1. Calculate the points based on time and mode
  const heatPoints = useMemo(() => {
    return data
      .filter(acc => {
        if (!acc.reported_at) return false;
        if (mode === 'daily') return true; 
        return new Date(acc.reported_at).getHours() === hour; 
      })
      .map(acc => [
        acc.latitude || 23.2599, 
        acc.longitude || 77.4126, 
        acc.severity === 'Major' ? 1.0 : 0.5 
      ]);
  }, [data, hour, mode]);

  // 2. Initialize the Canvas EXACTLY ONCE
  useEffect(() => {
    if (!map || !(L as any).heatLayer) return;

    // Create an empty heatmap layer and attach it to the map
    heatLayerRef.current = (L as any).heatLayer([], {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map]);

  // 3. Update the data flawlessly without destroying the canvas
  useEffect(() => {
    if (!heatLayerRef.current) return;

    if (isVisible && heatPoints.length > 0) {
      // Adjust visual size based on mode
      heatLayerRef.current.setOptions({
        radius: mode === 'daily' ? 45 : 35,
        blur: mode === 'daily' ? 30 : 20
      });
      // Inject points to draw
      heatLayerRef.current.setLatLngs(heatPoints);
    } else {
      // CLEAR the canvas instantly when toggled OFF or if no data exists
      heatLayerRef.current.setLatLngs([]);
    }
  }, [heatPoints, isVisible, mode]);

  return null;
};

const BhopalMap = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [congestion, setCongestion] = useState<any>({});
  const [accidents, setAccidents] = useState<any[]>([]);
  
  // 🎛️ Control Panel States
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours()); 
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showTrafficFlow, setShowTrafficFlow] = useState<boolean>(true);
  const [timeframeMode, setTimeframeMode] = useState<'hourly' | 'daily'>('hourly'); 
  
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const token = localStorage.getItem('access_token');

  // --- BhopalMap.tsx ---
const fetchMapData = async () => {
  try {
    const [camRes, conRes, accRes] = await Promise.all([
      apiService.getCameras(), 
      apiService.getCongestion(),
      apiService.getLiveAccidents() // 👈 Use the GIS endpoint, not analytics
    ]);
    setNodes(camRes.data || []);
    setCongestion((conRes.data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.camera_id]: curr }), {}));
    
    // Ensure data is mapped correctly for the useMemo hook in HeatLayer
    setAccidents(accRes.data || []); 
  } catch (err) { 
    console.error("GIS Grid Sync Failed"); 
  }
};

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRoadColor = (level: number) => {
    if (level >= 71) return '#ef4444'; 
    if (level >= 31) return '#f59e0b'; 
    return '#22c55e'; 
  };

  return (
    <div className="h-full w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-xl relative bg-white flex flex-col">
      <MapContainer center={[23.2599, 77.4126]} zoom={13} style={{ height: '100%', width: '100%', flexGrow: 1 }}>
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard View">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* 🔥 The Heatmap is always mounted, but controls its own visibility data */}
        <HeatLayer data={accidents} hour={selectedHour} mode={timeframeMode} isVisible={showHeatmap} />

        {nodes.map((node) => {
          const telemetry = congestion[node.id] || {};
          return (
            <React.Fragment key={node.id}>
              {showTrafficFlow && (
                <Circle 
                  center={[node.latitude, node.longitude]}
                  radius={200}
                  pathOptions={{ 
                      color: getRoadColor(telemetry.congestion_level || 0),
                      fillColor: getRoadColor(telemetry.congestion_level || 0),
                      fillOpacity: 0.25,
                      weight: 3, 
                      opacity: 0.8 
                  }} 
                />
              )}
              
              <Marker position={[node.latitude, node.longitude]} icon={createPoleIcon(true, telemetry.is_emergency)}>
                <Popup>
                  <div className="w-64 font-sans overflow-hidden rounded-lg">
                    <img 
                      src={`${API_BASE_URL}/cameras/live/${node.id}?token=${token}`}
                      className="w-full aspect-video object-cover bg-black"
                      onError={(e) => { e.currentTarget.src = "https://placehold.co/300x200?text=OFFLINE"; }}
                    />
                    <div className="p-3 bg-white">
                      <h4 className="text-sm font-bold text-slate-800 uppercase leading-none">{node.location_name}</h4>
                      <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-widest">ID: {node.id.slice(0,8)}</p>
                      <div className="flex justify-between mt-3 border-t pt-2 items-center">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Activity size={12}/> {telemetry.vehicle_count || 0} Veh
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${telemetry.is_emergency ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                          {telemetry.is_emergency ? 'Emergency' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* 🎛️ ADVANCED CONTROL PANEL */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-3xl bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-slate-200">
        
        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                <Clock size={14} className="text-purple-600"/> GIS Control Center
            </span>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowTrafficFlow(!showTrafficFlow)}
                    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${showTrafficFlow ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                >
                    🚦 Flow: {showTrafficFlow ? 'ON' : 'OFF'}
                </button>

                <button 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${showHeatmap ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                >
                    ⚠️ Heatmap: {showHeatmap ? 'ON' : 'OFF'}
                </button>

                <button 
                    onClick={() => setTimeframeMode(m => m === 'hourly' ? 'daily' : 'hourly')}
                    className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-sm"
                >
                    {timeframeMode === 'hourly' ? '⏱️ Hourly Analysis' : '📅 Full Day Mode'}
                </button>

                {timeframeMode === 'hourly' && (
                  <span className="text-sm font-black text-purple-600 italic ml-2 min-w-[70px]">
                      {selectedHour}:00 {selectedHour >= 12 ? 'PM' : 'AM'}
                  </span>
                )}
            </div>
        </div>
        
        {timeframeMode === 'hourly' ? (
          <input 
            type="range" min="0" max="23" value={selectedHour} 
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        ) : (
          <div className="w-full text-center py-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600/60">
              Aggregating 24-Hour Accident Data Clusters
            </span>
          </div>
        )}
      </div>

      {/* 🧭 GIS LEGEND */}
      <div className="absolute top-24 left-6 z-[1000] bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 p-4 rounded-3xl flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-600 shadow-[0_0_10px_#9333ea]"></div>
            <span className="text-[9px] font-black text-slate-700 uppercase">AI Smart Pole</span>
        </div>
        <div className="flex items-center gap-3 border-t pt-2 border-slate-100">
            <div className="w-5 h-5 rounded-full bg-green-500/30 border-2 border-green-500"></div>
            <span className="text-[9px] font-black text-slate-700 uppercase">Clear Flow</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-red-500"></div>
            <span className="text-[9px] font-black text-slate-700 uppercase">Incident Heat</span>
        </div>
      </div>
    </div>
  );
};

export default BhopalMap;