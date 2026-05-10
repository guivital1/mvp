// src/ChatbotLead.jsx
// Página PÚBLICA de captação de leads – Hospital São Rafael
// Compartilhe o link /lead no Instagram, WhatsApp, etc.
// Os leads aparecem automaticamente no dashboard interno.

import { useState, useEffect, useRef } from "react";
import { criarLead, getProcedimentos, getMedicos } from "./api";

// ══════════════════════════════════════════════════════════════════
//  ESTILOS (paleta dourada)
// ══════════════════════════════════════════════════════════════════
const gold   = "#b8965a";
const goldDk = "#8c6e3f";
const goldLt = "#d4b483";
const bg     = "#f5f0e8";
const bg2    = "#ede8de";
const white  = "#ffffff";
const text   = "#2c2416";
const soft   = "#7a6a52";

// ══════════════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ══════════════════════════════════════════════════════════════════

function Logo() {
  return (
    <header style={{ background: white, borderBottom: `1px solid #e0d9cc`, padding: "16px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: gold, fontWeight: "bold", fontSize: 18, letterSpacing: 2 }}>
        <span style={{ fontSize: 22 }}>✚</span>
        <span>R</span>
        <span style={{ fontSize: 12, color: soft, fontWeight: "normal", letterSpacing: 0.5, marginLeft: 4 }}>Hospital São Rafael</span>
      </div>
    </header>
  );
}

function BotMsg({ text, delay = 0 }) {
  const [vis, setVis] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }
  }, [delay]);
  if (!vis) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "fadeUp 0.3s ease" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: gold, color: white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>SR</div>
      <div style={{ maxWidth: "78%", background: bg2, color: text, fontSize: 14, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function UserMsg({ text }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: "row-reverse", animation: "fadeUp 0.3s ease" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg2, color: goldDk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>Eu</div>
      <div style={{ maxWidth: "78%", background: gold, color: white, fontSize: 14, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: gold, color: white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>SR</div>
      <div style={{ background: bg2, padding: "12px 16px", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5 }}>
        {[0, 150, 300].map(d => (
          <span key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: gold, display: "inline-block", animation: "bounce 1s infinite", animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

function BotaoOpcao({ label, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 18px", border: `1.5px solid ${selected ? gold : "#d4c9b5"}`,
        borderRadius: 50, background: selected ? gold : "transparent",
        color: selected ? white : goldDk, fontSize: 13, cursor: "pointer",
        transition: "all 0.2s", fontFamily: "Georgia, serif",
      }}
    >
      {label}
    </button>
  );
}

function CardProc({ proc, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px solid ${selected ? gold : "#e0d9cc"}`,
        borderRadius: 14, padding: "14px 16px",
        background: selected ? "#fdf8f1" : white,
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 14, color: text, marginBottom: 3 }}>{proc.nome_especifico}</div>
      <div style={{ fontSize: 12, color: soft, marginBottom: 6 }}>{proc.categoria}</div>
      {proc.valor_base && (
        <div style={{ fontSize: 12, color: gold, fontWeight: "bold" }}>
          A partir de R$ {Number(proc.valor_base).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
}

function CardMedico({ med, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px solid ${selected ? gold : "#e0d9cc"}`,
        borderRadius: 14, padding: "12px 16px",
        background: selected ? "#fdf8f1" : white,
        cursor: "pointer", transition: "all 0.2s",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: selected ? gold : bg2, color: selected ? white : goldDk, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14, flexShrink: 0 }}>
        {med.nome_medico.split(" ").map(n => n[0]).slice(0, 2).join("")}
      </div>
      <div>
        <div style={{ fontWeight: "bold", fontSize: 13, color: text }}>{med.nome_medico}</div>
        <div style={{ fontSize: 11, color: soft }}>{med.especialidade || "Especialista"}</div>
      </div>
      {selected && <div style={{ marginLeft: "auto", color: gold, fontSize: 16 }}>✓</div>}
    </div>
  );
}

function BotaoGold({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", background: disabled ? "#d4c9b5" : gold,
        color: white, border: "none", borderRadius: 12,
        padding: "14px 0", fontSize: 14, fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.5, transition: "background 0.2s",
        fontFamily: "Georgia, serif",
      }}
    >
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: soft, marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: bg, border: `1px solid #e0d9cc`,
          borderRadius: 10, padding: "10px 14px", fontSize: 14,
          color: text, outline: "none", fontFamily: "Georgia, serif",
          boxSizing: "border-box", transition: "border 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = gold}
        onBlur={e => e.target.style.borderColor = "#e0d9cc"}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  FLUXO PRINCIPAL
// ══════════════════════════════════════════════════════════════════
// Etapas: objetivo → procedimento → medico → chat → confirmacao → sucesso

export default function ChatbotLead() {
  const [etapa, setEtapa]         = useState("objetivo");
  const [canal, setCanal]         = useState("Instagram");
  const [procs, setProcs]         = useState([]);
  const [medicos, setMedicos]     = useState([]);
  const [procSel, setProcSel]     = useState(null);
  const [medSel, setMedSel]       = useState(null);

  // Chat
  const [msgs, setMsgs]           = useState([]);
  const [input, setInput]         = useState("");
  const [typing, setTyping]       = useState(false);
  const [chatStep, setChatStep]   = useState(0); // 0=nome 1=email 2=tel

  // Dados coletados
  const [dados, setDados]         = useState({ nome: "", email: "", telefone: "" });

  // Confirmação
  const [enviando, setEnviando]   = useState(false);
  const [erro, setErro]           = useState("");

  const msgsRef = useRef(null);

  // Carrega dados da API
  useEffect(() => {
    getProcedimentos().then(({ data }) => setProcs(data.procedimentos || [])).catch(() => {});
    getMedicos().then(({ data }) => setMedicos(data.medicos || [])).catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing]);

  // Inicia chat
  useEffect(() => {
    if (etapa !== "chat") return;
    const proc = procSel?.nome_especifico || "o procedimento";
    const med  = medSel?.nome_medico ? ` com o Dr(a). ${medSel.nome_medico}` : "";
    setMsgs([
      { from: "bot", text: `Perfeito! Vamos marcar ${proc}${med}. 😊`, delay: 0 },
      { from: "bot", text: "Para começar, como posso te chamar?", delay: 800 },
    ]);
    setChatStep(0);
  }, [etapa]);

  const botDiz = (text, delay = 700) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(prev => [...prev, { from: "bot", text }]);
    }, delay);
  };

  const enviar = () => {
    const val = input.trim();
    if (!val) return;
    setMsgs(prev => [...prev, { from: "user", text: val }]);
    setInput("");

    if (chatStep === 0) {
      setDados(d => ({ ...d, nome: val }));
      botDiz(`Que nome lindo, ${val.split(" ")[0]}! 😊 Qual é o seu melhor e-mail?`);
      setChatStep(1);
    } else if (chatStep === 1) {
      if (!val.includes("@") || !val.includes(".")) {
        botDiz("Hmm, esse e-mail não parece válido. Pode confirmar?");
        return;
      }
      setDados(d => ({ ...d, email: val }));
      botDiz("Ótimo! Agora me passa seu WhatsApp com DDD para entrarmos em contato. 📱");
      setChatStep(2);
    } else if (chatStep === 2) {
      setDados(d => ({ ...d, telefone: val }));
      botDiz("Perfeito! 🎉 Deixa eu confirmar tudo com você...", 600);
      setTimeout(() => setEtapa("confirmacao"), 2000);
      setChatStep(3);
    }
  };

  const confirmar = async () => {
    setErro("");
    setEnviando(true);
    try {
      await criarLead({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf || null,
        canal_origem: canal,
        id_procedimento: procSel?.id_procedimento || null,
        id_medico_pref: medSel?.id_medico || null,
});
      setEtapa("sucesso");
    } catch {
      setErro("Erro ao enviar. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  // ── ESTILOS DE PÁGINA ─────────────────────────────────────────
  const page = { minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif" };
  const wrap = { maxWidth: 480, width: "100%", margin: "0 auto", padding: "28px 16px 48px", display: "flex", flexDirection: "column", gap: 20, flex: 1 };
  const card = { background: white, borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "24px 20px" };
  const h1   = { fontSize: 22, color: text, fontWeight: "bold", marginBottom: 6, lineHeight: 1.3 };
  const sub  = { fontSize: 13, color: soft, fontStyle: "italic", marginBottom: 20 };

  // ── TELA 1: Objetivo / Canal ──────────────────────────────────
  if (etapa === "objetivo") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div>
          <h1 style={h1}>Conte-nos o seu objetivo</h1>
          <p style={sub}>Vamos encontrar o procedimento ideal para você.</p>
          <p style={{ fontSize: 12, color: soft, marginBottom: 10 }}>Como nos encontrou?</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {["Instagram","Google","Facebook","TikTok","Indicação","Site"].map(op => (
              <BotaoOpcao key={op} label={op} selected={canal === op} onClick={() => setCanal(op)} />
            ))}
          </div>
        </div>
        <BotaoGold label="Continuar →" onClick={() => setEtapa("procedimento")} />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );

  // ── TELA 2: Escolher Procedimento ─────────────────────────────
  if (etapa === "procedimento") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div>
          <h1 style={h1}>Qual procedimento te interessa?</h1>
          <p style={sub}>Selecione o que você deseja realizar.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {procs.length === 0 ? (
            <p style={{ color: soft, fontSize: 13, fontStyle: "italic" }}>Carregando procedimentos...</p>
          ) : procs.map(p => (
            <CardProc
              key={p.id_procedimento}
              proc={p}
              selected={procSel?.id_procedimento === p.id_procedimento}
              onClick={() => setProcSel(p)}
            />
          ))}
        </div>

        {procSel && (
          <BotaoGold label={`Continuar com ${procSel.nome_especifico} →`} onClick={() => setEtapa("medico")} />
        )}
        <button onClick={() => setEtapa("objetivo")} style={{ background: "none", border: "none", color: soft, fontSize: 12, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
          ← Voltar
        </button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );

  // ── TELA 3: Escolher Médico ───────────────────────────────────
  if (etapa === "medico") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div>
          <h1 style={h1}>Tem preferência de médico?</h1>
          <p style={sub}>Opcional — selecione se tiver preferência.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {medicos.length === 0 ? (
            <p style={{ color: soft, fontSize: 13, fontStyle: "italic" }}>Carregando médicos...</p>
          ) : medicos.map(m => (
            <CardMedico
              key={m.id_medico}
              med={m}
              selected={medSel?.id_medico === m.id_medico}
              onClick={() => setMedSel(prev => prev?.id_medico === m.id_medico ? null : m)}
            />
          ))}
        </div>

        <BotaoGold
          label={medSel ? `Continuar com Dr(a). ${medSel.nome_medico.split(" ")[0]} →` : "Continuar sem preferência →"}
          onClick={() => setEtapa("chat")}
        />
        <button onClick={() => setEtapa("procedimento")} style={{ background: "none", border: "none", color: soft, fontSize: 12, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
          ← Voltar
        </button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );

  // ── TELA 4: Chat ─────────────────────────────────────────────
  if (etapa === "chat") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {/* Mensagens */}
          <div ref={msgsRef} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", maxHeight: 420 }}>
            {msgs.map((m, i) =>
              m.from === "bot"
                ? <BotMsg key={i} text={m.text} delay={m.delay} />
                : <UserMsg key={i} text={m.text} />
            )}
            {typing && <Typing />}
          </div>
          {/* Input */}
          {chatStep < 3 && (
            <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: `1px solid ${bg2}` }}>
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && enviar()}
                placeholder="Escreva sua mensagem..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: text, background: "transparent", fontFamily: "Georgia, serif" }}
              />
              <button
                onClick={enviar}
                style={{ width: 36, height: 36, borderRadius: "50%", background: gold, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );

  // ── TELA 5: Confirmação ───────────────────────────────────────
  if (etapa === "confirmacao") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ ...h1, marginBottom: 6 }}>Confirmar e Agendar</h2>
          <p style={sub}>Verifique se os dados estão corretos antes de enviar.</p>

          {/* Resumo */}
          <div style={{ background: bg, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Nome",          value: dados.nome },
              { label: "E-mail",        value: dados.email },
              { label: "WhatsApp",      value: dados.telefone },
              { label: "Procedimento",  value: procSel?.nome_especifico || "–" },
              { label: "Médico pref.",  value: medSel?.nome_medico      || "Sem preferência" },
              { label: "Canal",         value: canal },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: soft }}>{label}</span>
                <span style={{ color: text, fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Editar campos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <InputField label="Nome completo" value={dados.nome} onChange={v => setDados(d => ({ ...d, nome: v }))} placeholder="Seu nome" />
            <InputField label="E-mail" value={dados.email} onChange={v => setDados(d => ({ ...d, email: v }))} placeholder="seu@email.com" type="email" />
            <InputField label="WhatsApp" value={dados.telefone} onChange={v => setDados(d => ({ ...d, telefone: v }))} placeholder="(11) 99999-9999" />
          </div>

          {erro && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          <BotaoGold
            label={enviando ? "Enviando..." : "Confirmar e Agendar solicitação →"}
            onClick={confirmar}
            disabled={enviando}
          />
        </div>
        <button onClick={() => setEtapa("chat")} style={{ background: "none", border: "none", color: soft, fontSize: 12, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
          ← Voltar
        </button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );

  // ── TELA 6: Sucesso ───────────────────────────────────────────
  if (etapa === "sucesso") return (
    <div style={page}>
      <Logo />
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>
            ✨
          </div>
          <h2 style={{ fontSize: 22, color: text, fontWeight: "bold", marginBottom: 10 }}>Agora é só confirmar!</h2>
          <p style={{ fontSize: 13, color: soft, lineHeight: 1.6, marginBottom: 20 }}>
            Recebemos sua solicitação com sucesso!<br />
            Em breve nossa equipe entrará em contato pelo WhatsApp <strong style={{ color: text }}>{dados.telefone}</strong> para confirmar o agendamento.
          </p>

          {/* Resumo final */}
          <div style={{ background: bg, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left" }}>
            {[
              { label: "Nome",         value: dados.nome },
              { label: "Procedimento", value: procSel?.nome_especifico || "–" },
              { label: "Médico",       value: medSel?.nome_medico      || "A definir" },
              { label: "Canal",        value: canal },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: soft }}>{label}</span>
                <span style={{ color: text, fontWeight: "bold" }}>{value}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "#c0b49a" }}>
            Obrigado pela confiança no Hospital São Rafael 💛
          </p>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
