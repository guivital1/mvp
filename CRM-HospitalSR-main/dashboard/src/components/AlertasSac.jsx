// src/components/AlertasSac.jsx
import { useEffect, useState } from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { getSac } from "../api";

const STATUS_CONFIG = {
  pendente:      { cor: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    icon: AlertTriangle },
  "em tratativa":{ cor: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  resolvido:     { cor: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
};

function SacItem({ item }) {
  const cfg  = STATUS_CONFIG[item.status_solucao] || STATUS_CONFIG.pendente;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${item.prazo_vencido ? "ring-1 ring-red-500/40" : ""}`}>
      <Icon size={16} className={`mt-0.5 flex-shrink-0 ${cfg.cor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white truncate">{item.paciente}</p>
          {item.prazo_vencido && (
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              VENCIDO
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.motivo}</p>
        <p className="text-xs text-gray-600 mt-1">Prazo: {item.prazo_limite}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${cfg.cor} bg-black/20`}>
        {item.status_solucao}
      </span>
    </div>
  );
}

export default function AlertasSac({ compact = false }) {
  const [sac, setSac]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState("");

  useEffect(() => {
    getSac(filtro)
      .then(({ data }) => setSac(data.sac || []))
      .catch(() => setSac([]))
      .finally(() => setLoading(false));
  }, [filtro]);

  const vencidos  = sac.filter(s => s.prazo_vencido).length;
  const pendentes = sac.filter(s => s.status_solucao === "pendente").length;
  const exibidos  = compact ? sac.slice(0, 5) : sac;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-300 flex-1">
          SAC / Reclamações
          <span className="ml-2 text-gray-600 font-normal">({sac.length})</span>
        </h2>

        {vencidos > 0 && (
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">
            {vencidos} vencido{vencidos > 1 ? "s" : ""}
          </span>
        )}
        {pendentes > 0 && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-full">
            {pendentes} pendente{pendentes > 1 ? "s" : ""}
          </span>
        )}

        {!compact && (
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="em tratativa">Em tratativa</option>
            <option value="resolvido">Resolvido</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sac.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Nenhum SAC em aberto. 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Vencidos primeiro */}
          {exibidos
            .sort((a, b) => (b.prazo_vencido ? 1 : 0) - (a.prazo_vencido ? 1 : 0))
            .map(item => <SacItem key={item.id_sac} item={item} />)
          }
          {compact && sac.length > 5 && (
            <p className="text-xs text-gray-600 text-center pt-1">
              + {sac.length - 5} registro(s). Acesse a aba SAC para ver todos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
