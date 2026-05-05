// src/components/TabelaPacientes.jsx
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, X, User, Phone, Mail, Calendar, Activity } from "lucide-react";
import { getPacientes, getPaciente } from "../api";

// ── Modal de detalhes ─────────────────────────────────────────────
function ModalPaciente({ id, onClose }) {
  const [pac, setPac]         = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaciente(id)
      .then(({ data }) => setPac(data))
      .catch(() => setPac(null))
      .finally(() => setLoading(false));
  }, [id]);

  const STATUS_AGD = {
    agendado:   "bg-blue-500/20 text-blue-400",
    atendido:   "bg-emerald-500/20 text-emerald-400",
    falta:      "bg-red-500/20 text-red-400",
    cancelado:  "bg-gray-700 text-gray-400",
    reagendado: "bg-yellow-500/20 text-yellow-400",
    abandono:   "bg-gray-700 text-gray-500",
  };

  const STATUS_ORC = {
    aberto:         "bg-blue-500/20 text-blue-400",
    "em andamento": "bg-yellow-500/20 text-yellow-400",
    fechado:        "bg-emerald-500/20 text-emerald-400",
    encerrado:      "bg-red-500/20 text-red-400",
  };

  // Calcula IMC com segurança
  const calcIMC = (peso, altura) => {
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    if (!p || !a || a === 0) return null;
    return (p / (a * a)).toFixed(2);
  };

  const classeIMC = (imc) => {
    const v = parseFloat(imc);
    if (!v) return null;
    if (v < 18.5) return { label: "Abaixo do peso", cor: "text-blue-400" };
    if (v < 25)   return { label: "Normal",          cor: "text-emerald-400" };
    if (v < 30)   return { label: "Sobrepeso",       cor: "text-yellow-400" };
    return              { label: "Obesidade",         cor: "text-red-400" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3 rounded-t-2xl z-10">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <User size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="h-4 w-40 bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="font-bold text-white">{pac?.nome_completo || "–"}</p>
                <p className="text-xs text-gray-500">CPF: {pac?.cpf || "–"}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : !pac ? (
          <p className="text-gray-500 text-sm text-center py-12">Erro ao carregar dados.</p>
        ) : (
          <div className="p-6 space-y-6">

            {/* Dados pessoais */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail,     label: "E-mail",    value: pac.email             || "–" },
                  { icon: Phone,    label: "Telefone",   value: pac.telefone          || "–" },
                  { icon: Calendar, label: "Nascimento", value: pac.data_nascimento   || "–" },
                  { icon: User,     label: "Sexo",       value: pac.sexo              || "–" },
                  { icon: Activity, label: "Peso",       value: pac.peso   ? `${pac.peso} kg`   : "–" },
                  { icon: Activity, label: "Altura",     value: pac.altura ? `${pac.altura} m`   : "–" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                    <Icon size={14} className="text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm text-white font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* IMC calculado corretamente */}
              {(() => {
                const imc = calcIMC(pac.peso, pac.altura);
                const cls = classeIMC(imc);
                if (!imc) return null;
                return (
                  <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-400">IMC</span>
                      {cls && <span className={`ml-2 text-xs ${cls.cor}`}>{cls.label}</span>}
                    </div>
                    <span className="text-lg font-bold text-emerald-400">{imc}</span>
                  </div>
                );
              })()}
            </section>

            {/* Agendamentos */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Agendamentos ({pac.agendamentos?.length || 0})
              </h3>
              {!pac.agendamentos?.length ? (
                <p className="text-gray-600 text-sm">Nenhum agendamento.</p>
              ) : (
                <div className="space-y-2">
                  {pac.agendamentos.map((a, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-white font-medium">{a.nome_especifico}</p>
                        <p className="text-xs text-gray-500">{a.nome_medico}  •  {a.data_hora}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${STATUS_AGD[a.status] || "bg-gray-700 text-gray-400"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Orçamentos */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Orçamentos ({pac.orcamentos?.length || 0})
              </h3>
              {!pac.orcamentos?.length ? (
                <p className="text-gray-600 text-sm">Nenhum orçamento.</p>
              ) : (
                <div className="space-y-2">
                  {pac.orcamentos.map((o, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-white font-medium">{o.nome_especifico}</p>
                        <p className="text-xs text-gray-500">{o.data_criacao}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">
                          R$ {Number(o.valor_total).toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_ORC[o.status_orc] || "bg-gray-700 text-gray-400"}`}>
                          {o.status_orc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SAC */}
            {pac.sac?.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  SAC ({pac.sac.length})
                </h3>
                <div className="space-y-2">
                  {pac.sac.map((s, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-sm text-white">{s.motivo}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.status_solucao}  •  {s.data_abertura}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="text-xs text-gray-600 text-center pt-2 border-t border-gray-800">
              Cadastrado em: {pac.entrada}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Tabela principal ──────────────────────────────────────────────
export default function TabelaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [busca, setBusca]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [modalId, setModalId]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPacientes(busca);
      setPacientes(data.pacientes || []);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(fetch, 400);
    return () => clearTimeout(t);
  }, [fetch]);

  // Calcula IMC com segurança
  const calcIMC = (peso, altura) => {
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    if (!p || !a || a === 0) return null;
    return (p / (a * a)).toFixed(2);
  };

  const imcColor = (imc) => {
    const v = parseFloat(imc);
    if (!v) return "";
    if (v < 18.5) return "bg-blue-500/20 text-blue-400";
    if (v < 25)   return "bg-emerald-500/20 text-emerald-400";
    if (v < 30)   return "bg-yellow-500/20 text-yellow-400";
    return               "bg-red-500/20 text-red-400";
  };

  const sexoLabel = (s) => ({ M: "Masculino", F: "Feminino", O: "Outro" }[s] || "–");

  return (
    <>
      {modalId && (
        <ModalPaciente id={modalId} onClose={() => setModalId(null)} />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-gray-300 flex-1">
            Pacientes
            <span className="ml-2 text-gray-600 font-normal">({pacientes.length})</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Nome ou CPF..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 w-52"
            />
          </div>
          <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-12">
            <User size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {["#","Nome","CPF","E-mail","Telefone","Sexo","IMC","Entrada",""].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {pacientes.map(p => {
                  const imc = calcIMC(p.peso, p.altura);
                  return (
                    <tr key={p.id_paciente} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 text-gray-600 text-xs">{p.id_paciente}</td>
                      <td className="py-3 pr-4 font-medium text-white">{p.nome_completo}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs font-mono">{p.cpf}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{p.email}</td>
                      <td className="py-3 pr-4 text-gray-400">{p.telefone || "–"}</td>
                      <td className="py-3 pr-4 text-gray-400">{sexoLabel(p.sexo)}</td>
                      <td className="py-3 pr-4">
                        {imc ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${imcColor(imc)}`}>
                            {imc}
                          </span>
                        ) : "–"}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{p.entrada}</td>
                      <td className="py-3">
                        <button
                          onClick={() => setModalId(p.id_paciente)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
                        >
                          Ver detalhes →
                        </button>
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
