import React, { useState } from 'react';
import { apiService } from '../api/apiService';
import { 
  Search, 
  CreditCard, 
  CheckCircle, 
  ShieldAlert, 
  ExternalLink, 
  MapPin, 
  Activity, 
  FileText,
  AlertTriangle,
  Download // 🔥 Added Download icon
} from 'lucide-react';

interface CitizenPortalProps {
  onGoToLogin: () => void;
}
// 🎨 COLOR CONTROL: Change 'pageBg' to any hex code (e.g., #000000 for pure black)
  const design = {
    pageBg: "#020617",         // Deep Midnight Black (Change this!)
    accentColor: "#9333ea",    // Electric Purple glow
    secondaryAccent: "#3b82f6" // Neon Blue glow
  };
const CitizenPortal: React.FC<CitizenPortalProps> = ({ onGoToLogin }) => {
  const [plate, setPlate] = useState('');
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = plate.replace(/[-\s]/g, "").toUpperCase();
    if (!cleanPlate) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await apiService.getCitizenChallans(cleanPlate);
      setChallans(res.data || []);
      setPlate(cleanPlate); 
    } catch (err) {
      console.error("Search failed:", err);
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (id: string) => {
    try {
      setLoading(true);
      await apiService.payChallan(id);
      const cleanPlate = plate.replace(/[-\s]/g, "").toUpperCase();
      const res = await apiService.getCitizenChallans(cleanPlate);
      setChallans(res.data || []);
      alert("Payment Successful! Bhopal Traffic Department thanks you for your compliance.");
    } catch (err) {
      alert("Payment simulation failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function placed inside the component for clean scope
  const handleDownloadReceipt = (challanId: string) => {
    window.open(`http://127.0.0.1:8000/citizen/receipt/${challanId}`, '_blank');
  };

  return (
<div 
      className="min-h-screen relative overflow-y-auto flex flex-col items-center pb-20 font-sans transition-colors duration-500"
      style={{ backgroundColor: design.pageBg, color: "#ffffff" }}
    >
      {/* 🌌 Atmospheric Background Auras (These make the background look attractive) */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 pointer-events-none animate-pulse"
        style={{ background: `radial-gradient(circle, ${design.accentColor} 0%, transparent 70%)` }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${design.secondaryAccent} 0%, transparent 70%)` }}
      ></div>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
<div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2.5rem] flex justify-between items-center shadow-2xl">    
    {/* 🏛️ Branding Section */}
    <div className="flex items-center gap-4">
      <div className="relative">
<div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-500/50 relative z-10">          <ShieldAlert size={22} />
        </div>
        {/* Subtle glow behind icon */}
        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30"></div>
      </div>
      
      <div>
        <h1 className="text-sm font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-2">
          Bhopal <span className="text-purple-600">E-Challan</span>
        </h1>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mt-0.5">
          Public Safety Portal
        </p>
      </div>
    </div>

    {/* 🔐 Access Section */}
   <div className="flex items-center gap-6">
  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/5">
    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
    <span className="text-[9px] font-black text-white uppercase tracking-widest">Systems Active</span>
  </div>
  {/* Officer Login button text should also be text-white or gray-300 */}

      
      <button 
        onClick={onGoToLogin}
        className="group text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-purple-600 flex items-center gap-2 transition-all duration-300"
      >
        Officer Login 
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
          <ExternalLink size={14} />
        </div>
      </button>
    </div>
  </div>
</nav>

         <div className="w-full max-w-2xl mt-56 px-6 text-center">
            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-[0.9] mb-4">
          Check Your <span className="text-purple-600 underline decoration-8 underline-offset-8">Traffic Health</span>
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mb-12">
          Official Digital Secretariat — Bhopal, Madhya Pradesh
        </p>

        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="MP04 AB 1234"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="w-full p-8 bg-white border-4 border-gray-100 rounded-[2.5rem] focus:border-purple-600 outline-none font-black text-4xl text-center uppercase transition-all shadow-2xl shadow-purple-100 placeholder:text-gray-100 text-slate-800"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-4 top-4 bg-purple-600 hover:bg-black p-5 rounded-[2rem] text-white shadow-xl transition-all active:scale-90 flex items-center justify-center min-w-[70px]"
          >
            {loading ? <Activity className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>
      </div>

      <div className="w-full max-w-3xl mt-20 px-6 space-y-6">
        {hasSearched && challans.length === 0 && !loading && (
          <div className="bg-green-50 border-2 border-green-100 p-12 rounded-[3.5rem] text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-green-800 uppercase italic">All Clear!</h3>
            <p className="text-green-600 font-bold text-sm mt-2">No pending records for <span className="underline">{plate}</span>. Safe driving!</p>
          </div>
        )}

        {challans.map((challan) => (
          <div key={challan.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-2xl transition-all group">
            <div className="flex items-center gap-6">
              <div className="p-6 rounded-[2.2rem] bg-gray-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <FileText size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">
                  {challan.violations?.violation_type || 'TRAFFIC FINE'}
                </p>
                <h3 className="text-3xl font-black text-slate-900">₹{challan.amount}</h3>
                <div className="flex items-center gap-2 text-gray-400 mt-2">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider italic">Bhopal Smart City Surveillance</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              {challan.status === 'paid' ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-green-100 text-green-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={18} /> Fully Paid
                  </div>
                  {/* 🔥 Receipt Button for Paid Challans */}
                  <button 
                    onClick={() => handleDownloadReceipt(challan.id)}
                    className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-black flex items-center gap-2 transition-colors mr-2"
                  >
                    <Download size={14} /> Receipt
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handlePayment(challan.id)}
                  disabled={loading}
                  className="w-full md:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-3 group/btn"
                >
                  <CreditCard size={18} className="group-hover/btn:rotate-12 transition-transform" /> 
                  Pay Now
                </button>
              )}
              <div className="flex flex-col items-end opacity-40 mr-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
                  REF_ID: {challan.id.split('-')[0]}
                </span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
                   {new Date(challan.issued_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl mt-24 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex gap-6 items-center">
        <div className="text-amber-500">
            <AlertTriangle size={32} />
        </div>
        <div>
            <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Compliance Notice</h4>
            <p className="text-[10px] font-bold text-amber-700 mt-1 leading-relaxed">
                As per the Motor Vehicles Act, all e-challans must be settled within 60 days of issuance. 
            </p>
        </div>
      </div>

      <div className="mt-20 flex items-center gap-4 opacity-20">
        <div className="h-[2px] w-12 bg-slate-400 rounded-full"></div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Bhopal PTU Secure Gateway</p>
        <div className="h-[2px] w-12 bg-slate-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default CitizenPortal;