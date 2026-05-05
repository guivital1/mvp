// src/components/TabelaMedicos.jsx
import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, X, Plus, Trash2,
  Phone, Mail, MapPin, Award, Calendar, TrendingUp, User,
} from "lucide-react";
import { getMedicos, getAgendamentos, getLeads } from "../api";
import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:8000", timeout: 8000 });

const ESPECIALIDADES = [
  "Cirurgião Bariátrico", "Cirurgião Plástico", "Dermatologista", "Ginecólogo",
  "Nutricionista", "Ortopedista", "Otorrinolaringologista", "Urologista","Vascular",
];


// ══════════════════════════════════════════════════════════════════
//  MODAL CADASTRAR MÉDICO
// ══════════════════════════════════════════════════════════════════
function ModalCadastrar({ onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome_medico: "", crm: "", especialidade: "",
    email: "", telefone: "", cpf: "",
    data_nascimento: "", local_hospital: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.nome_medico || !form.crm || !form.cpf) {
      setErro("Nome, CRM e CPF são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await http.post("/medicos", form);
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao cadastrar. CRM ou CPF já existe?");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3 rounded-t-2xl z-10">
          <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center">
            <Plus size={18} className="text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Novo Médico</p>
            <p className="text-xs text-gray-500">Preencha os dados do profissional</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nome completo *</label>
            <input
              value={form.nome_medico}
              onChange={e => set("nome_medico", e.target.value)}
              placeholder="ex: Dr. João Silva"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* CRM e CPF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">CRM *</label>
              <input
                value={form.crm}
                onChange={e => set("crm", e.target.value)}
                placeholder="ex: CRM-SP 123456"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">CPF *</label>
              <input
                value={form.cpf}
                onChange={e => set("cpf", e.target.value)}
                placeholder="Somente números"
                maxLength={11}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Especialidade</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ESPECIALIDADES.map(e => (
                <button
                  key={e}
                  onClick={() => set("especialidade", e)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all
                    ${form.especialidade === e
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              value={form.especialidade}
              onChange={e => set("especialidade", e.target.value)}
              placeholder="Ou digite outra especialidade..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">E-mail</label>
              <input
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="medico@hospital.com"
                type="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Telefone</label>
              <input
                value={form.telefone}
                onChange={e => set("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Nascimento e Local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Data de nascimento</label>
              <input
                value={form.data_nascimento}
                onChange={e => set("data_nascimento", e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Local / Hospital</label>
              <input
                value={form.local_hospital}
                onChange={e => set("local_hospital", e.target.value)}
                placeholder="ex: Unidade Centro"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
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
              className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              {salvando ? "Cadastrando..." : "Cadastrar Médico"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  MODAL REMOVER MÉDICO
// ══════════════════════════════════════════════════════════════════
function ModalRemover({ med, onClose, onRemovido }) {
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro]           = useState("");

  const remover = async () => {
    setRemovendo(true);
    try {
      await http.delete(`/medicos/${med.id_medico}`);
      onRemovido(med.id_medico);
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao remover.");
    } finally {
      setRemovendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-white font-bold text-base mb-2">Remover médico?</h3>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-semibold">{med.nome_medico}</span>
        </p>
        <p className="text-gray-600 text-xs mb-6">Esta ação não pode ser desfeita.</p>
        {erro && <p className="text-red-400 text-xs mb-4">{erro}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">
            Cancelar
          </button>
          <button
            onClick={remover}
            disabled={removendo}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {removendo ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  MODAL DETALHES / ESTATÍSTICAS
// ══════════════════════════════════════════════════════════════════
function ModalMedico({ med, onClose, onRemoverClick }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAgendamentos(), getLeads()])
      .then(([agdRes, leadRes]) => {
        const agds  = agdRes.data.agendamentos || [];
        const leads = leadRes.data.leads       || [];
        const meuAgds  = agds.filter(a => a.medico === med.nome_medico);
        const meuLeads = leads.filter(l => l.medico === med.nome_medico);
        const atendidos   = meuAgds.filter(a => a.status === "atendido").length;
        const faltas      = meuAgds.filter(a => a.status === "falta").length;
        const convertidos = meuLeads.filter(l => l.status_lead === "convertido").length;
        const proximos    = agds.filter(a => a.medico === med.nome_medico && a.status === "agendado").slice(0, 3);
        setStats({
          total: meuAgds.length, atendidos, faltas,
          leads: meuLeads.length, convertidos,
          taxaPresenca: meuAgds.length ? Math.round(atendidos / meuAgds.length * 100) : 0,
          taxaConv:     meuLeads.length ? Math.round(convertidos / meuLeads.length * 100) : 0,
          proximos,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [med]);

  const iniciais = med.nome_medico.split(" ").map(n => n[0]).slice(0, 2).join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl">

        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4 rounded-t-2xl z-10">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-lg flex-shrink-0">
            {iniciais}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-base">{med.nome_medico}</p>
            <p className="text-xs text-sky-400">{med.especialidade || "Especialista"}  •  CRM: {med.crm}</p>
          </div>
          <button
            onClick={onRemoverClick}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remover médico"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Contato */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informações</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail,   label: "E-mail",   value: med.email          || "–" },
                { icon: Phone,  label: "Telefone",  value: med.telefone       || "–" },
                { icon: MapPin, label: "Local",     value: med.local_hospital || "–" },
                { icon: Award,  label: "CRM",       value: med.crm            || "–" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                  <Icon size={14} className="text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm text-white font-medium truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Estatísticas */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estatísticas</h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : !stats ? (
              <p className="text-gray-600 text-sm">Sem dados.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Agendamentos",    value: stats.total,     color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Atendidos",       value: stats.atendidos, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Faltas",          value: stats.faltas,    color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Leads Indicados", value: stats.leads,     color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Taxa de Presença", value: stats.taxaPresenca, icon: Calendar, cor: stats.taxaPresenca >= 70 ? "text-emerald-400" : stats.taxaPresenca >= 50 ? "text-yellow-400" : "text-red-400", fill: "bg-emerald-500" },
                    { label: "Taxa de Conversão", value: stats.taxaConv, icon: TrendingUp, cor: stats.taxaConv >= 30 ? "text-emerald-400" : stats.taxaConv >= 15 ? "text-yellow-400" : "text-red-400", fill: "bg-sky-500" },
                  ].map(({ label, value, icon: Icon, cor, fill }) => (
                    <div key={label} className="bg-gray-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Icon size={11} /> {label}</p>
                      <p className={`text-xl font-bold ${cor}`}>{value}%</p>
                      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${fill} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Próximos agendamentos */}
          {stats?.proximos?.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Próximos Agendamentos</h3>
              <div className="space-y-2">
                {stats.proximos.map((a, i) => (
                  <div key={i} className="bg-gray-800/40 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white font-medium">{a.paciente}</p>
                      <p className="text-xs text-gray-500">{a.procedimento}  •  {a.data_hora}</p>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex-shrink-0">agendado</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function TabelaMedicos() {
  const [medicos, setMedicos]       = useState([]);
  const [busca, setBusca]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [medSel, setMedSel]         = useState(null);
  const [showCadastro, setShowCadastro] = useState(false);
  const [medRemover, setMedRemover]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMedicos();
      setMedicos(data.medicos || []);
    } catch {
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtrados = medicos.filter(m =>
    !busca ||
    m.nome_medico.toLowerCase().includes(busca.toLowerCase()) ||
    (m.especialidade || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      {showCadastro && (
        <ModalCadastrar onClose={() => setShowCadastro(false)} onSalvo={fetch} />
      )}
      {medRemover && (
        <ModalRemover
          med={medRemover}
          onClose={() => setMedRemover(null)}
          onRemovido={id => {
            setMedicos(prev => prev.filter(m => m.id_medico !== id));
            setMedRemover(null);
            setMedSel(null);
          }}
        />
      )}
      {medSel && !medRemover && (
        <ModalMedico
          med={medSel}
          onClose={() => setMedSel(null)}
          onRemoverClick={() => { setMedRemover(medSel); setMedSel(null); }}
        />
      )}

      <div className="space-y-5">
        {/* Barra */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Médicos
            <span className="ml-2 text-gray-600 font-normal">({filtrados.length})</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Nome ou especialidade..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-sky-500 w-52"
            />
          </div>
          <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCadastro(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Plus size={15} />
            Novo Médico
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => <div key={i} className="h-40 bg-gray-900 rounded-xl animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <User size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum médico encontrado.</p>
            <button onClick={() => setShowCadastro(true)} className="mt-4 text-sky-400 text-sm hover:underline">
              + Cadastrar o primeiro médico
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(m => {
              const iniciais = m.nome_medico.split(" ").map(n => n[0]).slice(0, 2).join("");
              return (
                <div
                  key={m.id_medico}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-sky-500/40 hover:bg-gray-800 transition-all group relative"
                >
                  {/* Botão remover */}
                  <button
                    onClick={e => { e.stopPropagation(); setMedRemover(m); }}
                    className="absolute top-3 right-3 p-1.5 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Conteúdo clicável */}
                  <div className="cursor-pointer" onClick={() => setMedSel(m)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm flex-shrink-0 group-hover:bg-sky-500/20 transition-colors">
                        {iniciais}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm font-semibold text-white truncate">{m.nome_medico}</p>
                        <p className="text-xs text-sky-400 truncate">{m.especialidade || "Especialista"}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Award size={11} /><span className="truncate">{m.crm}</span>
                      </div>
                      {m.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={11} /><span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.local_hospital && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={11} /><span className="truncate">{m.local_hospital}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Ver estatísticas</span>
                      <span className="text-xs text-sky-400 group-hover:text-sky-300 transition-colors">Ver detalhes →</span>
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
