import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Page Imports
import AdminDashboard from './pages/AdminDashboard';
import OfficerPanel from './pages/OfficerPanel';
import CitizenPortal from './pages/CitizenPortal';
import Login from './pages/Login';


// Icon Imports
import { 
  LayoutDashboard, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  BarChart3 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Initializing PTU Systems...</div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* TOP NAVIGATION BAR */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Shield size={20} />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tighter uppercase">PTU Bhopal</span>
            </div>

            <div className="flex gap-6 items-center">
              {/* Public Link */}
              <Link to="/citizen" className="text-gray-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition">
                <UserIcon size={16} /> Citizen Portal
              </Link>
              
              {session ? (
                <div className="flex items-center gap-5 pl-6 border-l border-gray-200">
                  {/* Admin Analytics Link */}
                  <Link to="/admin" className="flex items-center gap-2 text-gray-800 hover:text-blue-600 font-bold text-sm">
                    <BarChart3 size={18}/> Analytics
                  </Link>
                  {/* Officer Verification Link */}
                  <Link to="/" className="flex items-center gap-2 text-gray-800 hover:text-blue-600 font-bold text-sm">
                    <LayoutDashboard size={18}/> Verification
                  </Link>
                  <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-100 transition"
                  >
                    <LogOut size={16}/> Logout
                  </button>
                </div>
              ) : (
                <Link to="/" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition">
                  Officer Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN ROUTER CONTENT */}
        <div className="py-4">
          <Routes>
            <Route path="/citizen" element={<CitizenPortal />} />
            
            {/* If logged in, allow access to Admin and Officer panels */}
            <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <OfficerPanel /> : <Login />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}