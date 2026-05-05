// src/components/TabelaProcedimentos.jsx
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, X, Plus, Trash2, Tag, DollarSign, Layers } from "lucide-react";
import { getProcedimentos, criarProcedimento, removerProcedimento } from "../api";

const CATEGORIAS = [
  "Aparelho Digestivo", "Cirurgia Plástica", "Dermatologia",
  "Ginecologia", "Nutricionista", "Ortopedia", "Otorrinologia", "Reprodução Assistida", "Urologia", "Vascular"
];

const CAT_CORES = {
  "Aparelho Digestivo": "bg-blue-500/20 text-blue-400 border-blue -500/30",
  "Cirurgia Plástica": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Dermatologia":      "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Ginecologia":       "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Nutricionista":     "bg-green-500/20 text-green-400 border-green-500/30",
  "Cirurgia Geral":    "bg-orange-500/20 text-orange-400 border-orange-500/3₀",
  "Ortopedia":        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Otorrinologia":    "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Reprodução Assistida": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Urologia":         "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Vascular":         "bg-lime-500/20 text-lime-400 border-lime-500/30",
};

// ── Modal Cadastrar ───────────────────────────────────────────────
function ModalCadastrar({ onClose, onSalvo }) {
  const [form, setForm] = useState({
    categoria: "", nome_especifico: "",
    tipo_especialista: "", descricao_complexidade: "", valor_base: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.categoria || !form.nome_especifico) {
      setErro("Categoria e nome são obrigatórios.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await criarProcedimento({
        ...form,
        valor_base: form.valor_base ? parseFloat(form.valor_base) : null,
      });
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao cadastrar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <Plus size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Novo Procedimento</p>
            <p className="text-xs text-gray-500">Preencha os dados do procedimento</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoria *</label>
            <select
              value={form.categoria}
              onChange={e => set("categoria", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Selecione...</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome específico *</label>
            <input
              value={form.nome_especifico}
              onChange={e => set("nome_especifico", e.target.value)}
              placeholder="ex: Rinoplastia, Botox, Lipoaspiração..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de Especialista</label>
              <input
                value={form.tipo_especialista}
                onChange={e => set("tipo_especialista", e.target.value)}
                placeholder="ex: Cirurgião Plástico"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor base (R$)</label>
              <input
                value={form.valor_base}
                onChange={e => set("valor_base", e.target.value)}
                placeholder="ex: 8500.00"
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição / Complexidade</label>
            <textarea
              value={form.descricao_complexidade}
              onChange={e => set("descricao_complexidade", e.target.value)}
              placeholder="Descreva o procedimento, tempo de recuperação, complexidade..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              {salvando ? "Salvando..." : "Cadastrar Procedimento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Remover ─────────────────────────────────────────────────
function ModalRemover({ proc, onClose, onRemovido }) {
  const [removendo, setRem] = useState(false);
  const [erro, setErro]     = useState("");

  const remover = async () => {
    setRem(true);
    try {
      await removerProcedimento(proc.id_procedimento);
      onRemovido(proc.id_procedimento);
      onClose();
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao remover. Verifique se há agendamentos vinculados.");
      setRem(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="font-bold text-white text-lg mb-2">Remover Procedimento</h3>
        <p className="text-gray-400 text-sm mb-1">Tem certeza que deseja remover:</p>
        <p className="text-white font-semibold mb-1">{proc.nome_especifico}</p>
        <p className="text-gray-600 text-xs mb-6">Esta ação não pode ser desfeita.</p>
        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
            {erro}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={remover}
            disabled={removendo}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {removendo ? "Removendo..." : "Sim, remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function TabelaProcedimentos() {
  const [procs, setProcs]         = useState([]);
  const [busca, setBusca]         = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [loading, setLoading]     = useState(true);
  const [modalCad, setModalCad]   = useState(false);
  const [procRem, setProcRem]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProcedimentos();
      setProcs(data.procedimentos || []);
    } catch {
      setProcs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const categorias = [...new Set(procs.map(p => p.categoria).filter(Boolean))];
  const filtrados  = procs.filter(p =>
    (!busca || p.nome_especifico.toLowerCase().includes(busca.toLowerCase())) &&
    (!catFiltro || p.categoria === catFiltro)
  );

  return (
    <>
      {modalCad && (
        <ModalCadastrar onClose={() => setModalCad(false)} onSalvo={fetch} />
      )}
      {procRem && (
        <ModalRemover
          proc={procRem}
          onClose={() => setProcRem(null)}
          onRemovido={id => setProcs(prev => prev.filter(p => p.id_procedimento !== id))}
        />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Procedimentos <span className="ml-2 text-gray-600 font-normal">({filtrados.length})</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar procedimento..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 w-52"
            />
          </div>
          <select
            value={catFiltro}
            onChange={e => setCatFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setModalCad(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus size={15} /> Novo Procedimento
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-36 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum procedimento encontrado.</p>
            <button
              onClick={() => setModalCad(true)}
              className="mt-4 text-emerald-400 text-sm hover:underline"
            >
              + Cadastrar primeiro procedimento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(p => {
              const corCat = CAT_CORES[p.categoria] || "bg-gray-700 text-gray-400 border-gray-600";
              return (
                <div
                  key={p.id_procedimento}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${corCat}`}>
                      {p.categoria || "Sem categoria"}
                    </span>
                    <button
                      onClick={() => setProcRem(p)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{p.nome_especifico}</h3>
                  {p.tipo_especialista && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Tag size={11} />{p.tipo_especialista}
                    </div>
                  )}
                  {p.descricao_complexidade && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{p.descricao_complexidade}</p>
                  )}
                  <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} className="text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">
                        {p.valor_base
                          ? `R$ ${Number(p.valor_base).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "A consultar"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">#{p.id_procedimento}</span>
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
