// src/components/PreCirurgico.jsx
// Checklist pré-cirúrgico + Histórico completo do paciente
import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, X, CheckCircle, XCircle,
  Clock, User, FileText, Calendar, DollarSign,
  MessageSquare, Activity, ChevronRight,
} from "lucide-react";
import { getPacientes, getPaciente } from "../api";
import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:8000", timeout: 8000 });

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════
const STATUS_AGD = {
  agendado:   "bg-blue-500/20 text-blue-400",
  atendido:   "bg-emerald-500/20 text-emerald-400",
  falta:      "bg-red-500/20 text-red-400",
  cancelado:  "bg-gray-700 text-gray-400",
  reagendado: "bg-yellow-500/20 text-yellow-400",
  abandono:   "bg-gray-700 text-gray-500",
};

const STATUS_ORC = {
  aberto:          "bg-blue-500/20 text-blue-400",
  "em andamento":  "bg-yellow-500/20 text-yellow-400",
  fechado:         "bg-emerald-500/20 text-emerald-400",
  encerrado:       "bg-red-500/20 text-red-400",
};

const STATUS_SAC = {
  pendente:       "bg-red-500/20 text-red-400",
  "em tratativa": "bg-yellow-500/20 text-yellow-400",
  resolvido:      "bg-emerald-500/20 text-emerald-400",
};

const calcIMC = (peso, altura) => {
  const p = parseFloat(peso), a = parseFloat(altura);
  if (!p || !a || a === 0) return null;
  return (p / (a * a)).toFixed(2);
};

const classeIMC = (imc) => {
  const v = parseFloat(imc);
  if (!v) return null;
  if (v < 18.5) return { label: "Abaixo do peso", cor: "text-blue-400",    bg: "bg-blue-500/20" };
  if (v < 25)   return { label: "Normal",          cor: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (v < 30)   return { label: "Sobrepeso",        cor: "text-yellow-400",  bg: "bg-yellow-500/20" };
  return              { label: "Obesidade",          cor: "text-red-400",     bg: "bg-red-500/20" };
};

// ══════════════════════════════════════════════════════════════════
//  MODAL HISTÓRICO COMPLETO
// ══════════════════════════════════════════════════════════════════
function ModalHistorico({ pacId, pacNome, onClose }) {
  const [pac, setPac]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba]         = useState("agendamentos");

  useEffect(() => {
    getPaciente(pacId)
      .then(({ data }) => setPac(data))
      .catch(() => setPac(null))
      .finally(() => setLoading(false));
  }, [pacId]);

  const abas = [
    { id: "agendamentos", label: "Agendamentos", icon: Calendar, count: pac?.agendamentos?.length },
    { id: "orcamentos",   label: "Orçamentos",   icon: DollarSign, count: pac?.orcamentos?.length },
    { id: "sac",          label: "SAC",           icon: MessageSquare, count: pac?.sac?.length },
    { id: "mensagens",    label: "Mensagens",     icon: Activity, count: pac?.mensagens?.length },
  ];

  const imc = pac ? calcIMC(pac.peso, pac.altura) : null;
  const cls = imc ? classeIMC(imc) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center">
            <FileText size={18} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Histórico do Paciente</p>
            <p className="text-xs text-gray-500">{pacNome}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 flex-1">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !pac ? (
          <p className="text-gray-500 text-sm text-center py-12">Erro ao carregar dados.</p>
        ) : (
          <>
            {/* Dados resumidos do paciente */}
            <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Peso", value: pac.peso ? `${pac.peso} kg` : "–" },
                  { label: "Altura", value: pac.altura ? `${pac.altura} m` : "–" },
                  { label: "IMC", value: imc || "–", extra: cls },
                  { label: "Entrada", value: pac.entrada || "–" },
                ].map(({ label, value, extra }) => (
                  <div key={label} className="bg-gray-800/50 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className={`text-sm font-bold ${extra ? extra.cor : "text-white"}`}>{value}</p>
                    {extra && <p className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full ${extra.bg} ${extra.cor}`}>{extra.label}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Abas */}
            <div className="flex border-b border-gray-800 flex-shrink-0 px-2">
              {abas.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setAba(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px
                    ${aba === id
                      ? "text-purple-400 border-purple-400"
                      : "text-gray-500 border-transparent hover:text-gray-300"
                    }`}
                >
                  <Icon size={13} />
                  {label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${aba === id ? "bg-purple-500/20 text-purple-400" : "bg-gray-800 text-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Conteúdo da aba */}
            <div className="p-5 overflow-y-auto flex-1">

              {/* Agendamentos */}
              {aba === "agendamentos" && (
                <div className="space-y-2">
                  {!pac.agendamentos?.length ? (
                    <p className="text-gray-500 text-sm text-center py-8">Nenhum agendamento.</p>
                  ) : pac.agendamentos.map((a, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{a.nome_especifico}</p>
                          <p className="text-xs text-gray-500">{a.nome_medico}  •  {a.data_hora}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${STATUS_AGD[a.status] || "bg-gray-700 text-gray-400"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Orçamentos */}
              {aba === "orcamentos" && (
                <div className="space-y-2">
                  {!pac.orcamentos?.length ? (
                    <p className="text-gray-500 text-sm text-center py-8">Nenhum orçamento.</p>
                  ) : pac.orcamentos.map((o, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <DollarSign size={14} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{o.nome_especifico}</p>
                          <p className="text-xs text-gray-500">{o.data_criacao}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">R$ {Number(o.valor_total).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_ORC[o.status_orc] || "bg-gray-700 text-gray-400"}`}>
                          {o.status_orc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SAC */}
              {aba === "sac" && (
                <div className="space-y-2">
                  {!pac.sac?.length ? (
                    <p className="text-gray-500 text-sm text-center py-8">Nenhum SAC registrado.</p>
                  ) : pac.sac.map((s, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-xs text-gray-500">Protocolo #{s.id_sac || i + 1}  •  {s.data_abertura}</p>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${STATUS_SAC[s.status_solucao] || "bg-gray-700 text-gray-400"}`}>
                          {s.status_solucao}
                        </span>
                      </div>
                      <p className="text-sm text-white">{s.motivo}</p>
                      <p className="text-xs text-gray-600 mt-1">Prazo: {s.prazo_limite}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Mensagens */}
              {aba === "mensagens" && (
                <div className="space-y-2">
                  {!pac.mensagens?.length ? (
                    <p className="text-gray-500 text-sm text-center py-8">Nenhuma mensagem registrada.</p>
                  ) : pac.mensagens.map((m, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={13} className="text-sky-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{m.tipo_canal}</p>
                        <p className="text-xs text-gray-500">{m.tipo_gatilho || "–"}  •  {m.data_envio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  MODAL CHECKLIST PRÉ-CIRÚRGICO
// ══════════════════════════════════════════════════════════════════
function ModalChecklist({ pac, onClose, onSalvo }) {
  const [form, setForm] = useState({
    status_imc: 0, exames_completos: 0,
    checklist_ok: 0, autorizacao_med: 0,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const imc    = calcIMC(pac.peso, pac.altura);
  const clsImc = imc ? classeIMC(imc) : null;
  const apto   = Object.values(form).every(v => v === 1);

  const toggle = (k) => setForm(f => ({ ...f, [k]: f[k] === 1 ? 0 : 1 }));

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      await http.post("/pre-cirurgico", {
        id_paciente: pac.id_paciente,
        ...form,
      });
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao salvar checklist.");
    } finally {
      setSalvando(false);
    }
  };

  const itens = [
    { key: "status_imc",        label: "IMC dentro do limite aprovado",    desc: imc ? `IMC atual: ${imc} – ${clsImc?.label}` : "Sem dados de peso/altura" },
    { key: "exames_completos",  label: "Exames pré-operatórios completos", desc: "Hemograma, ECG, coagulação e demais exames solicitados" },
    { key: "checklist_ok",      label: "Checklist de segurança aprovado",  desc: "Alergias, medicamentos, jejum e protocolos revisados" },
    { key: "autorizacao_med",   label: "Autorização médica assinada",      desc: "Termo de consentimento informado assinado pelo paciente" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Checklist Pré-Cirúrgico</p>
            <p className="text-xs text-gray-500">{pac.nome_completo}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* IMC info */}
          {imc && (
            <div className={`rounded-xl p-3 flex items-center justify-between ${clsImc?.bg} border border-opacity-30`}>
              <span className="text-sm text-gray-300">IMC do paciente</span>
              <div className="text-right">
                <span className={`text-lg font-bold ${clsImc?.cor}`}>{imc}</span>
                <span className={`ml-2 text-xs ${clsImc?.cor}`}>{clsImc?.label}</span>
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-3">
            {itens.map(({ key, label, desc }) => {
              const checked = form[key] === 1;
              return (
                <div
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${checked
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-gray-800/40 border-gray-700 hover:border-gray-600"
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                    ${checked ? "bg-emerald-500 border-emerald-500" : "border-gray-600"}`}>
                    {checked && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${checked ? "text-emerald-400" : "text-gray-300"}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status final */}
          <div className={`rounded-xl p-4 text-center border ${apto ? "bg-emerald-500/10 border-emerald-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
            <p className={`text-base font-bold ${apto ? "text-emerald-400" : "text-yellow-400"}`}>
              {apto ? "✅ Paciente APTO para cirurgia" : "⚠️ Situação: PENDENTE"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {apto ? "Todos os critérios foram atendidos." : `${Object.values(form).filter(v => v === 0).length} item(ns) pendente(s)`}
            </p>
          </div>

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
              <CheckCircle size={15} />
              {salvando ? "Salvando..." : "Salvar Checklist"}
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
export default function PreCirurgico() {
  const [pacientes, setPacientes]   = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [busca, setBusca]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [pacChecklist, setPacChecklist] = useState(null);
  const [pacHistorico, setPacHistorico] = useState(null);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    try {
      const [pacRes, chkRes] = await Promise.all([
        getPacientes(busca),
        http.get("/pre-cirurgico"),
      ]);
      setPacientes(pacRes.data.pacientes || []);
      setChecklists(chkRes.data.checklists || []);
    } catch {
      // se endpoint não existir ainda, só carrega pacientes
      try {
        const pacRes = await getPacientes(busca);
        setPacientes(pacRes.data.pacientes || []);
      } catch { setPacientes([]); }
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(fetchDados, 400);
    return () => clearTimeout(t);
  }, [fetchDados]);

  const getChecklist = (id) => checklists.find(c => c.id_paciente === id);

  const aptoBadge = (chk) => {
    if (!chk) return <span className="text-xs text-gray-600">Sem checklist</span>;
    const apto = chk.status_imc && chk.exames_completos && chk.checklist_ok && chk.autorizacao_med;
    return apto
      ? <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-semibold">✅ Apto</span>
      : <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-semibold">⚠️ Pendente</span>;
  };

  const ItemChecklist = ({ ok, label }) => (
    <div className="flex items-center gap-1.5 text-xs">
      {ok
        ? <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
        : <XCircle    size={12} className="text-red-400 flex-shrink-0" />}
      <span className={ok ? "text-gray-400" : "text-red-400"}>{label}</span>
    </div>
  );

  return (
    <>
      {pacChecklist && (
        <ModalChecklist
          pac={pacChecklist}
          onClose={() => setPacChecklist(null)}
          onSalvo={fetchDados}
        />
      )}
      {pacHistorico && (
        <ModalHistorico
          pacId={pacHistorico.id_paciente}
          pacNome={pacHistorico.nome_completo}
          onClose={() => setPacHistorico(null)}
        />
      )}

      <div className="space-y-5">
        {/* Barra */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Pré-Cirúrgico & Histórico
            <span className="ml-2 text-gray-600 font-normal">({pacientes.length} paciente(s))</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar paciente..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 w-52"
            />
          </div>
          <button onClick={fetchDados} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <User size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientes.map(pac => {
              const chk = getChecklist(pac.id_paciente);
              const imc = calcIMC(pac.peso, pac.altura);
              const cls = imc ? classeIMC(imc) : null;

              return (
                <div key={pac.id_paciente} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                      {pac.nome_completo.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-sm font-bold text-white">{pac.nome_completo}</p>
                        {aptoBadge(chk)}
                        {imc && cls && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cls.bg} ${cls.cor}`}>
                            IMC {imc} – {cls.label}
                          </span>
                        )}
                      </div>

                      {/* Checklist inline */}
                      {chk ? (
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          <ItemChecklist ok={!!chk.status_imc}       label="IMC aprovado" />
                          <ItemChecklist ok={!!chk.exames_completos}  label="Exames completos" />
                          <ItemChecklist ok={!!chk.checklist_ok}      label="Checklist de segurança" />
                          <ItemChecklist ok={!!chk.autorizacao_med}   label="Autorização médica" />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 mb-2">Nenhum checklist preenchido ainda.</p>
                      )}

                      <p className="text-xs text-gray-600">CPF: {pac.cpf}  •  Cadastro: {pac.entrada}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPacChecklist(pac)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle size={12} />
                        Checklist
                      </button>
                      <button
                        onClick={() => setPacHistorico(pac)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors"
                      >
                        <FileText size={12} />
                        Histórico
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
