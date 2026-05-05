// src/components/FunilLeads.jsx
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getFunil } from "../api";

const CORES = {
  novo:            "#3b82f6",
  "em atendimento":"#f59e0b",
  convertido:      "#10b981",
  perdido:         "#ef4444",
  reagendado:      "#a78bfa",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white capitalize">{d.status_lead}</p>
      <p className="text-gray-400">{d.total} lead(s)</p>
    </div>
  );
};

export default function FunilLeads() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFunil()
      .then(({ data }) => setData(data.funil || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">Funil de Leads por Status</h2>
      {loading ? (
        <div className="h-48 bg-gray-800 animate-pulse rounded-lg" />
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Sem dados de leads.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis
              type="category" dataKey="status_lead"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={CORES[entry.status_lead] || "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
