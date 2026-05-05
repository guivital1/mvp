// src/components/TabelaOrcamentos.jsx
import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Plus, X, DollarSign, User,
  Stethoscope, FileText, TrendingUp, TrendingDown,
} from "lucide-react";
import { getPacientes, getMedicos, getProcedimentos } from "../api";
import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:8000", timeout: 8000 });

const STATUS_CORES = {
  aberto:          "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "em andamento":  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fechado:         "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  encerrado:       "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_EMOJI = {
  aberto: "🔵", "em andamento": "🟡", fechado: "✅", encerrado: "🔴",
};

const STATUS_LISTA = ["aberto", "em andamento", "fechado", "encerrado"];


// ══════════════════════════════════════════════════════════════════
//  MODAL NOVO ORÇAMENTO
// ══════════════════════════════════════════════════════════════════
function ModalNovoOrcamento({ onClose, onSalvo }) {
  const [pacientes, setPacientes] = useState([]);
  const [medicos,   setMedicos]   = useState([]);
  const [procs,     setProcs]     = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const [form, setForm] = useState({
    id_paciente: "", id_medico: "",
    id_procedimento: "", valor_total: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([getPacientes(), getMedicos(), getProcedimentos()])
      .then(([pRes, mRes, prRes]) => {
        setPacientes(pRes.data.pacientes  || []);
        setMedicos(mRes.data.medicos      || []);
        setProcs(prRes.data.procedimentos || []);
      })
      .catch(() => {})
      .finally(() => setLoadingDados(false));
  }, []);

  // Auto-preenche valor base quando seleciona procedimento
  const handleProcChange = (id) => {
    set("id_procedimento", id);
    const proc = procs.find(p => p.id_procedimento === parseInt(id));
    if (proc?.valor_base) set("valor_total", proc.valor_base.toString());
  };

  const salvar = async () => {
    if (!form.id_paciente || !form.id_medico || !form.id_procedimento || !form.valor_total) {
      setErro("Todos os campos são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await http.post("/orcamentos", {
        id_paciente:     parseInt(form.id_paciente),
        id_medico:       parseInt(form.id_medico),
        id_procedimento: parseInt(form.id_procedimento),
        valor_total:     parseFloat(form.valor_total),
      });
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao criar orçamento.");
    } finally {
      setSalvando(false);
    }
  };

  const pacSel  = pacientes.find(p => p.id_paciente      === parseInt(form.id_paciente));
  const medSel  = medicos.find(m   => m.id_medico        === parseInt(form.id_medico));
  const procSel = procs.find(p     => p.id_procedimento  === parseInt(form.id_procedimento));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3 rounded-t-2xl z-10">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <Plus size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Novo Orçamento</p>
            <p className="text-xs text-gray-500">Preencha os dados do orçamento</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loadingDados ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Paciente */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <User size={11} /> Paciente *
                </label>
                <select
                  value={form.id_paciente}
                  onChange={e => set("id_paciente", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Selecione o paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nome_completo} — CPF: {p.cpf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Médico */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Stethoscope size={11} /> Médico *
                </label>
                <select
                  value={form.id_medico}
                  onChange={e => set("id_medico", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Selecione o médico...</option>
                  {medicos.map(m => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nome_medico} — {m.especialidade || "Especialista"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Procedimento */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <FileText size={11} /> Procedimento *
                </label>
                <select
                  value={form.id_procedimento}
                  onChange={e => handleProcChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Selecione o procedimento...</option>
                  {procs.map(p => (
                    <option key={p.id_procedimento} value={p.id_procedimento}>
                      {p.nome_especifico} {p.valor_base ? `— R$ ${Number(p.valor_base).toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
                {procSel?.valor_base && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Valor base preenchido automaticamente. Ajuste se necessário.
                  </p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={11} /> Valor Total (R$) *
                </label>
                <input
                  value={form.valor_total}
                  onChange={e => set("valor_total", e.target.value)}
                  placeholder="ex: 12500.00"
                  type="number"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Preview */}
              {(pacSel || medSel || procSel || form.valor_total) && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Resumo do Orçamento</p>
                  {pacSel && <div className="flex justify-between text-sm"><span className="text-gray-500">Paciente</span><span className="text-white font-medium">{pacSel.nome_completo}</span></div>}
                  {medSel && <div className="flex justify-between text-sm"><span className="text-gray-500">Médico</span><span className="text-white font-medium">{medSel.nome_medico}</span></div>}
                  {procSel && <div className="flex justify-between text-sm"><span className="text-gray-500">Procedimento</span><span className="text-white font-medium">{procSel.nome_especifico}</span></div>}
                  {form.valor_total && (
                    <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/20">
                      <span className="text-gray-500 font-semibold">Valor Total</span>
                      <span className="text-emerald-400 font-bold text-base">
                        R$ {Number(form.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {erro && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{erro}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  {salvando ? "Criando..." : "Criar Orçamento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  MODAL ATUALIZAR STATUS
// ══════════════════════════════════════════════════════════════════
function ModalAtualizarStatus({ orc, onClose, onAtualizado }) {
  const [novoStatus, setNovoStatus] = useState(orc.status_orc);
  const [motivo, setMotivo]         = useState("");
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState("");

  const salvar = async () => {
    if (novoStatus === "encerrado" && !motivo.trim()) {
      setErro("Motivo é obrigatório para encerramento.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await http.patch(`/orcamentos/${orc.id_orcamento}/status`, {
        status_orc: novoStatus,
        motivo_perda: motivo || null,
      });
      onAtualizado(orc.id_orcamento, novoStatus, motivo);
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao atualizar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center">
            <FileText size={18} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Atualizar Status</p>
            <p className="text-xs text-gray-500">{orc.paciente} — R$ {Number(orc.valor_total).toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Selecione o novo status:</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_LISTA.map(s => (
                <button
                  key={s}
                  onClick={() => setNovoStatus(s)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all capitalize
                    ${novoStatus === s
                      ? STATUS_CORES[s]
                      : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}
                >
                  {STATUS_EMOJI[s]} {s}
                </button>
              ))}
            </div>
          </div>

          {novoStatus === "encerrado" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Motivo da perda *</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Descreva o motivo do encerramento..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>
          )}

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{erro}</div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function TabelaOrcamentos() {
  const [orcs, setOrcs]         = useState([]);
  const [filtro, setFiltro]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [orcStatus, setOrcStatus] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtro ? { status: filtro } : {};
      const { data } = await http.get("/orcamentos", { params });
      setOrcs(data.orcamentos || []);
    } catch {
      setOrcs([]);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { fetch(); }, [fetch]);

  // KPIs rápidos
  const totalValor  = orcs.reduce((s, o) => s + Number(o.valor_total), 0);
  const totalFechado = orcs.filter(o => o.status_orc === "fechado").reduce((s, o) => s + Number(o.valor_total), 0);
  const totalPerdido = orcs.filter(o => o.status_orc === "encerrado").reduce((s, o) => s + Number(o.valor_total), 0);

  const handleAtualizado = (id, novoStatus, motivo) => {
    setOrcs(prev => prev.map(o =>
      o.id_orcamento === id
        ? { ...o, status_orc: novoStatus, motivo_perda: motivo || o.motivo_perda }
        : o
    ));
  };

  return (
    <>
      {showNovo && (
        <ModalNovoOrcamento onClose={() => setShowNovo(false)} onSalvo={fetch} />
      )}
      {orcStatus && (
        <ModalAtualizarStatus
          orc={orcStatus}
          onClose={() => setOrcStatus(null)}
          onAtualizado={handleAtualizado}
        />
      )}

      <div className="space-y-5">

        {/* KPI cards rápidos */}
        {!loading && orcs.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Volume Total",    value: totalValor,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",       icon: DollarSign },
              { label: "Receita Fechada", value: totalFechado, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",  icon: TrendingUp },
              { label: "Perdido",         value: totalPerdido, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",          icon: TrendingDown },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <Icon size={14} className={color} />
                </div>
                <p className={`text-xl font-bold ${color}`}>
                  R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Barra de ações */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Orçamentos
            <span className="ml-2 text-gray-600 font-normal">({orcs.length})</span>
          </h2>

          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos os status</option>
            {STATUS_LISTA.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus size={15} />
            Novo Orçamento
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orcs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <DollarSign size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum orçamento encontrado.</p>
            <button onClick={() => setShowNovo(true)} className="mt-4 text-emerald-400 text-sm hover:underline">
              + Criar o primeiro orçamento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orcs.map(o => (
              <div
                key={o.id_orcamento}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={16} className="text-emerald-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-white">{o.paciente}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_CORES[o.status_orc] || "bg-gray-700 text-gray-400 border-gray-600"}`}>
                        {STATUS_EMOJI[o.status_orc]} {o.status_orc}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {o.medico}  •  {o.procedimento}  •  {o.data_criacao}
                    </p>
                    {o.motivo_perda && (
                      <p className="text-xs text-red-400">Motivo: {o.motivo_perda}</p>
                    )}
                  </div>

                  {/* Valor e ação */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-white mb-2">
                      R$ {Number(o.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    {o.status_orc !== "fechado" && o.status_orc !== "encerrado" && (
                      <button
                        onClick={() => setOrcStatus(o)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
                      >
                        Atualizar status →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
