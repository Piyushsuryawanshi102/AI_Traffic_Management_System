import { useEffect, useState, useCallback } from 'react';
import { apiService } from '../api/apiService';
import { ExternalLink, Search, Activity, ShieldCheck, Fingerprint, RefreshCw } from 'lucide-react';

const ChallanLogs = () => {
  const design = {
    pageBg: "#020617",
    accentColor: "#9333ea", 
    secondaryAccent: "#3b82f6", 
    glassBg: "rgba(255, 255, 255, 0.03)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
  };

  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLogs = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setIsSyncing(true);
      
      const response = await apiService.getViolations(searchTerm);
      setLogs(response.data || []);
    } catch (err) {
      console.error("BTU Archive Sync Error:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLogs(true);
    // 🔄 Sync with Omen 16 AI Engine every 10 seconds
    const interval = setInterval(() => fetchLogs(false), 10000); 
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="flex-1 relative overflow-y-auto p-8 font-sans transition-all duration-700"
         style={{ backgroundColor: design.pageBg, color: "#ffffff" }}>
      
      {/* 🌌 Atmospheric Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 pointer-events-none"
           style={{ background: `radial-gradient(circle, ${design.accentColor} 0%, transparent 70%)` }}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
              Evidence <span className="text-purple-500">Archives</span>
              {isSyncing && <RefreshCw size={20} className="animate-spin text-purple-500/50" />}
            </h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mt-2">
              Bhopal BTU AI Violation Database
            </p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="FILTER PLATE NUMBER..." 
              className="pl-14 pr-8 py-5 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md outline-none font-black text-xs uppercase tracking-widest w-96 focus:border-purple-500/50 focus:bg-white/10 transition-all text-white placeholder:text-white/10 shadow-2xl"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ backgroundColor: design.glassBg, borderColor: design.glassBorder }}
             className="rounded-[3.5rem] border backdrop-blur-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Vehicle ID</th>
                <th className="p-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Violation Class</th>
                <th className="p-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">AI Confidence</th>
                <th className="p-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Visual Evidence</th>
                <th className="p-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">System Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <Activity className="animate-spin text-purple-500 mx-auto mb-4" size={40} />
                    <span className="font-black text-white/20 uppercase tracking-[0.4em] italic text-xs">Accessing Encrypted Records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <Fingerprint className="text-white/10 mx-auto mb-4" size={48} />
                    <p className="font-black text-white/20 uppercase tracking-widest text-xs italic">No matching logs found in archive</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-all group cursor-default">
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${log.status === 'paid' ? 'bg-green-500' : 'bg-purple-500 shadow-[0_0_10px_#9333ea]'}`}></div>
                        <span className="font-black text-lg text-white tracking-tighter uppercase italic">
                          {log.plate_number || "IDENTIFYING"}
                        </span>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-[9px] font-black uppercase border border-red-500/20 tracking-widest">
                        {log.violation_type}
                      </span>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-white/60 font-black font-mono">
                          {(log.confidence_score * 100).toFixed(1)}%
                        </span>
                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-purple-500" style={{ width: `${log.confidence_score * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <a 
                        href={log.evidence_image_url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group/link inline-flex items-center gap-3 bg-white/5 hover:bg-purple-600 px-6 py-3 rounded-2xl transition-all border border-white/5 shadow-lg"
                      >
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">View Capture</span>
                        <ExternalLink size={14} className="text-white group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2">
                        {log.status === 'paid' ? (
                          <ShieldCheck size={16} className="text-green-500" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          log.status === 'paid' ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {log.status === 'paid' ? 'Case Resolved' : 'Awaiting Action'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
            <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-4 backdrop-blur-xl">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Total Entries Indexed:</span>
                <span className="text-sm font-black text-purple-400 italic">{logs.length}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanLogs;