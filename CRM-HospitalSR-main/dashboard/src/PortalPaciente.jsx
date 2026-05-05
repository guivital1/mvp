// src/PortalPaciente.jsx
// Portal do Paciente – Hospital São Rafael
// Rota: /paciente
// Integrado à mesma API e banco do dashboard interno.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  User, Mail, Phone, Lock, LogOut, Calendar, DollarSign,
  MessageSquare, Activity, CheckCircle, XCircle, ChevronRight,
  Plus, X, Home, FileText, Bell, Settings,
} from "lucide-react";
import axios from "axios";

const http = axios.create({ baseURL: "http://localhost:8000", timeout: 8000 });

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════
const calcIMC = (peso, altura) => {
  const p = parseFloat(peso), a = parseFloat(altura);
  if (!p || !a || a === 0) return null;
  return (p / (a * a)).toFixed(2);
};

const classeIMC = (imc) => {
  const v = parseFloat(imc);
  if (!v) return null;
  if (v < 18.5) return { label: "Abaixo do peso", cor: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" };
  if (v < 25)   return { label: "Normal",          cor: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (v < 30)   return { label: "Sobrepeso",        cor: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" };
  return              { label: "Obesidade",          cor: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" };
};

const STATUS_AGD = {
  agendado:   { cor: "text-blue-400",    bg: "bg-blue-500/20",    emoji: "🔵" },
  atendido:   { cor: "text-emerald-400", bg: "bg-emerald-500/20", emoji: "✅" },
  falta:      { cor: "text-red-400",     bg: "bg-red-500/20",     emoji: "❌" },
  cancelado:  { cor: "text-gray-400",    bg: "bg-gray-700",       emoji: "🚫" },
  reagendado: { cor: "text-yellow-400",  bg: "bg-yellow-500/20",  emoji: "🟠" },
  abandono:   { cor: "text-gray-500",    bg: "bg-gray-700",       emoji: "⚫" },
};

const STATUS_ORC = {
  aberto:         { cor: "text-blue-400",    bg: "bg-blue-500/20" },
  "em andamento": { cor: "text-yellow-400",  bg: "bg-yellow-500/20" },
  fechado:        { cor: "text-emerald-400", bg: "bg-emerald-500/20" },
  encerrado:      { cor: "text-red-400",     bg: "bg-red-500/20" },
};

const STATUS_SAC = {
  pendente:       { cor: "text-red-400",     bg: "bg-red-500/20",     emoji: "⏳" },
  "em tratativa": { cor: "text-yellow-400",  bg: "bg-yellow-500/20",  emoji: "🔄" },
  resolvido:      { cor: "text-emerald-400", bg: "bg-emerald-500/20", emoji: "✅" },
};

// ══════════════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ══════════════════════════════════════════════════════════════════
function Card({ children, className = "" }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, msg, action, onAction }) {
  return (
    <div className="text-center py-12">
      <Icon size={32} className="text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm mb-3">{msg}</p>
      {action && (
        <button onClick={onAction} className="text-emerald-400 text-sm hover:underline">{action}</button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TELA DE LOGIN / CADASTRO
// ══════════════════════════════════════════════════════════════════
function TelaAuth({ onLogin }) {
  const [modo, setModo]       = useState("login"); // login | cadastro
  const [form, setForm]       = useState({
    nome_completo: "", cpf: "", email: "", senha: "",
    telefone: "", sexo: "", data_nascimento: "", peso: "", altura: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.senha) { setErro("Preencha e-mail e senha."); return; }
    setErro(""); setLoading(true);
    try {
      const { data } = await http.post("/pacientes/login", {
        email: form.email.trim(),
        senha: form.senha,
      });
      // Busca dados completos com histórico
      const full = await http.get(`/pacientes/${data.id_paciente}`);
      onLogin({ ...data, ...full.data });
    } catch (e) {
      const msg = e?.response?.data?.detail;
      if (e?.response?.status === 404) setErro("E-mail não encontrado.");
      else if (e?.response?.status === 401) setErro("Senha incorreta.");
      else setErro(msg || "Erro ao conectar. Verifique se a API está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!form.nome_completo || !form.cpf || !form.email || !form.senha || !form.data_nascimento) {
      setErro("Preencha todos os campos obrigatórios."); return;
    }
    if (form.senha.length < 6) { setErro("Senha deve ter mínimo 6 caracteres."); return; }
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setErro("E-mail inválido."); return;
    }
    setErro(""); setLoading(true);
    try {
      await http.post("/pacientes", {
        nome_completo:   form.nome_completo,
        cpf:             form.cpf.replace(/\D/g, ""),
        email:           form.email.trim(),
        senha:           form.senha,
        telefone:        form.telefone || null,
        sexo:            form.sexo     || null,
        data_nascimento: form.data_nascimento,
        peso:            form.peso   ? parseFloat(form.peso)   : null,
        altura:          form.altura ? parseFloat(form.altura) : null,
      });
      // Login automático após cadastro
      const { data } = await http.post("/pacientes/login", {
        email: form.email.trim(),
        senha: form.senha,
      });
      onLogin(data);
    } catch (e) {
      setErro(e?.response?.data?.detail || "CPF ou e-mail já cadastrado.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Hospital São Rafael</h1>
          <p className="text-gray-500 text-sm mt-1">Portal do Paciente</p>
        </div>

        <Card>
          {/* Toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            {["login","cadastro"].map(m => (
              <button
                key={m}
                onClick={() => { setModo(m); setErro(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize
                  ${modo === m ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"}`}
              >
                {m === "login" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {modo === "cadastro" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nome completo *</label>
                  <input type="text" value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Seu nome completo"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">CPF *</label>
                  <input type="text" value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="Somente números" maxLength={11}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">E-mail *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="seu@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Senha *</label>
              <input type="password" value={form.senha} onChange={e => set("senha", e.target.value)} placeholder={modo === "cadastro" ? "Mínimo 6 caracteres" : "Sua senha"}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            {modo === "cadastro" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Data de nascimento *</label>
                  <input type="text" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} placeholder="DD/MM/AAAA"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Sexo</label>
                    <select value={form.sexo} onChange={e => set("sexo", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="">–</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="O">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Peso (kg)</label>
                    <input type="number" value={form.peso} onChange={e => set("peso", e.target.value)} placeholder="70.5"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Altura (m)</label>
                    <input type="number" value={form.altura} onChange={e => set("altura", e.target.value)} placeholder="1.75"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Telefone / WhatsApp</label>
                  <input type="text" value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </>
            )}
          </div>

          {erro && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <button
            onClick={modo === "login" ? handleLogin : handleCadastro}
            disabled={loading}
            className="mt-5 w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : modo === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: MEUS DADOS
// ══════════════════════════════════════════════════════════════════
function MeusDados({ pac, onAtualizar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm]         = useState({
    telefone: pac.telefone || "",
    peso:     pac.peso     || "",
    altura:   pac.altura   || "",
    senha:    "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const imc = calcIMC(form.peso || pac.peso, form.altura || pac.altura);
  const cls = imc ? classeIMC(imc) : null;

  const salvar = async () => {
    if (form.senha && form.senha.length < 6) { setErro("Senha mínima: 6 caracteres."); return; }
    setSalvando(true); setErro("");
    try {
      const body = {
        nome_completo:   pac.nome_completo,
        cpf:             pac.cpf,
        email:           pac.email,
        senha:           form.senha || pac.senha,
        telefone:        form.telefone || null,
        sexo:            pac.sexo,
        data_nascimento: pac.data_nascimento,
        peso:            form.peso   ? parseFloat(form.peso)   : null,
        altura:          form.altura ? parseFloat(form.altura) : null,
      };
      await http.delete(`/pacientes/${pac.id_paciente}`);
      await http.post("/pacientes", body);
      onAtualizar({ ...pac, ...body });
      setEditando(false);
    } catch (e) {
      setErro("Erro ao atualizar dados.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle title="Meus Dados" sub="Suas informações cadastrais" />

      {/* Avatar e nome */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl flex-shrink-0">
            {pac.nome_completo?.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{pac.nome_completo}</p>
            <p className="text-sm text-gray-500">{pac.email}</p>
            <p className="text-xs text-gray-600 mt-0.5">CPF: {pac.cpf}</p>
          </div>
        </div>
      </Card>

      {/* IMC */}
      {imc && cls && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${cls.bg} ${cls.border}`}>
          <div>
            <p className="text-xs text-gray-400">Seu IMC</p>
            <p className={`text-2xl font-bold mt-0.5 ${cls.cor}`}>{imc}</p>
            <p className={`text-xs mt-0.5 ${cls.cor}`}>{cls.label}</p>
          </div>
          <Activity size={32} className={`${cls.cor} opacity-30`} />
        </div>
      )}

      {/* Dados pessoais */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-300">Informações Pessoais</p>
          <button
            onClick={() => setEditando(!editando)}
            className="text-xs text-emerald-400 hover:underline"
          >
            {editando ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editando ? (
          <div className="space-y-3">
            {[
              { label: "Telefone", k: "telefone", placeholder: "(11) 99999-9999" },
              { label: "Peso (kg)", k: "peso", placeholder: "70.5", type: "number" },
              { label: "Altura (m)", k: "altura", placeholder: "1.75", type: "number" },
              { label: "Nova senha (deixe em branco para manter)", k: "senha", type: "password", placeholder: "Mínimo 6 caracteres" },
            ].map(({ label, k, placeholder, type = "text" }) => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[k]}
                  onChange={e => set(k, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            ))}
            {imc && <div className="bg-gray-800/50 rounded-xl px-4 py-2 flex items-center justify-between"><span className="text-xs text-gray-500">IMC calculado</span><span className={`text-sm font-bold ${cls?.cor}`}>{imc}</span></div>}
            {erro && <p className="text-red-400 text-xs">{erro}</p>}
            <button
              onClick={salvar}
              disabled={salvando}
              className="w-full py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { icon: Phone,    label: "Telefone",   value: pac.telefone        || "–" },
              { icon: User,     label: "Nascimento", value: pac.data_nascimento || "–" },
              { icon: User,     label: "Sexo",       value: pac.sexo            || "–" },
              { icon: Activity, label: "Peso",       value: pac.peso   ? `${pac.peso} kg`   : "–" },
              { icon: Activity, label: "Altura",     value: pac.altura ? `${pac.altura} m`   : "–" },
              { icon: Activity, label: "Cadastro",   value: pac.entrada         || "–" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={14} className="text-gray-600 flex-shrink-0" />
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                <span className="text-sm text-white">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: AGENDAMENTOS
// ══════════════════════════════════════════════════════════════════
function MeusAgendamentos({ pacId }) {
  const [agds, setAgds]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [medicos, setMedicos]   = useState([]);
  const [procs, setProcs]       = useState([]);
  const [form, setForm]         = useState({ id_medico: "", id_procedimento: "", data_hora: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/agendamentos");
      setAgds((data.agendamentos || []).filter(a => a.id_paciente === pacId || a.paciente));
    } catch { setAgds([]); }
    finally { setLoading(false); }
  }, [pacId]);

  useEffect(() => {
    fetch();
    http.get("/medicos").then(r => setMedicos(r.data.medicos || [])).catch(() => {});
    http.get("/procedimentos").then(r => setProcs(r.data.procedimentos || [])).catch(() => {});
  }, [fetch]);

  const solicitar = async () => {
    if (!form.id_medico || !form.id_procedimento || !form.data_hora) {
      setErro("Preencha todos os campos."); return;
    }
    setSalvando(true); setErro("");
    try {
      const [datePart, timePart] = form.data_hora.split("T");
      const [y, m, d] = datePart.split("-");
      await http.post("/agendamentos", {
        id_paciente:     pacId,
        id_medico:       parseInt(form.id_medico),
        id_procedimento: parseInt(form.id_procedimento),
        data_hora:       `${d}/${m}/${y} ${timePart}`,
        origem:          "CRM",
      });
      setShowNovo(false);
      setForm({ id_medico: "", id_procedimento: "", data_hora: "" });
      fetch();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao agendar.");
    } finally { setSalvando(false); }
  };

  const cancelar = async (id) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await http.patch(`/agendamentos/${id}/status`, { status: "cancelado" });
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle title="Meus Agendamentos" sub="Consultas e procedimentos" />
        <button
          onClick={() => setShowNovo(!showNovo)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
        >
          <Plus size={13} /> Solicitar
        </button>
      </div>

      {/* Formulário novo agendamento */}
      {showNovo && (
        <Card>
          <p className="text-sm font-semibold text-white mb-3">Solicitar Agendamento</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médico *</label>
              <select value={form.id_medico} onChange={e => setForm(f => ({ ...f, id_medico: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="">Selecione...</option>
                {medicos.map(m => <option key={m.id_medico} value={m.id_medico}>{m.nome_medico} – {m.especialidade || "Especialista"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Procedimento *</label>
              <select value={form.id_procedimento} onChange={e => setForm(f => ({ ...f, id_procedimento: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="">Selecione...</option>
                {procs.map(p => <option key={p.id_procedimento} value={p.id_procedimento}>{p.nome_especifico}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data e hora *</label>
              <input type="datetime-local" value={form.data_hora} onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            {erro && <p className="text-red-400 text-xs">{erro}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowNovo(false)} className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancelar</button>
              <button onClick={solicitar} disabled={salvando} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {salvando ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {loading ? <Spinner /> : agds.length === 0 ? (
        <EmptyState icon={Calendar} msg="Nenhum agendamento encontrado." action="+ Solicitar agendamento" onAction={() => setShowNovo(true)} />
      ) : (
        <div className="space-y-3">
          {agds.map((a, i) => {
            const st = STATUS_AGD[a.status] || { cor: "text-gray-400", bg: "bg-gray-700", emoji: "⚪" };
            return (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{st.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{a.procedimento}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.medico}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{a.data_hora}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.cor}`}>{a.status}</span>
                    {a.status === "agendado" && (
                      <button onClick={() => cancelar(a.id_agendamento)} className="text-xs text-red-400 hover:underline">Cancelar</button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: ORÇAMENTOS
// ══════════════════════════════════════════════════════════════════
function MeusOrcamentos({ pacId }) {
  const [orcs, setOrcs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get("/orcamentos")
      .then(r => setOrcs((r.data.orcamentos || []).filter(o => o.id_paciente === pacId)))
      .catch(() => setOrcs([]))
      .finally(() => setLoading(false));
  }, [pacId]);

  return (
    <div className="space-y-4">
      <SectionTitle title="Meus Orçamentos" sub="Orçamentos de procedimentos" />
      {loading ? <Spinner /> : orcs.length === 0 ? (
        <EmptyState icon={DollarSign} msg="Nenhum orçamento encontrado." />
      ) : (
        <div className="space-y-3">
          {orcs.map((o, i) => {
            const st = STATUS_ORC[o.status_orc] || { cor: "text-gray-400", bg: "bg-gray-700" };
            return (
              <Card key={i}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{o.procedimento}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.medico}  •  {o.data_criacao}</p>
                    {o.motivo_perda && <p className="text-xs text-red-400 mt-1">Motivo: {o.motivo_perda}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-white">R$ {Number(o.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.cor}`}>{o.status_orc}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: SAC
// ══════════════════════════════════════════════════════════════════
function MeuSac({ pacId }) {
  const [sacs, setSacs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [motivo, setMotivo]     = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/sac");
      setSacs((data.sac || []).filter(s => s.id_paciente === pacId));
    } catch { setSacs([]); }
    finally { setLoading(false); }
  }, [pacId]);

  useEffect(() => { fetch(); }, [fetch]);

  const abrir = async () => {
    if (!motivo || motivo.length < 10) { setErro("Descreva o problema com pelo menos 10 caracteres."); return; }
    setSalvando(true); setErro("");
    try {
      await http.post("/sac", { id_paciente: pacId, motivo });
      setMotivo(""); setShowNovo(false); fetch();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao abrir SAC.");
    } finally { setSalvando(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle title="Suporte (SAC)" sub="Reclamações e solicitações" />
        <button
          onClick={() => setShowNovo(!showNovo)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl hover:bg-red-500/30 transition-colors"
        >
          <Plus size={13} /> Abrir SAC
        </button>
      </div>

      {showNovo && (
        <Card>
          <p className="text-sm font-semibold text-white mb-3">Nova Reclamação</p>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Descreva detalhadamente o problema..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none mb-3"
          />
          {erro && <p className="text-red-400 text-xs mb-3">{erro}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowNovo(false)} className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancelar</button>
            <button onClick={abrir} disabled={salvando} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
              {salvando ? "Enviando..." : "Abrir SAC"}
            </button>
          </div>
        </Card>
      )}

      {loading ? <Spinner /> : sacs.length === 0 ? (
        <EmptyState icon={MessageSquare} msg="Nenhuma reclamação registrada." />
      ) : (
        <div className="space-y-3">
          {sacs.map((s, i) => {
            const st = STATUS_SAC[s.status_solucao] || { cor: "text-gray-400", bg: "bg-gray-700", emoji: "⚪" };
            const vencido = s.prazo_limite && new Date(s.prazo_limite) < new Date() && s.status_solucao !== "resolvido";
            return (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{st.emoji}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.cor}`}>{s.status_solucao}</span>
                      {vencido && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">VENCIDO</span>}
                    </div>
                    <p className="text-sm text-white">{s.motivo}</p>
                    <p className="text-xs text-gray-600 mt-1">Abertura: {s.data_abertura}  •  Prazo: {s.prazo_limite}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: CHECKLIST PRÉ-CIRÚRGICO
// ══════════════════════════════════════════════════════════════════
function MeuPreCirurgico({ pacId, pacNome }) {
  const [chk, setChk]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showEnvio, setShowEnvio] = useState(false);
  const [form, setForm]         = useState({
    exames:  "",
    canal:   "WhatsApp",
    obs:     "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [erro, setErro]         = useState("");

  useEffect(() => {
    http.get("/pre-cirurgico")
      .then(r => {
        const lista = r.data.checklists || [];
        setChk(lista.find(c => c.id_paciente === pacId) || null);
      })
      .catch(() => setChk(null))
      .finally(() => setLoading(false));
  }, [pacId]);

  const apto = chk && chk.status_imc && chk.exames_completos && chk.checklist_ok && chk.autorizacao_med;

  const enviarNotificacao = async () => {
    if (!form.exames.trim()) { setErro("Descreva quais exames você possui."); return; }
    setErro(""); setEnviando(true);
    try {
      const motivo = `[EXAMES PRÉ-CIRÚRGICOS] Paciente informa que possui os seguintes exames:\n\n${form.exames}\n\nCanal de envio: ${form.canal}\n${form.obs ? `\nObservação: ${form.obs}` : ""}`;
      await http.post("/sac", { id_paciente: pacId, motivo });
      setEnviado(true);
      setShowEnvio(false);
    } catch {
      setErro("Erro ao enviar notificação. Tente novamente.");
    } finally {
      setEnviando(false); }
  };

  const ItemCheck = ({ ok, label, sub }) => (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-all
      ${ok ? "bg-emerald-500/10 border-emerald-500/20" : "bg-gray-800/50 border-gray-700"}`}>
      {ok
        ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        : <XCircle    size={18} className="text-gray-600 flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <span className={`text-sm font-medium ${ok ? "text-emerald-400" : "text-gray-400"}`}>{label}</span>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 ${ok ? "text-emerald-400" : "text-gray-600"}`}>
        {ok ? "✓ OK" : "Pendente"}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionTitle title="Pré-Cirúrgico" sub="Acompanhe sua aptidão e envie seus exames" />

      {loading ? <Spinner /> : (
        <>
          {/* Status geral */}
          {chk ? (
            <div className={`rounded-2xl border p-5 text-center
              ${apto ? "bg-emerald-500/10 border-emerald-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
              <p className={`text-lg font-bold ${apto ? "text-emerald-400" : "text-yellow-400"}`}>
                {apto ? "✅ Você está APTO(a) para a cirurgia!" : "⚠️ Situação: PENDENTE"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {apto
                  ? "Todos os critérios foram aprovados pelo hospital."
                  : "Alguns itens ainda aguardam aprovação da equipe médica."}
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <FileText size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Checklist ainda não iniciado.</p>
              <p className="text-gray-600 text-xs mt-1">O hospital preencherá após sua consulta inicial.</p>
            </div>
          )}

          {/* Itens do checklist */}
          {chk && (
            <div className="space-y-2">
              <ItemCheck ok={!!chk.status_imc}      label="IMC dentro do limite aprovado"     sub="Avaliado pelo médico" />
              <ItemCheck ok={!!chk.exames_completos} label="Exames pré-operatórios completos"  sub="Hemograma, ECG, coagulação e outros" />
              <ItemCheck ok={!!chk.checklist_ok}     label="Checklist de segurança aprovado"   sub="Alergias, medicamentos e protocolos" />
              <ItemCheck ok={!!chk.autorizacao_med}  label="Autorização médica assinada"        sub="Termo de consentimento informado" />
            </div>
          )}

          {/* Seção de envio de exames */}
          {!apto && (
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Enviar meus exames</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Informe quais exames você possui e como prefere enviá-los ao hospital.
                    Nossa equipe entrará em contato para confirmar.
                  </p>
                </div>
              </div>

              {enviado ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-400">Notificação enviada!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    O hospital foi avisado. Aguarde o contato da nossa equipe.
                  </p>
                </div>
              ) : showEnvio ? (
                <div className="space-y-3">
                  {/* Exames que possui */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Quais exames você possui? *
                    </label>
                    <textarea
                      value={form.exames}
                      onChange={e => setForm(f => ({ ...f, exames: e.target.value }))}
                      placeholder="ex: Hemograma completo (realizado em 10/01), ECG (15/01), ultrassom abdominal..."
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Canal de envio */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Como prefere enviar os exames?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["WhatsApp", "E-mail", "Presencial"].map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, canal: c }))}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all
                            ${form.canal === c
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                            }`}
                        >
                          {c === "WhatsApp" ? "💬 " : c === "E-mail" ? "📧 " : "🏥 "}{c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Observações adicionais (opcional)
                    </label>
                    <textarea
                      value={form.obs}
                      onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
                      placeholder="ex: Prefiro ser contatado pela manhã, meu número é (11) 99999-9999..."
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {erro && <p className="text-red-400 text-xs">{erro}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowEnvio(false); setErro(""); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={enviarNotificacao}
                      disabled={enviando}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {enviando ? "Enviando..." : "Notificar Hospital"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEnvio(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Informar que tenho os exames
                </button>
              )}
            </Card>
          )}

          {/* Dica */}
          {!apto && !enviado && (
            <p className="text-xs text-gray-600 text-center px-4">
              Após enviar seus exames, nossa equipe analisará e atualizará seu checklist em até 48h.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SEÇÃO: HISTÓRICO
// ══════════════════════════════════════════════════════════════════
function MeuHistorico({ pacId }) {
  const [hist, setHist]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      http.get("/agendamentos"),
      http.get("/orcamentos"),
      http.get("/sac"),
    ]).then(([agdR, orcR, sacR]) => {
      const agds = (agdR.data.agendamentos || []).map(a => ({ tipo: "Agendamento", data: a.data_hora,   desc: `${a.procedimento} com ${a.medico}`, status: a.status,     cor: "blue" }));
      const orcs = (orcR.data.orcamentos   || []).map(o => ({ tipo: "Orçamento",   data: o.data_criacao,desc: `${o.procedimento} – R$ ${Number(o.valor_total).toFixed(2)}`, status: o.status_orc, cor: "emerald" }));
      const sacs = (sacR.data.sac          || []).filter(s => s.id_paciente === pacId).map(s => ({ tipo: "SAC", data: s.data_abertura, desc: s.motivo, status: s.status_solucao, cor: "red" }));
      const todos = [...agds, ...orcs, ...sacs].sort((a, b) => new Date(b.data) - new Date(a.data));
      setHist(todos);
    }).catch(() => setHist([]))
      .finally(() => setLoading(false));
  }, [pacId]);

  const COR = { blue: "bg-blue-500", emerald: "bg-emerald-500", red: "bg-red-500", purple: "bg-purple-500" };

  return (
    <div className="space-y-4">
      <SectionTitle title="Meu Histórico" sub="Linha do tempo de eventos" />
      {loading ? <Spinner /> : hist.length === 0 ? (
        <EmptyState icon={FileText} msg="Nenhum evento registrado." />
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />
          <div className="space-y-4 pl-10">
            {hist.map((h, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full ${COR[h.cor] || "bg-gray-500"} ring-2 ring-gray-950`} />
                <Card className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COR[h.cor]}/20 text-${h.cor}-400`}>
                        {h.tipo}
                      </span>
                      <p className="text-sm text-white mt-1">{h.desc}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{h.data}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{h.status}</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PORTAL PRINCIPAL
// ══════════════════════════════════════════════════════════════════
const ABAS = [
  { id: "dados",        label: "Início",       icon: Home },
  { id: "agendamentos", label: "Agendamentos", icon: Calendar },
  { id: "orcamentos",   label: "Orçamentos",   icon: DollarSign },
  { id: "sac",          label: "SAC",          icon: MessageSquare },
  { id: "pre_cirurgico",label: "Pré-Cirúrg.",  icon: CheckCircle },
  { id: "historico",    label: "Histórico",    icon: FileText },
];

function PortalLogado({ pac, onLogout, onAtualizar }) {
  const [aba, setAba] = useState("dados");

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Activity size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">Hospital São Rafael</p>
          <p className="text-xs text-emerald-400">Portal do Paciente</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-bold">
            {pac.nome_completo?.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-24">
        {aba === "dados"         && <MeusDados pac={pac} onAtualizar={onAtualizar} />}
        {aba === "agendamentos"  && <MeusAgendamentos pacId={pac.id_paciente} />}
        {aba === "orcamentos"    && <MeusOrcamentos pacId={pac.id_paciente} />}
        {aba === "sac"           && <MeuSac pacId={pac.id_paciente} />}
        {aba === "pre_cirurgico" && <MeuPreCirurgico pacId={pac.id_paciente} />}
        {aba === "historico"     && <MeuHistorico pacId={pac.id_paciente} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-20">
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-all
              ${aba === id ? "text-emerald-400" : "text-gray-600 hover:text-gray-400"}`}
          >
            <Icon size={18} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EXPORT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function PortalPaciente() {
  const [pac, setPac] = useState(null);

  const handleLogout = () => setPac(null);
  const handleAtualizar = (novoPac) => setPac(novoPac);

  if (!pac) return <TelaAuth onLogin={setPac} />;
  return <PortalLogado pac={pac} onLogout={handleLogout} onAtualizar={handleAtualizar} />;
}