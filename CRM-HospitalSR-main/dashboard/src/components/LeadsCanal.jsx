// src/components/LeadsCanal.jsx
import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { getLeadsPorCanal } from "../api";

const CORES = ["#10b981","#3b82f6","#f59e0b","#a78bfa","#ef4444","#06b6d4"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p className="text-gray-400">{payload[0].value} lead(s)</p>
    </div>
  );
};

export default function LeadsCanal() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeadsPorCanal()
      .then(({ data }) =>
        setData((data.canais || []).map(c => ({
          name:  c.canal_origem || "Não informado",
          value: c.total,
        })))
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">Leads por Canal de Origem</h2>
      {loading ? (
        <div className="h-48 bg-gray-800 animate-pulse rounded-lg" />
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Sem dados de canal.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={80} innerRadius={45}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
