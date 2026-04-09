import * as React from 'react';
// 1. RECHARTS: For the functional data visualization
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// 2. LUCIDE: For the professional icons (BarChart2 belongs here!)
import { 
  AlertCircle, FileText, Activity, Car, Search, Bell, LayoutGrid, Camera, LogOut, AlertTriangle, BarChart2 
} from 'lucide-react';

import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [violations, setViolations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // FETCH: Real data from your Supabase table
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('violations')
        .select('*')
        .order('detected_at', { ascending: true });

      if (error) throw error;
      setViolations(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    
    // REALTIME: Automatically updates when your Python AI detects a violation
    const channel = supabase
      .channel('db-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'violations' }, 
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // JUDGING LOGIC: Converts database rows into chart trends
  const getTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(m => {
      const monthData = violations.filter(v => 
        v.detected_at && new Date(v.detected_at).toLocaleString('default', { month: 'short' }) === m
      );
      return {
        name: m,
        Helmet: monthData.filter(v => v.violation_type === 'No Helmet').length,
        Triple: monthData.filter(v => v.violation_type === 'Triple Riding').length
      };
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-purple-600">SYNCING LIVE DATA...</div>;

  return (
    <div className="flex bg-[#f8f9fe] min-h-screen font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col p-6 shadow-xl sticky top-0">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center mb-2">
            <span className="text-purple-600 font-black text-xl">PTU</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Bhopal Traffic Updates</p>
        </div>
        <nav className="flex-1 space-y-2">
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm bg-purple-500 text-white shadow-lg shadow-purple-200 cursor-pointer"><LayoutGrid size={20}/> Overview</div>
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-50 transition cursor-pointer"><Camera size={20}/> Surveillance</div>
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="mt-auto flex items-center gap-3 text-red-400 font-bold text-sm p-4 hover:bg-red-50 rounded-xl transition"><LogOut size={18} /> Logout</button>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-black mb-8 text-gray-800 tracking-tight">Today's Live Analytics</h2>

        {/* 1. DYNAMIC STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Detections" val={violations.length} sub="Real-time Feed" color="#a855f7" icon={<Activity size={18}/>} />
          <StatCard title="Approved Fines" val={violations.filter(v => v.status === 'approved').length} sub="E-Challans" color="#ec4899" icon={<FileText size={18}/>} />
          <StatCard title="Pending Review" val={violations.filter(v => v.status === 'pending').length} sub="For Verification" color="#f97316" icon={<AlertCircle size={18}/>} />
          <StatCard title="Paid Records" val={violations.filter(v => v.status === 'paid').length} sub="Settled" color="#6366f1" icon={<Car size={18}/>} />
        </div>

        {/* 2. FUNCTIONAL LINE CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-8 flex items-center gap-2">
              <BarChart2 size={20} className="text-purple-500"/> Violation Trends (MP Nagar & Zone-1)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getTrends()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip />
                  <Line name="Helmet" type="monotone" dataKey="Helmet" stroke="#8b5cf6" strokeWidth={5} dot={false} />
                  <Line name="Triple" type="monotone" dataKey="Triple" stroke="#38bdf8" strokeWidth={5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col items-center justify-center">
            <h3 className="font-bold text-gray-800 mb-10 w-full text-left">System Health</h3>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{v: 95}, {v: 5}]} innerRadius={60} outerRadius={80} dataKey="v" stroke="none">
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-800">95%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, val, sub, color, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 relative overflow-hidden group hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15`, color: color }}>{icon}</div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-black text-gray-800 tracking-tighter">{val}</span>
        <span className="text-[9px] text-gray-400 font-bold mb-2 uppercase tracking-tight">{sub}</span>
      </div>
    </div>
  );
}