import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Camera, Car, AlertTriangle, 
  ParkingCircle, FileText, BarChart2 
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Overview', icon: <LayoutGrid size={20}/>, path: '/admin' },
    { name: 'Surveillance', icon: <Camera size={20}/>, path: '/admin/surveillance' },
    { name: 'Traffic', icon: <Car size={20}/>, path: '/admin/traffic' },
    { name: 'Accidents', icon: <AlertTriangle size={20}/>, path: '/admin/accidents' },
    { name: 'Parking', icon: <ParkingCircle size={20}/>, path: '/admin/parking' },
    { name: 'E-Challan', icon: <FileText size={20}/>, path: '/admin/challans' },
    { name: 'Reports', icon: <BarChart2 size={20}/>, path: '/admin/reports' },
  ];

  return (
    <div className="w-64 bg-white h-screen sticky top-0 border-r border-gray-100 flex flex-col p-6 shadow-xl z-20">
      {/* LOGO SECTION */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center mb-2">
          <span className="text-purple-600 font-black text-xl">PTU</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
          Pune <br /> Traffic Updates
        </p>
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              location.pathname === item.path 
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}