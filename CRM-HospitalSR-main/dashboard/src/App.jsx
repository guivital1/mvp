// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, CalendarCheck, AlertTriangle,
  Activity, RefreshCw, UserRound, Stethoscope,
  ClipboardList, ClipboardCheck, DollarSign,
} from "lucide-react";

import { getKpis } from "./api";
import KpiCard             from "./components/KpiCard";
import FunilLeads          from "./components/FunilLeads";
import LeadsCanal          from "./components/LeadsCanal";
import AgendamentosChart   from "./components/AgendamentosChart";
import TabelaLeads         from "./components/TabelaLeads";
import TabelaAgendamentos  from "./components/TabelaAgendamentos";
import AlertasSac          from "./components/AlertasSac";
import TabelaPacientes     from "./components/TabelaPacientes";
import TabelaMedicos       from "./components/TabelaMedicos";
import TabelaProcedimentos from "./components/TabelaProcedimentos";
import PreCirurgico        from "./components/PreCirurgico";
import TabelaOrcamentos    from "./components/TabelaOrcamentos";

const NAV = [
  { id: "overview",      label: "Visão Geral",   icon: LayoutDashboard },
  { id: "pacientes",     label: "Pacientes",      icon: UserRound },
  { id: "medicos",       label: "Médicos",        icon: Stethoscope },
  { id: "procedimentos", label: "Procedimentos",  icon: ClipboardList },
  { id: "leads",         label: "Leads",          icon: Users },
  { id: "agendamentos",  label: "Agendamentos",   icon: CalendarCheck },
  { id: "orcamentos",    label: "Orçamentos",     icon: DollarSign },
  { id: "pre_cirurgico", label: "Pré-Cirúrgico",  icon: ClipboardCheck },
  { id: "sac",           label: "SAC / Alertas",  icon: AlertTriangle },
];

export default function App() {
  const [tab, setTab]         = useState("overview");
  const [kpis, setKpis]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchKpis = useCallback(async () => {
    try {
      setErro(null);
      const { data } = await getKpis();
      setKpis(data);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch {
      setErro("Não foi possível conectar à API. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    const id = setInterval(fetchKpis, 60_000);
    return () => clearInterval(id);
  }, [fetchKpis]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">

      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
        <div className="px-5 py-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-400" size={22} />
            <div>
              <p className="text-sm font-bold text-white leading-tight">Hospital</p>
              <p className="text-xs text-emerald-400 font-semibold tracking-wide">SÃO RAFAEL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${tab === id
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
            >
              <Icon size={16} />
              {label}
              {id === "sac"       && kpis?.alertas?.sac_prazo_vencido > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {kpis.alertas.sac_prazo_vencido}
                </span>
              )}
              {id === "pacientes"     && kpis?.totais?.pacientes     > 0 && <span className="ml-auto text-xs text-gray-600">{kpis.totais.pacientes}</span>}
              {id === "medicos"       && kpis?.totais?.medicos        > 0 && <span className="ml-auto text-xs text-gray-600">{kpis.totais.medicos}</span>}
              {id === "procedimentos" && kpis?.totais?.procedimentos  > 0 && <span className="ml-auto text-xs text-gray-600">{kpis.totais.procedimentos}</span>}
              {id === "orcamentos"    && kpis?.totais?.orcamentos     > 0 && <span className="ml-auto text-xs text-gray-600">{kpis.totais.orcamentos}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={fetchKpis} className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={12} />
            {lastUpdate ? `Atualizado ${lastUpdate}` : "Atualizando..."}
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <main className="ml-56 p-8 min-h-screen">

        {erro && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle size={16} /> {erro}
          </div>
        )}

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
              <p className="text-gray-500 text-sm mt-1">Painel executivo em tempo real</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-28 bg-gray-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : kpis ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Pacientes"    value={kpis.totais.pacientes}    icon="👥" color="blue"    delay={0}   />
                <KpiCard label="Leads Totais" value={kpis.totais.leads}        icon="🎯" color="purple"  delay={50}  />
                <KpiCard label="Agendamentos" value={kpis.totais.agendamentos} icon="📅" color="emerald" delay={100} />
                <KpiCard label="Médicos"      value={kpis.totais.medicos}      icon="👨‍⚕️" color="sky"     delay={150} />
                <KpiCard
                  label="Taxa de Conversão"
                  value={`${kpis.leads.taxa_conversao_pct}%`}
                  icon="📈" delay={200}
                  color={kpis.leads.taxa_conversao_pct >= 30 ? "emerald" : "yellow"}
                  sub={`${kpis.leads.convertidos} convertidos`}
                />
                <KpiCard
                  label="Taxa de Falta"
                  value={`${kpis.agendamentos.taxa_falta_pct}%`}
                  icon="❌" delay={250}
                  color={kpis.agendamentos.taxa_falta_pct > 15 ? "red" : "emerald"}
                  sub={`${kpis.agendamentos.faltas} falta(s)`}
                />
                <KpiCard label="Agend. Hoje"  value={kpis.agendamentos.hoje}   icon="🗓️" color="orange" delay={300} />
                <KpiCard
                  label="SAC em Aberto"
                  value={kpis.totais.sac_abertos}
                  icon="🔔" delay={350}
                  color={kpis.alertas.sac_prazo_vencido > 0 ? "red" : "gray"}
                  sub={kpis.alertas.sac_prazo_vencido > 0 ? `${kpis.alertas.sac_prazo_vencido} vencido(s)` : "Em dia"}
                />
              </div>
            ) : null}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FunilLeads />
              <LeadsCanal />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgendamentosChart dias={30} />
              <AlertasSac compact />
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Pacientes</h1><p className="text-gray-500 text-sm mt-1">Clique em "Ver detalhes" para histórico completo</p></div>
            <TabelaPacientes />
          </div>
        )}

        {tab === "medicos" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Médicos</h1><p className="text-gray-500 text-sm mt-1">Cadastre, visualize estatísticas e remova médicos</p></div>
            <TabelaMedicos />
          </div>
        )}

        {tab === "procedimentos" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Procedimentos</h1><p className="text-gray-500 text-sm mt-1">Gerencie o catálogo de procedimentos</p></div>
            <TabelaProcedimentos />
          </div>
        )}

        {tab === "leads" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Leads</h1><p className="text-gray-500 text-sm mt-1">Gestão do funil CRM</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FunilLeads />
              <LeadsCanal />
            </div>
            <TabelaLeads />
          </div>
        )}

        {tab === "agendamentos" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Agendamentos</h1><p className="text-gray-500 text-sm mt-1">Crie e gerencie consultas e procedimentos</p></div>
            <AgendamentosChart dias={30} />
            <TabelaAgendamentos />
          </div>
        )}

        {tab === "orcamentos" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
              <p className="text-gray-500 text-sm mt-1">Crie orçamentos, acompanhe o status e visualize a receita</p>
            </div>
            <TabelaOrcamentos />
          </div>
        )}

        {tab === "pre_cirurgico" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Pré-Cirúrgico & Histórico</h1><p className="text-gray-500 text-sm mt-1">Checklist pré-operatório e histórico completo do paciente</p></div>
            <PreCirurgico />
          </div>
        )}

        {tab === "sac" && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">SAC / Alertas</h1><p className="text-gray-500 text-sm mt-1">Reclamações e prazos críticos</p></div>
            <AlertasSac />
          </div>
        )}

      </main>
    </div>
  );
}
