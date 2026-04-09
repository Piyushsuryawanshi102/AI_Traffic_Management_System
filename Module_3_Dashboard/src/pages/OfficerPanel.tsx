import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Car, MapPin } from 'lucide-react';

export default function OfficerPanel() {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Violations from Supabase
  async function fetchViolations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('violations')
      .select('*')
      .order('detected_at', { ascending: false });

    if (error) console.error('Error fetching data:', error);
    else setViolations(data || []);
    setLoading(false);
  }

  // 2. Approve Violation (Create Challan)
  async function handleApprove(id: string) {
    const { error } = await supabase
      .from('violations')
      .update({ status: 'approved' })
      .eq('id', id);
      
    if (!error) fetchViolations(); // Refresh list
  }

  // 3. Reject Violation
  async function handleReject(id: string) {
    const { error } = await supabase
      .from('violations')
      .update({ status: 'rejected' })
      .eq('id', id);
      
    if (!error) fetchViolations(); // Refresh list
  }

  useEffect(() => {
    fetchViolations();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchViolations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              🚦 Bhopal Traffic Control <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Officer Panel</span>
            </h1>
            <p className="text-gray-500 mt-1">Real-time AI Violation Monitoring System</p>
          </div>
          <button 
            onClick={fetchViolations}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 font-medium">Pending Review</h3>
              <p className="text-3xl font-bold text-gray-800">{violations.filter(v => v.status === 'pending').length}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 font-medium">Challans Issued</h3>
              <p className="text-3xl font-bold text-gray-800">{violations.filter(v => v.status === 'approved').length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 font-medium">Total Detections</h3>
              <p className="text-3xl font-bold text-gray-800">{violations.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <Car size={24} />
            </div>
          </div>
        </div>

        {/* VIOLATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {violations.map((v) => (
            <div key={v.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition hover:shadow-lg">
              {/* Image Area */}
              <div className="relative h-48 bg-gray-900 group">
                <img 
                  src={v.evidence_image_url} 
                  alt="Evidence" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {(v.confidence_score * 100).toFixed(0)}% Match
                </div>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <MapPin size={12} /> Camera-01 (Bhopal MP Nagar)
                </div>
              </div>

              {/* Data Area */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{v.violation_type}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                    v.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    v.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {v.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  📅 {new Date(v.detected_at).toLocaleString()}
                </p>

                {/* Buttons only appear if Pending */}
                {v.status === 'pending' ? (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleApprove(v.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button 
                      onClick={() => handleReject(v.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center text-sm text-gray-400 italic">
                    Case Closed
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {violations.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">All Clear!</h3>
              <p className="text-gray-500">No violations detected at this moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}