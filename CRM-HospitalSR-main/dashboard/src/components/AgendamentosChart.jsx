// src/components/AgendamentosChart.jsx
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getAgendamentosPorDia } from "../api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="font-semibold text-emerald-400">{payload[0].value} agendamento(s)</p>
    </div>
  );
};

export default function AgendamentosChart({ dias = 30 }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgendamentosPorDia(dias)
      .then(({ data }) =>
        setData((data.agendamentos_por_dia || []).map(d => ({
          dia:   d.dia,
          total: d.total,
        })))
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [dias]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-1">
        Agendamentos nos Últimos {dias} Dias
      </h2>
      <p className="text-xs text-gray-600 mb-4">Volume diário de consultas agendadas</p>
      {loading ? (
        <div className="h-48 bg-gray-800 animate-pulse rounded-lg" />
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Sem agendamentos no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="dia" tick={{ fill: "#6b7280", fontSize: 10 }}
              tickFormatter={v => v.slice(5)} // mostra MM-DD
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="total"
              stroke="#10b981" strokeWidth={2}
              fill="url(#grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
