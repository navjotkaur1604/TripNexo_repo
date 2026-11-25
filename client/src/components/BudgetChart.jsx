import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function BudgetChart({ breakdown }) {
  if (!breakdown) return null;

  const data = [
    { name: 'Stay', min: breakdown.accommodation?.min || 0, max: breakdown.accommodation?.max || 0 },
    { name: 'Food', min: breakdown.food?.min || 0, max: breakdown.food?.max || 0 },
    { name: 'Local', min: breakdown.localTransport?.min || 0, max: breakdown.localTransport?.max || 0 },
    {
      name: 'Intercity',
      min: breakdown.intercityTransport?.min || 0,
      max: breakdown.intercityTransport?.max || 0,
    },
    { name: 'Activities', min: breakdown.activities?.min || 0, max: breakdown.activities?.max || 0 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">
        Min vs Max Category Estimate (INR)
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#f8fafc',
              }}
              formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
            />
            <Legend />
            <Bar dataKey="min" name="Min Estimate" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="max" name="Max Estimate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
