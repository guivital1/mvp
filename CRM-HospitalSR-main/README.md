# 🏥 Hospital São Rafael — Sistema de Gestão Hospitalar

> **FIAP – Engenharia de Software | 2º Ano | Challenge 2025**
> Métodos Ágeis com Scrum · Data Science · Programação Dinâmica · Grafos

---

## 📋 Descrição do Projeto

Sistema integrado de gestão hospitalar desenvolvido para o Hospital São Rafael, cobrindo desde o gerenciamento interno via terminal Python até um dashboard React moderno e um portal público de captação de leads.

O projeto foi construído em **4 Sprints** seguindo metodologia Scrum, incorporando conceitos avançados de:

- **Programação Dinâmica** — recursão, memoização e backtracking
- **Data Science** — modelo preditivo de conversão de leads
- **Grafos e Dijkstra** — otimização do fluxo CRM
- **API REST** — integração entre backend e frontend
- **Dashboard React** — visualização em tempo real

---

## 🗂️ Estrutura do Projeto

```
CRM-HospitalSR-main/
├── hospital.py              # Sistema interno (terminal) — colaboradores
├── paciente.py              # Portal do paciente (terminal)
├── db.py                    # Banco de dados e utilitários compartilhados
├── exceptions.py            # Exceções personalizadas
├── api.py                   # API REST com FastAPI
├── hospital.db              # Banco de dados SQLite
├── sprint4_datascience.py   # Data Science — modelo preditivo
├── sprint4_grafos.py        # Grafos e algoritmo de Dijkstra
└── dashboard/               # Frontend React
    └── src/
        ├── App.jsx                        # Dashboard interno
        ├── ChatbotLead.jsx                # Chatbot público (/lead)
        ├── PortalPaciente.jsx             # Portal do paciente (/paciente)
        ├── api.js                         # Cliente HTTP
        └── components/
            ├── KpiCard.jsx
            ├── FunilLeads.jsx
            ├── LeadsCanal.jsx
            ├── AgendamentosChart.jsx
            ├── TabelaLeads.jsx
            ├── TabelaAgendamentos.jsx
            ├── TabelaPacientes.jsx
            ├── TabelaMedicos.jsx
            ├── TabelaProcedimentos.jsx
            ├── TabelaOrcamentos.jsx
            ├── PreCirurgico.jsx
            └── AlertasSac.jsx
```

---

## 🚀 Como Executar

### Pré-requisitos

```bash
pip install fastapi uvicorn pandas numpy matplotlib seaborn scikit-learn
npm install  # dentro da pasta dashboard/
```

### 1. Sistema Terminal (Python)

```bash
# Portal do colaborador/hospital
python hospital.py

# Portal do paciente
python paciente.py
```

### 2. API REST

```bash
# Na pasta raiz do projeto
uvicorn api:app --reload --port 8000

# Documentação automática disponível em:
# http://localhost:8000/docs
```

### 3. Dashboard React

```bash
cd dashboard
npm run dev

# Acesse:
# http://localhost:5174/           → Dashboard interno
# http://localhost:5174/lead       → Chatbot público de captação
# http://localhost:5174/paciente   → Portal do paciente
```

### 4. Data Science e Grafos

```bash
python sprint4_datascience.py   # Modelo preditivo + gráficos
python sprint4_grafos.py        # Grafo CRM + Dijkstra
```

---

## ✅ Funcionalidades por Módulo

### 🖥️ hospital.py — Sistema Interno (Terminal)

| Módulo | Funcionalidades |
|---|---|
| Médicos | Cadastrar, listar, remover |
| Procedimentos | Cadastrar, listar, remover |
| Colaboradores | Cadastrar, listar, login, logout |
| Pacientes | Cadastrar, buscar, listar, remover |
| Leads (CRM) | Listar, buscar, cadastrar, atualizar status |
| Agendamentos | Novo, listar, atualizar status |
| Orçamentos | Novo, listar, atualizar status |
| SAC | Abrir, listar, atualizar |
| Pré-cirúrgico | Checklist, listar |
| Histórico | Linha do tempo completa do paciente |
| Relatórios | KPIs, funil, taxa de conversão, exportação CSV |
| [DP] | Dynamic Programming — recursão, memoização, otimização |
| [DS] | Data Science — análise exploratória e KPIs |

### 👤 paciente.py — Portal do Paciente (Terminal)

- Login e cadastro com validações
- Visualizar e editar dados pessoais (telefone, peso, altura, senha)
- Cálculo automático de IMC
- Solicitar e cancelar agendamentos
- Consultar orçamentos
- Abrir e acompanhar SAC
- Ver mensagens recebidas
- Checklist pré-cirúrgico

### 🌐 API REST (FastAPI)

**25+ endpoints** organizados por domínio:

| Rota | Descrição |
|---|---|
| `GET /dashboard/kpis` | Todos os KPIs em uma chamada |
| `GET /dashboard/funil` | Funil de leads por status |
| `GET /dashboard/leads-por-canal` | Leads agrupados por canal |
| `GET /dashboard/agendamentos-por-dia` | Volume diário de agendamentos |
| `GET/POST /pacientes` | Listar e cadastrar pacientes |
| `POST /pacientes/login` | Autenticação do paciente |
| `PATCH /pacientes/{id}` | Atualizar dados do paciente |
| `GET/POST /leads` | Listar e cadastrar leads |
| `PATCH /leads/{id}/status` | Atualizar status do lead |
| `GET/POST /agendamentos` | Listar e criar agendamentos |
| `GET/POST /medicos` | Listar e cadastrar médicos |
| `GET/POST /procedimentos` | Listar e cadastrar procedimentos |
| `GET/POST /orcamentos` | Listar e criar orçamentos |
| `PATCH /orcamentos/{id}/status` | Atualizar status do orçamento |
| `GET/POST /sac` | Listar e abrir SAC |
| `GET/POST /pre-cirurgico` | Checklist pré-cirúrgico |

### 📊 Dashboard React (Vite + Tailwind + Recharts)

**9 abas completas:**

- **Visão Geral** — 8 KPI cards com animação, funil de leads, pizza de canais, gráfico de agendamentos por dia, alertas de SAC. Auto-refresh a cada 60 segundos.
- **Pacientes** — Tabela com busca, IMC colorido, modal de histórico completo (agendamentos, orçamentos, SAC)
- **Médicos** — Cards com estatísticas, taxa de presença, taxa de conversão, próximos agendamentos. Cadastrar e remover.
- **Procedimentos** — Cards agrupados por categoria com cadastro e remoção
- **Leads** — Tabela com busca, filtros, modal de detalhes, atualização de status e conversão em paciente
- **Agendamentos** — Gráfico de área + tabela com filtro de data/status e criação de novo agendamento
- **Orçamentos** — KPIs de receita, listagem com status colorido, novo orçamento e atualização de status
- **Pré-Cirúrgico** — Checklist por paciente com modal de checklist e histórico completo
- **SAC / Alertas** — Alertas vencidos em destaque vermelho pulsando, filtros por status

### 🤖 Chatbot de Captação (/lead)

Página pública compartilhável em redes sociais com fluxo de 6 telas:

1. Canal de origem (Instagram, Google, Facebook, TikTok, Indicação, Site)
2. Seleção de procedimento com cards e valores
3. Preferência de médico (opcional)
4. Chat interativo coletando nome, e-mail e WhatsApp
5. Confirmação dos dados
6. Tela de sucesso — lead salvo automaticamente no dashboard

### 🏥 Portal do Paciente (/paciente)

Portal visual completo com navegação por abas:

- **Início** — Dados pessoais, IMC com classificação visual, edição de perfil
- **Agendamentos** — Solicitar, visualizar e cancelar consultas
- **Orçamentos** — Consultar valores e status
- **SAC** — Abrir reclamações e acompanhar protocolos
- **Pré-Cirúrgico** — Ver status de aptidão e informar exames via checklist interativo
- **Histórico** — Linha do tempo de todos os eventos

---

## 🧠 Sprint 2 — Programação Dinâmica

### 1. Verificação Recursiva de Duplicidade
```python
def verificar_duplicidade_recursivo(novo, cadastros, i=0)
```
- Percorre recursivamente verificando CPF e nome
- Complexidade: **O(n)**

### 2. Memoização (Cache de Comparações)
```python
def comparar_com_cache(cpf_a, cpf_b)
def verificar_com_memoizacao(novo, base)
```
- Cache com chave ordenada: `(a,b) == (b,a)`
- Evita recalcular comparações já realizadas
- Também implementado com `@lru_cache`

### 3. Otimização de Agenda Médica
```python
def calcular_melhor_agenda(dur, slots, i=0, atual=None, melhor=None)
```
- Backtracking recursivo
- Maximiza consultas sem sobreposição de horários
- Integrado com dados reais da `grade_agenda`

---

## 📈 Sprint 3 — Data Science

### Pergunta de negócio respondida:
> *"Um lead irá se tornar paciente (status = convertido)?"*

### Etapas implementadas:

**1. Preparação dos dados**
- Dataset com 300 leads sintéticos com distribuição realista
- LabelEncoder para variáveis categóricas
- StandardScaler para normalização
- Divisão treino/teste 75%/25% com estratificação

**2. Modelos preditivos**
- Regressão Logística
- Random Forest (100 árvores)

**3. Avaliação**
- Acurácia, Precisão, Recall, F1-Score
- Matriz de Confusão
- Importância das features (Random Forest)

**4. Recomendações estratégicas**
- Priorização de canais (Indicação: 52% de conversão)
- Fluxo de nutrição por procedimento
- Régua de follow-up automatizado
- Integração do modelo ao CRM

**Gráficos gerados:**
- `sprint4_avaliacao_modelos.png`
- `sprint4_feature_importance.png`
- `sprint4_insights.png`

---

## 🔗 Sprint 3 — Grafos e Dijkstra

### Modelagem do CRM como Grafo Direcionado Ponderado

**7 nós** representando etapas do processo:
```
Lead Novo → Em Atendimento → Orçamento → Negociação → Agendamento → Pré-Cirúrgico → Confirmação
```

**Pesos** = custo em horas de cada transição

### Resultado do Dijkstra:
```
Menor caminho: Lead Novo → Em Atendimento → Agendamento → Confirmação
Custo total  : 11 horas
Economia     : 76% mais rápido que o caminho mais longo (46h)
```

**Gráfico gerado:** `sprint4_grafo_dijkstra.png`

---

## 🗄️ Banco de Dados

SQLite com **12 tabelas relacionais:**

| Tabela | Descrição |
|---|---|
| `pacientes` | Cadastro com CPF, e-mail, IMC |
| `medicos` | CRM, especialidade, contato |
| `colaboradores` | Login e status de acesso |
| `procedimentos` | Catálogo com valores |
| `leads` | Funil CRM com status e canal |
| `agendamentos` | Consultas com status |
| `grade_agenda` | Horários disponíveis por médico |
| `orcamentos` | Valores e status de negociação |
| `sac` | Reclamações com prazo |
| `mensagens` | Histórico de comunicação |
| `pre_cirurgico` | Checklist de aptidão |
| `historico_eventos` | Log de eventos do paciente |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| Python 3.10+ | Backend, terminal, DP e DS |
| SQLite | Banco de dados relacional |
| FastAPI | API REST com documentação automática |
| Uvicorn | Servidor ASGI |
| React 18 + Vite | Dashboard e portais |
| Tailwind CSS v3 | Estilização |
| Recharts | Gráficos interativos |
| Axios | Cliente HTTP |
| Lucide React | Ícones |
| scikit-learn | Modelos de machine learning |
| pandas | Manipulação de dados |
| matplotlib / seaborn | Visualizações |
| numpy | Computação numérica |

---

## 💡 Diferenciais do Projeto

- Sistema completo **end-to-end**: terminal → API → dashboard → portais públicos
- **3 interfaces** integradas ao mesmo banco: hospital, paciente e captação de leads
- **Chatbot de captação** compartilhável em redes sociais com fluxo guiado
- **Conversão de lead em paciente** direto pelo dashboard
- **Modelo preditivo** com recomendações estratégicas reais
- **Dijkstra aplicado** a um problema de negócio real (fluxo CRM)
- **Auto-refresh** de 60s no dashboard com alertas em tempo real
- **Checklist pré-cirúrgico** integrado entre hospital e paciente

---

## 👥 Autores

| Nome | GitHub |
|---|---|
| Belton Lee 
| Erik Kaiyu 
| Guilherme Vital 
| Kayque Carvalho 
| Lucas Guerreiro 

---

 FIAP – Engenharia de Software · 2º Ano · 2025
