// src/api.js – Cliente HTTP para a API do Hospital São Rafael

import axios from "axios";

const BASE_URL = "http://localhost:8000";

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

// ── Dashboard ──────────────────────────────────────────────────
export const getKpis                       = () => http.get("/dashboard/kpis");
export const getFunil                      = () => http.get("/dashboard/funil");
export const getLeadsPorCanal              = () => http.get("/dashboard/leads-por-canal");
export const getProcedimentosMaisAgendados = (limit = 6) => http.get(`/dashboard/procedimentos-mais-agendados?limit=${limit}`);
export const getAgendamentosPorDia         = (dias = 30) => http.get(`/dashboard/agendamentos-por-dia?dias=${dias}`);
export const getMedicosMaisProcurados      = () => http.get("/dashboard/medicos-mais-procurados");

// ── Leads ──────────────────────────────────────────────────────
export const getLeads            = (params = {}) => http.get("/leads", { params });
export const criarLead           = (dados)       => http.post("/leads", dados);
export const atualizarStatusLead = (id, status)  => http.patch(`/leads/${id}/status`, { status_lead: status });

// ── Agendamentos ───────────────────────────────────────────────
export const getAgendamentos            = (params = {}) => http.get("/agendamentos", { params });
export const atualizarStatusAgendamento = (id, status)  => http.patch(`/agendamentos/${id}/status`, { status });

// ── Pacientes ──────────────────────────────────────────────────
export const getPacientes  = (busca = "") => http.get("/pacientes", { params: busca ? { busca } : {} });
export const getPaciente   = (id)         => http.get(`/pacientes/${id}`);
export const criarPaciente = (dados)      => http.post("/pacientes", dados);

// ── SAC ────────────────────────────────────────────────────────
export const getSac = (status = "") => http.get("/sac", { params: status ? { status } : {} });

// ── Médicos ────────────────────────────────────────────────────
export const getMedicos = () => http.get("/medicos");

// ── Procedimentos ──────────────────────────────────────────────
export const getProcedimentos    = ()       => http.get("/procedimentos");
export const criarProcedimento   = (dados)  => http.post("/procedimentos", dados);
export const removerProcedimento = (id)     => http.delete(`/procedimentos/${id}`);
