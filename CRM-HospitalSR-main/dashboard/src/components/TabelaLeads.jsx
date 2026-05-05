// src/components/TabelaLeads.jsx
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, X, User, Phone, Mail, Tag, Users, UserPlus, CheckCircle } from "lucide-react";
import { getLeads, atualizarStatusLead, criarPaciente } from "../api";

const STATUS_CORES = {
  novo:             "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "em atendimento": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  convertido:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  perdido:          "bg-red-500/20 text-red-400 border-red-500/30",
  reagendado:       "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const STATUS_LISTA = ["novo","em atendimento","convertido","perdido","reagendado"];

const STATUS_EMOJI = {
  novo: "🔵", "em atendimento": "🟡",
  convertido: "🟢", perdido: "🔴", reagendado: "🟠",
};


// ══════════════════════════════════════════════════════════════════
//  MODAL DE CONVERSÃO
// ══════════════════════════════════════════════════════════════════
function ModalConverterPaciente({ lead, onClose, onConvertido }) {
  const [form, setForm] = useState({
    nome_completo:   lead.nome || "",
    email:           lead.email || "",
    telefone:        lead.telefone || "",
    cpf:             "",
    senha:           "",
    data_nascimento: "",
    sexo:            "",
    peso:            "",
    altura:          "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");
  const [sucesso, setSucesso]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const converter = async () => {
    if (!form.cpf || !form.senha || !form.data_nascimento) {
      setErro("CPF, senha e data de nascimento são obrigatórios.");
      return;
    }
    if (form.senha.length < 6) {
      setErro("Senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      // 1. Cria o paciente
      await criarPaciente({
        nome_completo:   form.nome_completo,
        cpf:             form.cpf,
        email:           form.email,
        senha:           form.senha,
        telefone:        form.telefone || null,
        sexo:            form.sexo     || null,
        data_nascimento: form.data_nascimento,
        peso:            form.peso     ? parseFloat(form.peso)   : null,
        altura:          form.altura   ? parseFloat(form.altura) : null,
      });

      // 2. Atualiza status do lead para "convertido"
      await atualizarStatusLead(lead.id_lead, "convertido");

      setSucesso(true);
      onConvertido(lead.id_lead);
    } catch (e) {
      const msg = e?.response?.data?.detail;
      setErro(msg || "Erro ao converter. CPF ou e-mail já cadastrado?");
    } finally {
      setSalvando(false);
    }
  };

  // ── Tela de sucesso ────────────────────────────────────────────
  if (sucesso) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Lead Convertido! 🎉</h2>
        <p className="text-gray-400 text-sm mb-2">
          <span className="text-white font-semibold">{form.nome_completo}</span> agora é um paciente cadastrado.
        </p>
        <p className="text-gray-600 text-xs mb-6">O status do lead foi atualizado para <span className="text-emerald-400">convertido</span>.</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );

  // ── Formulário ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3 rounded-t-2xl z-10">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <UserPlus size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Converter em Paciente</p>
            <p className="text-xs text-gray-500">Lead: {lead.nome}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Info */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-gray-400">
            Os dados do lead já foram preenchidos. Complete as informações obrigatórias para criar o paciente.
          </div>

          {/* Dados já preenchidos pelo lead */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados do Lead</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome completo</label>
                <input
                  value={form.nome_completo}
                  onChange={e => set("nome_completo", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                  <input
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={e => set("telefone", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados obrigatórios extras */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Dados Obrigatórios <span className="text-red-400">*</span>
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CPF *</label>
                  <input
                    value={form.cpf}
                    onChange={e => set("cpf", e.target.value)}
                    placeholder="Somente números"
                    maxLength={11}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Senha de acesso *</label>
                  <input
                    value={form.senha}
                    onChange={e => set("senha", e.target.value)}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de nascimento *</label>
                <input
                  value={form.data_nascimento}
                  onChange={e => set("data_nascimento", e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Dados opcionais */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados Opcionais</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                <select
                  value={form.sexo}
                  onChange={e => set("sexo", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">–</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                <input
                  value={form.peso}
                  onChange={e => set("peso", e.target.value)}
                  placeholder="ex: 70.5"
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                <input
                  value={form.altura}
                  onChange={e => set("altura", e.target.value)}
                  placeholder="ex: 1.75"
                  type="number"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Preview IMC */}
            {form.peso && form.altura && (
              <div className="mt-3 bg-gray-800/50 rounded-lg px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">IMC calculado</span>
                <span className="text-sm font-bold text-emerald-400">
                  {(parseFloat(form.peso) / (parseFloat(form.altura) ** 2)).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={converter}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus size={15} />
              {salvando ? "Convertendo..." : "Converter em Paciente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  MODAL DE DETALHES DO LEAD
// ══════════════════════════════════════════════════════════════════
function ModalLead({ lead, onClose, onStatusChange, onConverterClick }) {
  const [novoStatus, setNovoStatus] = useState(lead.status_lead);
  const [salvando, setSalvando]     = useState(false);

  const salvarStatus = async () => {
    if (novoStatus === lead.status_lead) { onClose(); return; }
    setSalvando(true);
    try {
      await atualizarStatusLead(lead.id_lead, novoStatus);
      onStatusChange(lead.id_lead, novoStatus);
      onClose();
    } catch {
      alert("Erro ao atualizar status.");
    } finally {
      setSalvando(false);
    }
  };

  const jaConvertido = lead.status_lead === "convertido";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
            <Users size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">{lead.nome}</p>
            <p className="text-xs text-gray-500">Lead #{lead.id_lead}  •  {lead.data_entrada}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Status */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Status atual</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_CORES[lead.status_lead] || "bg-gray-700 text-gray-400 border-gray-600"}`}>
              {STATUS_EMOJI[lead.status_lead]} {lead.status_lead}
            </span>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contato</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: Mail,  label: "E-mail",       value: lead.email        || "Não informado" },
                { icon: Phone, label: "WhatsApp",      value: lead.telefone     || "Não informado" },
                { icon: Tag,   label: "Canal",         value: lead.canal_origem || "Não informado" },
                { icon: User,  label: "Procedimento",  value: lead.procedimento || "Não informado" },
                { icon: User,  label: "Médico pref.",  value: lead.medico       || "Não informado" },
                { icon: User,  label: "Operador",      value: lead.operador     || "Não atribuído" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-4 py-3">
                  <Icon size={14} className="text-gray-500 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                    <span className="text-sm text-white font-medium text-right truncate">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atualizar status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Atualizar Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_LISTA.map(s => (
                <button
                  key={s}
                  onClick={() => setNovoStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize
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

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={salvarStatus}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar status"}
            </button>
            <button
              onClick={onConverterClick}
              disabled={jaConvertido}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2
                ${jaConvertido
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
            >
              <UserPlus size={15} />
              {jaConvertido ? "Já convertido" : "Converter em Paciente"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
//  TABELA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function TabelaLeads() {
  const [leads, setLeads]         = useState([]);
  const [busca, setBusca]         = useState("");
  const [filtro, setFiltro]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [leadSel, setLeadSel]     = useState(null);
  const [convertendo, setConvertendo] = useState(null); // lead a converter

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtro) params.status = filtro;
      if (busca)  params.busca  = busca;
      const { data } = await getLeads(params);
      setLeads(data.leads || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filtro, busca]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 400);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  const handleStatusChange = (id, novoStatus) => {
    setLeads(prev => prev.map(l => l.id_lead === id ? { ...l, status_lead: novoStatus } : l));
  };

  const handleConvertido = (id) => {
    handleStatusChange(id, "convertido");
    setConvertendo(null);
    setLeadSel(null);
  };

  return (
    <>
      {/* Modal detalhes */}
      {leadSel && !convertendo && (
        <ModalLead
          lead={leadSel}
          onClose={() => setLeadSel(null)}
          onStatusChange={handleStatusChange}
          onConverterClick={() => setConvertendo(leadSel)}
        />
      )}

      {/* Modal conversão */}
      {convertendo && (
        <ModalConverterPaciente
          lead={convertendo}
          onClose={() => { setConvertendo(null); setLeadSel(null); }}
          onConvertido={handleConvertido}
        />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Todos os Leads
            <span className="ml-2 text-gray-600 font-normal">({leads.length})</span>
          </h2>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Nome ou telefone..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>

          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos os status</option>
            {STATUS_LISTA.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button onClick={fetchLeads} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {["#","Nome","Canal","Telefone","Procedimento","Status",""].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {leads.map(l => (
                  <tr key={l.id_lead} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4 text-gray-600 text-xs">{l.id_lead}</td>
                    <td className="py-3 pr-4 font-medium text-white">{l.nome}</td>
                    <td className="py-3 pr-4 text-gray-400">{l.canal_origem || "–"}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{l.telefone || "–"}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{l.procedimento || "–"}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_CORES[l.status_lead] || "bg-gray-700 text-gray-400 border-gray-600"}`}>
                        {STATUS_EMOJI[l.status_lead]} {l.status_lead}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setLeadSel(l)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
                      >
                        Ver detalhes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
