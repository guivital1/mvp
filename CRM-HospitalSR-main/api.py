"""
api.py – API REST | Hospital São Rafael
Challenge FIAP – Engenharia de Software 2º Ano

Expõe os dados do banco via HTTP para consumo do dashboard
(Streamlit, React, Power BI, etc.)

Instalação:
    pip install fastapi uvicorn

Execução:
    uvicorn api:app --reload --port 8000

Documentação interativa (gerada automaticamente):
    http://localhost:8000/docs
    http://localhost:8000/redoc
"""

import sqlite3
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_FILE = "hospital.db"

# ══════════════════════════════════════════════════════════════════
#  APLICAÇÃO
# ══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Hospital São Rafael – API",
    description="API interna para gestão hospitalar e dashboard CRM.",
    version="1.0.0",
)

# CORS liberado (ajustar origem em produção)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  UTILITÁRIOS
# ══════════════════════════════════════════════════════════════════

def conectar() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # retorna dicionários
    return conn


def rows_to_list(rows) -> list[dict]:
    return [dict(r) for r in rows]


# ══════════════════════════════════════════════════════════════════
#  SCHEMAS (Pydantic)
# ══════════════════════════════════════════════════════════════════

class PacienteCreate(BaseModel):
    nome_completo:   str
    cpf:             str
    email:           str
    senha:           str
    telefone:        Optional[str] = None
    sexo:            Optional[str] = None   # M | F | O
    data_nascimento: str
    peso:            Optional[float] = None
    altura:          Optional[float] = None


class LeadCreate(BaseModel):
    nome:           str
    email:          Optional[str] = None
    canal_origem:   Optional[str] = None
    telefone:       Optional[str] = None
    id_procedimento: Optional[int] = None
    id_medico_pref:  Optional[int] = None
    id_operador:     Optional[int] = None


class LeadStatusUpdate(BaseModel):
    status_lead: str   # novo | em atendimento | convertido | perdido | reagendado


class AgendamentoCreate(BaseModel):
    id_paciente:     int
    id_medico:       int
    id_procedimento: int
    data_hora:       str   # DD/MM/AAAA HH:MM
    origem:          Optional[str] = "CRM"


class AgendamentoStatusUpdate(BaseModel):
    status: str   # agendado | atendido | falta | cancelado | reagendado | abandono


class MedicoCreate(BaseModel):
    nome_medico:     str
    crm:             str
    especialidade:   Optional[str] = None
    email:           Optional[str] = None
    telefone:        Optional[str] = None
    cpf:             str
    data_nascimento: Optional[str] = None
    local_hospital:  Optional[str] = None


class ProcedimentoCreate(BaseModel):
    categoria:              str
    nome_especifico:        str
    tipo_especialista:      Optional[str]  = None
    descricao_complexidade: Optional[str]  = None
    valor_base:             Optional[float] = None


class OrcamentoCreate(BaseModel):
    id_paciente:     int
    id_medico:       int
    id_procedimento: int
    valor_total:     float


class SacCreate(BaseModel):
    id_paciente: int
    motivo:      str


# ══════════════════════════════════════════════════════════════════
#  ROOT
# ══════════════════════════════════════════════════════════════════

@app.get("/", tags=["Geral"])
def root():
    return {
        "sistema": "Hospital São Rafael",
        "versao": "1.0.0",
        "docs": "/docs",
    }


# ══════════════════════════════════════════════════════════════════
#  DASHBOARD – KPIs (endpoint principal para o dashboard)
# ══════════════════════════════════════════════════════════════════

@app.get("/dashboard/kpis", tags=["Dashboard"])
def kpis():
    """
    Retorna todos os KPIs principais para o dashboard em uma única chamada.
    Ideal para o painel inicial.
    """
    with conectar() as conn:
        t_pac   = conn.execute("SELECT COUNT(*) FROM pacientes").fetchone()[0]
        t_lead  = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        t_agd   = conn.execute("SELECT COUNT(*) FROM agendamentos").fetchone()[0]
        t_med   = conn.execute("SELECT COUNT(*) FROM medicos").fetchone()[0]
        t_proc  = conn.execute("SELECT COUNT(*) FROM procedimentos").fetchone()[0]
        t_orc   = conn.execute("SELECT COUNT(*) FROM orcamentos").fetchone()[0]
        t_sac   = conn.execute("SELECT COUNT(*) FROM sac WHERE status_solucao != 'resolvido'").fetchone()[0]

        conv    = conn.execute("SELECT COUNT(*) FROM leads WHERE status_lead='convertido'").fetchone()[0]
        perdido = conn.execute("SELECT COUNT(*) FROM leads WHERE status_lead='perdido'").fetchone()[0]
        em_at   = conn.execute("SELECT COUNT(*) FROM leads WHERE status_lead='em atendimento'").fetchone()[0]

        atend   = conn.execute("SELECT COUNT(*) FROM agendamentos WHERE status='atendido'").fetchone()[0]
        faltas  = conn.execute("SELECT COUNT(*) FROM agendamentos WHERE status='falta'").fetchone()[0]
        canc    = conn.execute("SELECT COUNT(*) FROM agendamentos WHERE status IN ('cancelado','abandono')").fetchone()[0]

        agd_hoje = conn.execute(
            "SELECT COUNT(*) FROM agendamentos WHERE date(data_hora)=date('now')"
        ).fetchone()[0]

        sac_venc = conn.execute(
            "SELECT COUNT(*) FROM sac WHERE prazo_limite < datetime('now') AND status_solucao != 'resolvido'"
        ).fetchone()[0]

    taxa_conv = round(conv / t_lead * 100, 2) if t_lead else 0
    taxa_falt = round(faltas / t_agd * 100, 2) if t_agd else 0
    taxa_canc = round(canc / t_agd * 100, 2)   if t_agd else 0

    return {
        "totais": {
            "pacientes":      t_pac,
            "leads":          t_lead,
            "agendamentos":   t_agd,
            "medicos":        t_med,
            "procedimentos":  t_proc,
            "orcamentos":     t_orc,
            "sac_abertos":    t_sac,
        },
        "leads": {
            "convertidos":    conv,
            "perdidos":       perdido,
            "em_atendimento": em_at,
            "taxa_conversao_pct": taxa_conv,
        },
        "agendamentos": {
            "atendidos":      atend,
            "faltas":         faltas,
            "cancelados":     canc,
            "hoje":           agd_hoje,
            "taxa_falta_pct": taxa_falt,
            "taxa_cancelamento_pct": taxa_canc,
        },
        "alertas": {
            "sac_prazo_vencido": sac_venc,
        },
        "gerado_em": datetime.now().isoformat(),
    }


@app.get("/dashboard/funil", tags=["Dashboard"])
def funil_leads():
    """Distribuição de leads por status (funil CRM)."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT status_lead, COUNT(*) as total FROM leads GROUP BY status_lead"
        ).fetchall()
    return {"funil": rows_to_list(rows)}


@app.get("/dashboard/leads-por-canal", tags=["Dashboard"])
def leads_por_canal():
    """Leads agrupados por canal de origem."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT canal_origem, COUNT(*) as total FROM leads "
            "WHERE canal_origem IS NOT NULL GROUP BY canal_origem ORDER BY total DESC"
        ).fetchall()
    return {"canais": rows_to_list(rows)}


@app.get("/dashboard/procedimentos-mais-agendados", tags=["Dashboard"])
def procedimentos_mais_agendados(limit: int = Query(default=5, ge=1, le=20)):
    """Ranking dos procedimentos mais agendados."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT pr.nome_especifico, COUNT(*) as total "
            "FROM agendamentos a JOIN procedimentos pr ON a.id_procedimento=pr.id_procedimento "
            "GROUP BY pr.nome_especifico ORDER BY total DESC LIMIT ?", (limit,)
        ).fetchall()
    return {"procedimentos": rows_to_list(rows)}


@app.get("/dashboard/medicos-mais-procurados", tags=["Dashboard"])
def medicos_mais_procurados():
    """Médicos com mais leads de preferência."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT m.nome_medico, m.especialidade, COUNT(l.id_lead) as total_leads "
            "FROM leads l JOIN medicos m ON l.id_medico_pref=m.id_medico "
            "GROUP BY m.id_medico ORDER BY total_leads DESC"
        ).fetchall()
    return {"medicos": rows_to_list(rows)}


@app.get("/dashboard/agendamentos-por-dia", tags=["Dashboard"])
def agendamentos_por_dia(dias: int = Query(default=30, ge=1, le=365)):
    """Volume de agendamentos por dia nos últimos N dias."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT date(data_hora) as dia, COUNT(*) as total "
            "FROM agendamentos "
            "WHERE data_hora >= date('now', ? || ' days') "
            "GROUP BY dia ORDER BY dia",
            (f"-{dias}",)
        ).fetchall()
    return {"dias": dias, "agendamentos_por_dia": rows_to_list(rows)}


# ══════════════════════════════════════════════════════════════════
#  PACIENTES
# ══════════════════════════════════════════════════════════════════

@app.post("/pacientes/login", tags=["Pacientes"])
def login_paciente(body: dict):
    """Autentica um paciente por e-mail e senha."""
    email = body.get("email", "").strip()
    senha = body.get("senha", "").strip()
    if not email or not senha:
        raise HTTPException(status_code=422, detail="E-mail e senha são obrigatórios.")
    with conectar() as conn:
        row = conn.execute(
            "SELECT id_paciente, nome_completo, cpf, email, telefone, sexo, "
            "data_nascimento, peso, altura, entrada, senha FROM pacientes WHERE email=?",
            (email,)
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="E-mail não encontrado.")
    if row[10] != senha:
        raise HTTPException(status_code=401, detail="Senha incorreta.")
    return {
        "id_paciente":    row[0],
        "nome_completo":  row[1],
        "cpf":            row[2],
        "email":          row[3],
        "telefone":       row[4],
        "sexo":           row[5],
        "data_nascimento":row[6],
        "peso":           row[7],
        "altura":         row[8],
        "entrada":        row[9],
    }


@app.get("/pacientes", tags=["Pacientes"])
def listar_pacientes(
    busca: Optional[str] = Query(default=None, description="Filtrar por nome ou CPF")
):
    """Lista todos os pacientes. Aceita filtro por nome ou CPF."""
    with conectar() as conn:
        if busca:
            rows = conn.execute(
                "SELECT id_paciente, nome_completo, cpf, email, telefone, sexo, "
                "data_nascimento, peso, altura, entrada FROM pacientes "
                "WHERE nome_completo LIKE ? OR cpf LIKE ? ORDER BY nome_completo",
                (f"%{busca}%", f"%{busca}%")
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id_paciente, nome_completo, cpf, email, telefone, sexo, "
                "data_nascimento, peso, altura, entrada FROM pacientes ORDER BY nome_completo"
            ).fetchall()
    result = rows_to_list(rows)
    for p in result:
        if p.get("peso") and p.get("altura"):
            p["imc"] = round(p["peso"] / p["altura"] ** 2, 2)
    return {"total": len(result), "pacientes": result}


@app.get("/pacientes/{id_paciente}", tags=["Pacientes"])
def detalhe_paciente(id_paciente: int):
    """Retorna dados completos de um paciente incluindo histórico."""
    with conectar() as conn:
        pac = conn.execute(
            "SELECT * FROM pacientes WHERE id_paciente=?", (id_paciente,)
        ).fetchone()
        if not pac:
            raise HTTPException(status_code=404, detail="Paciente não encontrado.")

        agds = conn.execute(
            "SELECT a.data_hora, a.status, pr.nome_especifico, m.nome_medico "
            "FROM agendamentos a "
            "JOIN procedimentos pr ON a.id_procedimento=pr.id_procedimento "
            "JOIN medicos m ON a.id_medico=m.id_medico "
            "WHERE a.id_paciente=? ORDER BY a.data_hora DESC", (id_paciente,)
        ).fetchall()

        orcs = conn.execute(
            "SELECT o.data_criacao, o.valor_total, o.status_orc, pr.nome_especifico "
            "FROM orcamentos o JOIN procedimentos pr ON o.id_procedimento=pr.id_procedimento "
            "WHERE o.id_paciente=? ORDER BY o.data_criacao DESC", (id_paciente,)
        ).fetchall()

        sac = conn.execute(
            "SELECT motivo, status_solucao, prazo_limite, data_abertura "
            "FROM sac WHERE id_paciente=? ORDER BY data_abertura DESC", (id_paciente,)
        ).fetchall()

    p = dict(pac)
    if p.get("peso") and p.get("altura"):
        p["imc"] = round(p["peso"] / p["altura"] ** 2, 2)
    p["agendamentos"]  = rows_to_list(agds)
    p["orcamentos"]    = rows_to_list(orcs)
    p["sac"]           = rows_to_list(sac)
    return p


@app.post("/pacientes", status_code=201, tags=["Pacientes"])
def criar_paciente(dados: PacienteCreate):
    """Cadastra um novo paciente."""
    try:
        with conectar() as conn:
            conn.execute(
                "INSERT INTO pacientes (nome_completo, cpf, email, senha, telefone, sexo, "
                "data_nascimento, peso, altura, entrada) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (dados.nome_completo, dados.cpf, dados.email, dados.senha,
                 dados.telefone, dados.sexo, dados.data_nascimento,
                 dados.peso, dados.altura,
                 datetime.now().strftime("%d/%m/%Y %H:%M"))
            )
        return {"mensagem": "Paciente cadastrado com sucesso."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="CPF ou e-mail já cadastrado.")


@app.delete("/pacientes/{id_paciente}", tags=["Pacientes"])
def remover_paciente(id_paciente: int):
    """Remove um paciente e todos os dados vinculados."""
    with conectar() as conn:
        if not conn.execute("SELECT 1 FROM pacientes WHERE id_paciente=?", (id_paciente,)).fetchone():
            raise HTTPException(status_code=404, detail="Paciente não encontrado.")
        for t in ("historico_eventos","sac","mensagens","pre_cirurgico","agendamentos","orcamentos"):
            conn.execute(f"DELETE FROM {t} WHERE id_paciente=?", (id_paciente,))
        conn.execute("DELETE FROM pacientes WHERE id_paciente=?", (id_paciente,))
    return {"mensagem": "Paciente removido."}


# ══════════════════════════════════════════════════════════════════
#  LEADS
# ══════════════════════════════════════════════════════════════════

@app.get("/leads", tags=["Leads"])
def listar_leads(
    status: Optional[str] = Query(default=None),
    busca:  Optional[str] = Query(default=None, description="Nome ou telefone"),
):
    """Lista leads com filtros opcionais de status e busca."""
    with conectar() as conn:
        base = (
            "SELECT l.id_lead, l.nome, l.email, l.canal_origem, l.telefone, "
            "l.status_lead, l.data_entrada, l.tempo_atendimento, "
            "p.nome_especifico AS procedimento, m.nome_medico AS medico, "
            "c.nome AS operador "
            "FROM leads l "
            "LEFT JOIN procedimentos p ON l.id_procedimento=p.id_procedimento "
            "LEFT JOIN medicos m ON l.id_medico_pref=m.id_medico "
            "LEFT JOIN colaboradores c ON l.id_operador=c.id_colaborador "
        )
        conds, params = [], []
        if status:
            conds.append("l.status_lead=?"); params.append(status)
        if busca:
            conds.append("(l.nome LIKE ? OR l.telefone LIKE ?)")
            params += [f"%{busca}%", f"%{busca}%"]
        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        rows = conn.execute(base + where + " ORDER BY l.data_entrada DESC", params).fetchall()
    return {"total": len(rows), "leads": rows_to_list(rows)}


@app.post("/leads", status_code=201, tags=["Leads"])
def criar_lead(dados: LeadCreate):
    """Cadastra um novo lead."""
    with conectar() as conn:
        conn.execute(
            "INSERT INTO leads (nome, email, canal_origem, telefone, id_procedimento, "
            "id_medico_pref, id_operador, status_lead, data_entrada) VALUES (?,?,?,?,?,?,?,'novo',?)",
            (dados.nome, dados.email, dados.canal_origem, dados.telefone,
             dados.id_procedimento, dados.id_medico_pref, dados.id_operador,
             datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
    return {"mensagem": "Lead cadastrado."}


@app.patch("/leads/{id_lead}/status", tags=["Leads"])
def atualizar_status_lead(id_lead: int, body: LeadStatusUpdate):
    """Atualiza o status de um lead."""
    validos = {"novo","em atendimento","convertido","perdido","reagendado"}
    if body.status_lead not in validos:
        raise HTTPException(status_code=422, detail=f"Status inválido. Use: {validos}")
    with conectar() as conn:
        n = conn.execute(
            "UPDATE leads SET status_lead=? WHERE id_lead=?", (body.status_lead, id_lead)
        ).rowcount
    if not n:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return {"mensagem": "Status atualizado.", "novo_status": body.status_lead}


# ══════════════════════════════════════════════════════════════════
#  AGENDAMENTOS
# ══════════════════════════════════════════════════════════════════

@app.get("/agendamentos", tags=["Agendamentos"])
def listar_agendamentos(
    status: Optional[str] = Query(default=None),
    data:   Optional[str] = Query(default=None, description="Filtrar por data AAAA-MM-DD"),
):
    """Lista agendamentos com filtros opcionais."""
    with conectar() as conn:
        base = (
            "SELECT a.id_agendamento, p.nome_completo AS paciente, m.nome_medico AS medico, "
            "pr.nome_especifico AS procedimento, a.data_hora, a.status, a.origem "
            "FROM agendamentos a "
            "JOIN pacientes p     ON a.id_paciente=p.id_paciente "
            "JOIN medicos m       ON a.id_medico=m.id_medico "
            "JOIN procedimentos pr ON a.id_procedimento=pr.id_procedimento "
        )
        conds, params = [], []
        if status:
            conds.append("a.status=?"); params.append(status)
        if data:
            conds.append("date(a.data_hora)=?"); params.append(data)
        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        rows = conn.execute(base + where + " ORDER BY a.data_hora", params).fetchall()
    return {"total": len(rows), "agendamentos": rows_to_list(rows)}


@app.post("/agendamentos", status_code=201, tags=["Agendamentos"])
def criar_agendamento(dados: AgendamentoCreate):
    """Cria um novo agendamento."""
    try:
        for fmt in ("%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(dados.data_hora, fmt)
                break
            except ValueError:
                dt = None
        if not dt:
            raise HTTPException(status_code=422, detail="Formato de data inválido. Use DD/MM/AAAA HH:MM")
        with conectar() as conn:
            conn.execute(
                "INSERT INTO agendamentos (id_paciente, id_medico, id_procedimento, "
                "data_hora, status, origem) VALUES (?,?,?,?,'agendado',?)",
                (dados.id_paciente, dados.id_medico, dados.id_procedimento,
                 dt.strftime("%Y-%m-%d %H:%M:%S"), dados.origem)
            )
        return {"mensagem": "Agendamento criado."}
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.patch("/agendamentos/{id_agendamento}/status", tags=["Agendamentos"])
def atualizar_status_agendamento(id_agendamento: int, body: AgendamentoStatusUpdate):
    """Atualiza o status de um agendamento."""
    validos = {"agendado","atendido","falta","cancelado","reagendado","abandono"}
    if body.status not in validos:
        raise HTTPException(status_code=422, detail=f"Status inválido. Use: {validos}")
    with conectar() as conn:
        n = conn.execute(
            "UPDATE agendamentos SET status=? WHERE id_agendamento=?",
            (body.status, id_agendamento)
        ).rowcount
    if not n:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    return {"mensagem": "Status atualizado.", "novo_status": body.status}


# ══════════════════════════════════════════════════════════════════
#  MÉDICOS
# ══════════════════════════════════════════════════════════════════

@app.get("/medicos", tags=["Médicos"])
def listar_medicos():
    with conectar() as conn:
        rows = conn.execute("SELECT * FROM medicos ORDER BY nome_medico").fetchall()
    return {"total": len(rows), "medicos": rows_to_list(rows)}


@app.post("/medicos", status_code=201, tags=["Médicos"])
def criar_medico(dados: MedicoCreate):
    try:
        with conectar() as conn:
            conn.execute(
                "INSERT INTO medicos (nome_medico, crm, especialidade, email, telefone, "
                "cpf, data_nascimento, local_hospital) VALUES (?,?,?,?,?,?,?,?)",
                (dados.nome_medico, dados.crm, dados.especialidade, dados.email,
                 dados.telefone, dados.cpf, dados.data_nascimento, dados.local_hospital)
            )
        return {"mensagem": "Médico cadastrado."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="CRM ou CPF já cadastrado.")


@app.delete("/medicos/{id_medico}", tags=["Médicos"])
def remover_medico(id_medico: int):
    with conectar() as conn:
        n = conn.execute("DELETE FROM medicos WHERE id_medico=?", (id_medico,)).rowcount
    if not n:
        raise HTTPException(status_code=404, detail="Médico não encontrado.")
    return {"mensagem": "Médico removido."}


# ══════════════════════════════════════════════════════════════════
#  PROCEDIMENTOS
# ══════════════════════════════════════════════════════════════════

@app.get("/procedimentos", tags=["Procedimentos"])
def listar_procedimentos():
    with conectar() as conn:
        rows = conn.execute("SELECT * FROM procedimentos ORDER BY categoria, nome_especifico").fetchall()
    return {"total": len(rows), "procedimentos": rows_to_list(rows)}


@app.post("/procedimentos", status_code=201, tags=["Procedimentos"])
def criar_procedimento(dados: ProcedimentoCreate):
    with conectar() as conn:
        conn.execute(
            "INSERT INTO procedimentos (categoria, nome_especifico, tipo_especialista, "
            "descricao_complexidade, valor_base) VALUES (?,?,?,?,?)",
            (dados.categoria, dados.nome_especifico, dados.tipo_especialista,
             dados.descricao_complexidade, dados.valor_base)
        )
    return {"mensagem": "Procedimento cadastrado."}


@app.delete("/procedimentos/{id_procedimento}", tags=["Procedimentos"])
def remover_procedimento(id_procedimento: int):
    with conectar() as conn:
        n = conn.execute(
            "DELETE FROM procedimentos WHERE id_procedimento=?", (id_procedimento,)
        ).rowcount
    if not n:
        raise HTTPException(status_code=404, detail="Procedimento não encontrado.")
    return {"mensagem": "Procedimento removido."}


# ══════════════════════════════════════════════════════════════════
#  ORÇAMENTOS
# ══════════════════════════════════════════════════════════════════

@app.get("/orcamentos", tags=["Orçamentos"])
def listar_orcamentos(status: Optional[str] = Query(default=None)):
    with conectar() as conn:
        base = (
            "SELECT o.id_orcamento, p.nome_completo AS paciente, m.nome_medico AS medico, "
            "pr.nome_especifico AS procedimento, o.valor_total, o.status_orc, "
            "o.motivo_perda, o.data_criacao "
            "FROM orcamentos o "
            "JOIN pacientes p ON o.id_paciente=p.id_paciente "
            "JOIN medicos m ON o.id_medico=m.id_medico "
            "JOIN procedimentos pr ON o.id_procedimento=pr.id_procedimento "
        )
        if status:
            rows = conn.execute(base + "WHERE o.status_orc=? ORDER BY o.data_criacao DESC", (status,)).fetchall()
        else:
            rows = conn.execute(base + "ORDER BY o.data_criacao DESC").fetchall()
    return {"total": len(rows), "orcamentos": rows_to_list(rows)}


@app.post("/orcamentos", status_code=201, tags=["Orçamentos"])
def criar_orcamento(dados: OrcamentoCreate):
    with conectar() as conn:
        conn.execute(
            "INSERT INTO orcamentos (id_paciente, id_medico, id_procedimento, valor_total, status_orc) "
            "VALUES (?,?,?,?,'aberto')",
            (dados.id_paciente, dados.id_medico, dados.id_procedimento, dados.valor_total)
        )
    return {"mensagem": "Orçamento criado."}


# ══════════════════════════════════════════════════════════════════
#  SAC
# ══════════════════════════════════════════════════════════════════

@app.get("/sac", tags=["SAC"])
def listar_sac(status: Optional[str] = Query(default=None)):
    with conectar() as conn:
        base = (
            "SELECT s.id_sac, p.nome_completo AS paciente, s.motivo, "
            "s.status_solucao, s.prazo_limite, s.data_abertura "
            "FROM sac s JOIN pacientes p ON s.id_paciente=p.id_paciente "
        )
        if status:
            rows = conn.execute(base + "WHERE s.status_solucao=? ORDER BY s.data_abertura DESC", (status,)).fetchall()
        else:
            rows = conn.execute(base + "ORDER BY s.data_abertura DESC").fetchall()
    result = rows_to_list(rows)
    # Adiciona flag de prazo vencido
    agora = datetime.now()
    for s in result:
        try:
            prazo = datetime.strptime(s["prazo_limite"], "%Y-%m-%d %H:%M:%S")
            s["prazo_vencido"] = prazo < agora and s["status_solucao"] != "resolvido"
        except Exception:
            s["prazo_vencido"] = False
    return {"total": len(result), "sac": result}


@app.post("/sac", status_code=201, tags=["SAC"])
def criar_sac(dados: SacCreate):
    from datetime import timedelta
    prazo = (datetime.now() + timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
    with conectar() as conn:
        conn.execute(
            "INSERT INTO sac (id_paciente, motivo, prazo_limite, status_solucao) VALUES (?,?,?,'pendente')",
            (dados.id_paciente, dados.motivo, prazo)
        )
    return {"mensagem": "SAC aberto.", "prazo_limite": prazo}


@app.patch("/orcamentos/{id_orcamento}/status", tags=["Orçamentos"])
def atualizar_status_orcamento(id_orcamento: int, body: dict):
    """Atualiza o status de um orçamento."""
    validos = {"aberto", "em andamento", "fechado", "encerrado"}
    status = body.get("status_orc")
    if status not in validos:
        raise HTTPException(status_code=422, detail=f"Status inválido. Use: {validos}")
    motivo = body.get("motivo_perda")
    if status == "encerrado" and not motivo:
        raise HTTPException(status_code=422, detail="Motivo é obrigatório para encerramento.")
    with conectar() as conn:
        n = conn.execute(
            "UPDATE orcamentos SET status_orc=?, motivo_perda=? WHERE id_orcamento=?",
            (status, motivo, id_orcamento)
        ).rowcount
    if not n:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
    return {"mensagem": "Status atualizado.", "novo_status": status}


@app.get("/pre-cirurgico", tags=["Pré-Cirúrgico"])
def listar_pre_cirurgico():
    """Lista todos os checklists pré-cirúrgicos."""
    with conectar() as conn:
        rows = conn.execute(
            "SELECT pc.id_pre, pc.id_paciente, pc.status_imc, pc.exames_completos, "
            "pc.checklist_ok, pc.autorizacao_med, p.nome_completo "
            "FROM pre_cirurgico pc JOIN pacientes p ON pc.id_paciente=p.id_paciente "
            "ORDER BY pc.id_paciente"
        ).fetchall()
    return {"total": len(rows), "checklists": rows_to_list(rows)}


@app.post("/pre-cirurgico", status_code=201, tags=["Pré-Cirúrgico"])
def criar_pre_cirurgico(body: dict):
    """Cria ou atualiza checklist pré-cirúrgico de um paciente."""
    id_pac = body.get("id_paciente")
    if not id_pac:
        raise HTTPException(status_code=422, detail="id_paciente é obrigatório.")
    with conectar() as conn:
        conn.execute(
            "INSERT INTO pre_cirurgico (id_paciente, status_imc, exames_completos, "
            "checklist_ok, autorizacao_med) VALUES (?,?,?,?,?)",
            (id_pac, body.get("status_imc", 0), body.get("exames_completos", 0),
             body.get("checklist_ok", 0), body.get("autorizacao_med", 0))
        )
    return {"mensagem": "Checklist salvo."}


# ══════════════════════════════════════════════════════════════════
#  COLABORADORES
# ══════════════════════════════════════════════════════════════════

@app.get("/colaboradores", tags=["Colaboradores"])
def listar_colaboradores():
    with conectar() as conn:
        rows = conn.execute(
            "SELECT id_colaborador, nome, funcao, status_login, ultimo_login "
            "FROM colaboradores ORDER BY nome"
        ).fetchall()
    return {"total": len(rows), "colaboradores": rows_to_list(rows)}
