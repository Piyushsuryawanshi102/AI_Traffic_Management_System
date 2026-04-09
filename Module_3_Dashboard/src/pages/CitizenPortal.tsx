import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, CreditCard, FileText, CheckCircle, IndianRupee } from 'lucide-react';

export default function CitizenPortal() {
  const [plate, setPlate] = useState('');
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Search Logic
  const searchChallans = async () => {
    if (!plate) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('violations')
      .select('*')
      .eq('plate_number', plate.toUpperCase())
      .in('status', ['approved', 'paid']); // Show approved (unpaid) and already paid ones

    if (!error) setChallans(data || []);
    setLoading(false);
  };

  // 2. Payment Logic (Fixed the 3 errors)
  const handlePayment = async (challanId: string) => {
    const confirmed = window.confirm("Proceed to pay ₹500 for this traffic violation?");
    
    if (confirmed) {
      const { error } = await supabase
        .from('violations')
        .update({ status: 'paid' }) 
        .eq('id', challanId);

      if (!error) {
        alert("✅ Payment Successful! Your challan has been cleared.");
        searchChallans(); // Now this works because it's inside the same component
      } else {
        alert("❌ Payment Failed: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-800">Bhopal e-Challan Portal</h1>
        <p className="text-gray-500 font-medium">Verify and Settle Traffic Violations Online</p>
      </div>

      {/* SEARCH BOX */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Enter Vehicle No. (e.g. MP04AB1234)"
              className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-lg"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </div>
          <button 
            onClick={searchChallans}
            className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition shadow-lg"
          >
            Search
          </button>
        </div>
      </div>

      {/* RESULTS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400 animate-pulse">Searching government records...</div>
        ) : challans.length > 0 ? (
          challans.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center transition hover:border-blue-200">
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-xl ${c.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-800">{c.violation_type}</h4>
                  <p className="text-sm text-gray-500 font-medium">
                    {new Date(c.detected_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-gray-900 flex items-center justify-end">
                  <IndianRupee size={20} /> 500
                </p>
                
                {c.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold text-sm mt-2">
                    <CheckCircle size={16} /> CLEAR
                  </span>
                ) : (
                  <button 
                    onClick={() => handlePayment(c.id)}
                    className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-100 transition active:scale-95"
                  >
                    <CreditCard size={16} /> Pay Fine
                  </button>
                )}
              </div>
            </div>
          ))
        ) : plate && (
          <div className="text-center py-20 bg-green-50 rounded-3xl border border-dashed border-green-200">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
            <h3 className="text-2xl font-black text-green-800">Clear Record!</h3>
            <p className="text-green-600 font-medium">No pending violations found for <span className="underline">{plate.toUpperCase()}</span>.</p>
          </div>
        )}
      </div>
    </div>
  );
}