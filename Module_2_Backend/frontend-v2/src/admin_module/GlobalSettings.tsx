import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Database, ShieldAlert, Sliders, HardDriveDownload } from 'lucide-react';

const GlobalSettings = () => {
  const [config, setConfig] = useState<any>(null);
  const [localFines, setLocalFines] = useState<any>({}); // Track changes before saving

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const token = localStorage.getItem('access_token');
    const res = await axios.get('http://127.0.0.1:8000/admin/module/settings/config', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setConfig(res.data);
    setLocalFines(res.data.fine_multipliers);
  };

  // 🔥 This function sends the data to the DB
 const handleDeploy = async () => {
  const token = localStorage.getItem('access_token');
  try {
    // Wrap localFines in the 'new_fines' key as expected by the backend
    await axios.post('http://127.0.0.1:8000/admin/module/settings/update-fines', 
      { new_fines: localFines }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("SYSTEM POLICY DEPLOYED: New rates are now LIVE.");
  } catch (err) {
    console.error("Deployment failed", err);
  }
};

  const updateLocalFine = (key: string, value: number) => {
    setLocalFines({ ...localFines, [key]: value });
  };

  if (!config) return <div className="p-20 text-red-500 animate-pulse font-black italic">Accessing Core Mainframe...</div>;

  return (
    <div className="p-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">The <span className="text-red-600">Architect</span></h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-2 italic">Global System Configuration & Scaling</p>
        </div>
        
        {/* 🔥 DEPLOY BUTTON NOW TRIGGERS THE UPDATE */}
        <button 
          onClick={handleDeploy}
          className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 active:scale-95"
        >
          <Save size={16} /> Deploy Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white/5 border border-white/5 p-10 rounded-[4rem] backdrop-blur-xl">
          <h3 className="text-sm font-black uppercase text-white/30 mb-8 tracking-widest flex items-center gap-2 italic">
            <Sliders size={16} className="text-red-500" /> Fine Scaling (₹)
          </h3>
          <div className="space-y-10">
            {Object.entries(localFines).map(([key, val]: any) => (
              <div key={key}>
                <div className="flex justify-between mb-4">
                  <span className="text-xs font-black text-white uppercase italic">{key} Violation</span>
                  <span className="text-xs font-black text-red-500">₹{val}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="50"
                  value={val} 
                  onChange={(e) => updateLocalFine(key, parseInt(e.target.value))}
                  className="w-full accent-red-600 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* System Operations Section stays same as your previous code */}
        <div className="space-y-8">
            {/* ... Your System Status & Manual Sync cards ... */}
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;