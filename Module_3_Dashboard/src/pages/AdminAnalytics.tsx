import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Sample data structure for the chart
const data = [
  { name: 'MP Nagar', violations: 12 },
  { name: 'Arera Colony', violations: 7 },
  { name: 'New Market', violations: 15 },
  { name: 'Bairagarh', violations: 4 },
];

export default function AdminAnalytics() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Violations by Hotspot Area</h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="violations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}