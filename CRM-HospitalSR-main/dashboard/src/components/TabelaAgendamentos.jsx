// src/components/TabelaAgendamentos.jsx
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, X, Calendar, User, Stethoscope } from "lucide-react";
import { getAgendamentos, atualizarStatusAgendamento, getPacientes, getMedicos, getProcedimentos } from "../api";
import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:8000", timeout: 8000 });

const STATUS_CORES = {
  agendado:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  atendido:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  falta:      "bg-red-500/20 text-red-400 border-red-500/30",
  cancelado:  "bg-gray-700 text-gray-400 border-gray-600",
  reagendado: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  abandono:   "bg-gray-700 text-gray-500 border-gray-600",
};

const STATUS_LISTA = ["agendado","atendido","falta","cancelado","reagendado","abandono"];

const STATUS_EMOJI = {
  agendado:"🔵", atendido:"✅", falta:"❌",
  cancelado:"🚫", reagendado:"🟠", abandono:"⚫",
};


// ══════════════════════════════════════════════════════════════════
//  MODAL NOVO AGENDAMENTO
// ══════════════════════════════════════════════════════════════════
function ModalNovoAgendamento({ onClose, onSalvo }) {
  const [pacientes,  setPacientes]  = useState([]);
  const [medicos,    setMedicos]    = useState([]);
  const [procs,      setProcs]      = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const [form, setForm] = useState({
    id_paciente:     "",
    id_medico:       "",
    id_procedimento: "",
    data_hora:       "",
    origem:          "CRM",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([getPacientes(), getMedicos(), getProcedimentos()])
      .then(([pRes, mRes, prRes]) => {
        setPacientes(pRes.data.pacientes   || []);
        setMedicos(mRes.data.medicos       || []);
        setProcs(prRes.data.procedimentos  || []);
      })
      .catch(() => {})
      .finally(() => setLoadingDados(false));
  }, []);

  const salvar = async () => {
    if (!form.id_paciente || !form.id_medico || !form.id_procedimento || !form.data_hora) {
      setErro("Todos os campos são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      // Formata data de YYYY-MM-DDTHH:MM para DD/MM/YYYY HH:MM
      const [datePart, timePart] = form.data_hora.split("T");
      const [y, m, d] = datePart.split("-");
      const dataFormatada = `${d}/${m}/${y} ${timePart}`;

      await http.post("/agendamentos", {
        id_paciente:     parseInt(form.id_paciente),
        id_medico:       parseInt(form.id_medico),
        id_procedimento: parseInt(form.id_procedimento),
        data_hora:       dataFormatada,
        origem:          form.origem,
      });
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao criar agendamento.");
    } finally {
      setSalvando(false);
    }
  };

  // Preview do agendamento
  const pacSel  = pacientes.find(p => p.id_paciente  === parseInt(form.id_paciente));
  const medSel  = medicos.find(m   => m.id_medico    === parseInt(form.id_medico));
  const procSel = procs.find(p     => p.id_procedimento === parseInt(form.id_procedimento));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
            <Plus size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Novo Agendamento</p>
            <p className="text-xs text-gray-500">Preencha os dados da consulta</p>
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                  <Calendar size={11} /> Procedimento *
                </label>
                <select
                  value={form.id_procedimento}
                  onChange={e => set("id_procedimento", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione o procedimento...</option>
                  {procs.map(p => (
                    <option key={p.id_procedimento} value={p.id_procedimento}>
                      {p.nome_especifico} {p.valor_base ? `— R$ ${Number(p.valor_base).toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e hora + Origem */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Data e Hora *</label>
                  <input
                    type="datetime-local"
                    value={form.data_hora}
                    onChange={e => set("data_hora", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Origem</label>
                  <select
                    value={form.origem}
                    onChange={e => set("origem", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="CRM">CRM</option>
                    <option value="Tasy">Tasy</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {(pacSel || medSel || procSel || form.data_hora) && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Resumo do Agendamento</p>
                  {pacSel  && <div className="flex justify-between text-sm"><span className="text-gray-500">Paciente</span><span className="text-white font-medium">{pacSel.nome_completo}</span></div>}
                  {medSel  && <div className="flex justify-between text-sm"><span className="text-gray-500">Médico</span><span className="text-white font-medium">{medSel.nome_medico}</span></div>}
                  {procSel && <div className="flex justify-between text-sm"><span className="text-gray-500">Procedimento</span><span className="text-white font-medium">{procSel.nome_especifico}</span></div>}
                  {form.data_hora && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Data/Hora</span>
                      <span className="text-white font-medium">
                        {new Date(form.data_hora).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {erro && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{erro}</div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  {salvando ? "Criando..." : "Criar Agendamento"}
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
//  TABELA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function TabelaAgendamentos() {
  const [agds, setAgds]           = useState([]);
  const [filtro, setFiltro]       = useState("");
  const [data, setData]           = useState("");
  const [loading, setLoading]     = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [showNovo, setShowNovo]   = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtro) params.status = filtro;
      if (data)   params.data   = data;
      const { data: res } = await getAgendamentos(params);
      setAgds(res.agendamentos || []);
    } catch {
      setAgds([]);
    } finally {
      setLoading(false);
    }
  }, [filtro, data]);

  useEffect(() => { fetch(); }, [fetch]);

  const mudarStatus = async (id, novoStatus) => {
    setAtualizando(id);
    try {
      await atualizarStatusAgendamento(id, novoStatus);
      setAgds(prev => prev.map(a => a.id_agendamento === id ? { ...a, status: novoStatus } : a));
    } catch {
      alert("Erro ao atualizar status.");
    } finally {
      setAtualizando(null);
    }
  };

  const formatarData = (dt) => {
    try {
      return new Date(dt).toLocaleString("pt-BR", {
        day:"2-digit", month:"2-digit", year:"numeric",
        hour:"2-digit", minute:"2-digit",
      });
    } catch { return dt; }
  };

  // Separa próximos e passados
  const agora = new Date();
  const proximos = agds.filter(a => {
    try { return new Date(a.data_hora) >= agora && a.status === "agendado"; } catch { return false; }
  });

  return (
    <>
      {showNovo && (
        <ModalNovoAgendamento
          onClose={() => setShowNovo(false)}
          onSalvo={fetch}
        />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Agendamentos
            <span className="ml-2 text-gray-600 font-normal">({agds.length})</span>
            {proximos.length > 0 && (
              <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                {proximos.length} próximo(s)
              </span>
            )}
          </h2>

          {/* Filtro de data */}
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          />

          {/* Filtro de status */}
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            {STATUS_LISTA.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>

          {/* Botão novo */}
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={15} />
            Novo Agendamento
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : agds.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum agendamento encontrado.</p>
            <button
              onClick={() => setShowNovo(true)}
              className="mt-4 text-blue-400 text-sm hover:underline"
            >
              + Criar o primeiro agendamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {["#","Paciente","Médico","Procedimento","Data/Hora","Origem","Status","Ação"].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {agds.map(a => {
                  const isProximo = proximos.some(p => p.id_agendamento === a.id_agendamento);
                  return (
                    <tr key={a.id_agendamento} className={`transition-colors ${isProximo ? "bg-blue-500/5 hover:bg-blue-500/10" : "hover:bg-gray-800/30"}`}>
                      <td className="py-3 pr-4 text-gray-600 text-xs">{a.id_agendamento}</td>
                      <td className="py-3 pr-4 font-medium text-white">
                        {a.paciente}
                        {isProximo && <span className="ml-1 text-xs text-blue-400">← próximo</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-400">{a.medico}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{a.procedimento}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{formatarData(a.data_hora)}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{a.origem}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_CORES[a.status] || "bg-gray-700 text-gray-400 border-gray-600"}`}>
                          {STATUS_EMOJI[a.status]} {a.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          disabled={atualizando === a.id_agendamento}
                          value={a.status}
                          onChange={e => mudarStatus(a.id_agendamento, e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {STATUS_LISTA.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}