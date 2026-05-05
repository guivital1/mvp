"""
sprint4_grafos.py – Sprint 4 | Grafos e Dijkstra no CRM
Hospital São Rafael | Challenge FIAP – Engenharia de Software 2º Ano

Objetivo: Modelar o fluxo do CRM como um grafo direcionado e encontrar
o menor caminho entre etapas do processo usando o algoritmo de Dijkstra.

Tarefas:
  1 – Representar o fluxo do CRM como grafo direcionado         (2,5)
  2 – Implementar o algoritmo de Dijkstra: Lead → Confirmação   (2,5)
  3 – Interpretar o resultado: menor caminho, custo e eficiência (2,5)

Execute:
    python3 sprint4_grafos.py

Dependências:
    pip install matplotlib
"""

import heapq
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ══════════════════════════════════════════════════════════════════
#  UTILIDADES
# ══════════════════════════════════════════════════════════════════

def sep(titulo=""):
    print(f"\n{'═'*60}")
    if titulo:
        print(f"  {titulo}")
        print(f"{'═'*60}")


# ══════════════════════════════════════════════════════════════════
#  TAREFA 1 – REPRESENTAÇÃO DO GRAFO DO CRM
# ══════════════════════════════════════════════════════════════════
#
#  O fluxo do CRM é representado como um GRAFO DIRECIONADO
#  PONDERADO onde:
#    • Nós  = etapas do processo CRM
#    • Arestas = transições entre etapas
#    • Peso  = custo em horas (tempo médio de permanência/transição)
#
#  Nós do grafo:
#    0  LEAD_NOVO          – Lead cadastrado no sistema
#    1  EM_ATENDIMENTO     – Operador iniciou contato
#    2  ORCAMENTO_ENVIADO  – Orçamento enviado ao lead
#    3  NEGOCIACAO         – Negociação de valores/condições
#    4  AGENDAMENTO        – Consulta agendada
#    5  PRE_CIRURGICO      – Checklist pré-cirúrgico realizado
#    6  CONFIRMACAO        – Cirurgia confirmada (paciente convertido)
#
#  Caminhos alternativos (com diferentes custos):
#    • Caminho rápido (Indicação): Lead → Atendimento → Agendamento → Confirmação
#    • Caminho padrão: Lead → Atendimento → Orçamento → Negociação → Agendamento → Confirmação
#    • Caminho completo: idem + Pré-cirúrgico antes da Confirmação
# ══════════════════════════════════════════════════════════════════

# Mapeamento de nós
NOS = {
    0: "Lead Novo",
    1: "Em Atendimento",
    2: "Orçamento Enviado",
    3: "Negociação",
    4: "Agendamento",
    5: "Pré-Cirúrgico",
    6: "Confirmação",
}

# Grafo como lista de adjacências: {no: [(vizinho, peso), ...]}
# Peso = custo em horas (tempo médio da transição)
GRAFO = {
    0: [(1, 2)],                     # Lead Novo → Em Atendimento (2h)
    1: [(2, 4), (4, 6)],             # Em Atendimento → Orçamento (4h) ou direto Agendamento (6h)
    2: [(3, 8), (4, 12)],            # Orçamento → Negociação (8h) ou Agendamento (12h)
    3: [(4, 6), (0, 48)],            # Negociação → Agendamento (6h) ou Retorno ao início (48h)
    4: [(5, 24), (6, 3)],            # Agendamento → Pré-Cirúrgico (24h) ou Confirmação (3h)
    5: [(6, 2)],                     # Pré-Cirúrgico → Confirmação (2h)
    6: [],                           # Confirmação (destino final)
}

ORIGEM  = 0  # Lead Novo
DESTINO = 6  # Confirmação


def construir_grafo_matrix() -> dict:
    """Retorna o grafo como dicionário de adjacências (já definido acima)."""
    return GRAFO


def imprimir_grafo():
    sep("TAREFA 1 – REPRESENTAÇÃO DO GRAFO CRM COMO GRAFO DIRECIONADO")

    print("""
  O fluxo CRM é modelado como um GRAFO DIRECIONADO PONDERADO:

  • Nós     = etapas do processo (Lead → ... → Confirmação)
  • Arestas = transições possíveis entre etapas
  • Peso    = custo em horas (tempo médio da transição)

  Estrutura do grafo (lista de adjacências):
""")

    for no, vizinhos in GRAFO.items():
        nome_no = NOS[no]
        if vizinhos:
            for viz, peso in vizinhos:
                nome_viz = NOS[viz]
                print(f"  [{no}] {nome_no:<22} ──({peso:>3}h)──▶  [{viz}] {nome_viz}")
        else:
            print(f"  [{no}] {nome_no:<22} ──[ destino final ]")

    print(f"""
  Origem  : [{ORIGEM}] {NOS[ORIGEM]}
  Destino : [{DESTINO}] {NOS[DESTINO]}

  Total de nós    : {len(GRAFO)}
  Total de arestas: {sum(len(v) for v in GRAFO.values())}
""")


# ══════════════════════════════════════════════════════════════════
#  TAREFA 2 – IMPLEMENTAÇÃO DO ALGORITMO DE DIJKSTRA
# ══════════════════════════════════════════════════════════════════

def dijkstra(grafo: dict, origem: int, destino: int) -> tuple[float, list]:
    """
    Algoritmo de Dijkstra para encontrar o menor caminho em um
    grafo direcionado ponderado.

    Parâmetros:
        grafo   : dict {no: [(vizinho, peso), ...]}
        origem  : nó de partida
        destino : nó de chegada

    Retorna:
        (custo_total, caminho) – custo mínimo e lista de nós do caminho
    """
    # Distâncias inicializadas como infinito
    dist = {no: float("inf") for no in grafo}
    dist[origem] = 0

    # Predecessores para reconstruir o caminho
    prev = {no: None for no in grafo}

    # Fila de prioridade: (custo_acumulado, nó_atual)
    heap = [(0, origem)]

    # Conjunto de nós já processados
    visitados = set()

    iteracao = 0
    print(f"\n  Execução passo a passo:")
    print(f"  {'Iter':>4}  {'Nó Atual':<22}  {'Custo':<8}  {'Atualiza'}")
    print(f"  {'─'*55}")

    while heap:
        custo_atual, no_atual = heapq.heappop(heap)

        if no_atual in visitados:
            continue
        visitados.add(no_atual)

        iteracao += 1
        atualizacoes = []

        # Explorar vizinhos
        for vizinho, peso in grafo.get(no_atual, []):
            novo_custo = custo_atual + peso
            if novo_custo < dist[vizinho]:
                dist[vizinho] = novo_custo
                prev[vizinho] = no_atual
                heapq.heappush(heap, (novo_custo, vizinho))
                atualizacoes.append(f"{NOS[vizinho]}={novo_custo}h")

        print(f"  {iteracao:>4}  {NOS[no_atual]:<22}  {custo_atual:<8.1f}  "
              f"{', '.join(atualizacoes) if atualizacoes else '-'}")

        if no_atual == destino:
            break

    # Reconstrução do caminho
    caminho = []
    no = destino
    while no is not None:
        caminho.append(no)
        no = prev[no]
    caminho.reverse()

    # Verificação de conectividade
    if dist[destino] == float("inf"):
        return float("inf"), []

    return dist[destino], caminho


def executar_dijkstra():
    sep("TAREFA 2 – ALGORITMO DE DIJKSTRA: Lead → Confirmação")

    print(f"\n  Calculando menor caminho de:")
    print(f"    [{ORIGEM}] {NOS[ORIGEM]}  →  [{DESTINO}] {NOS[DESTINO]}\n")

    custo, caminho = dijkstra(GRAFO, ORIGEM, DESTINO)

    return custo, caminho


# ══════════════════════════════════════════════════════════════════
#  TAREFA 3 – INTERPRETAÇÃO DO RESULTADO
# ══════════════════════════════════════════════════════════════════

def interpretar_resultado(custo: float, caminho: list):
    sep("TAREFA 3 – INTERPRETAÇÃO DO RESULTADO")

    if not caminho or custo == float("inf"):
        print("\n  ✗ Nenhum caminho encontrado entre os nós.")
        return

    print(f"\n  ┌─ RESULTADO DO DIJKSTRA ──────────────────────────────┐")
    print(f"  │                                                      │")
    print(f"  │  Menor caminho encontrado:                           │")
    print(f"  │                                                      │")

    custo_acc = 0
    for i, no in enumerate(caminho):
        if i < len(caminho) - 1:
            prox = caminho[i + 1]
            peso = next(p for v, p in GRAFO[no] if v == prox)
            custo_acc += peso
            print(f"  │    [{no}] {NOS[no]:<22} ──({peso}h)──▶           │")
        else:
            print(f"  │    [{no}] {NOS[no]:<22}  ← DESTINO              │")

    print(f"  │                                                      │")
    print(f"  │  Custo total   : {custo:.0f} horas ({custo/24:.1f} dias)              │")
    print(f"  │  Nº de etapas  : {len(caminho)} nós                               │")
    print(f"  └──────────────────────────────────────────────────────┘")

    # Todos os caminhos possíveis (busca em profundidade)
    todos = []
    def dfs(no, caminho_atual, custo_atual):
        if no == DESTINO:
            todos.append((custo_atual, list(caminho_atual)))
            return
        if custo_atual > 200:  # poda para evitar ciclos
            return
        for viz, peso in GRAFO.get(no, []):
            if viz not in caminho_atual:
                dfs(viz, caminho_atual + [viz], custo_atual + peso)

    dfs(ORIGEM, [ORIGEM], 0)
    todos.sort(key=lambda x: x[0])

    print(f"\n  Todos os caminhos possíveis ({len(todos)}):")
    for i, (c, cam) in enumerate(todos, 1):
        nomes = " → ".join(NOS[n] for n in cam)
        marker = "  ← ÓTIMO" if c == custo else ""
        print(f"    {i}. [{c}h] {nomes}{marker}")

    # Economia
    if len(todos) > 1:
        pior_custo = todos[-1][0]
        economia = pior_custo - custo
        perc = (economia / pior_custo * 100) if pior_custo > 0 else 0
        print(f"\n  Comparativo:")
        print(f"    Caminho ótimo  : {custo:.0f}h")
        print(f"    Caminho máximo : {pior_custo:.0f}h")
        print(f"    Economia       : {economia:.0f}h ({perc:.1f}% mais rápido)")

    print(f"""
  INTERPRETAÇÃO:
  ─────────────────────────────────────────────────────────────
  O menor caminho encontrado é:

    {' → '.join(NOS[n] for n in caminho)}

  com custo total de {custo:.0f} horas ({custo/24:.1f} dias).

  Por que esse fluxo é mais eficiente?
  • Elimina a etapa de Orçamento/Negociação quando o lead já
    chega qualificado (ex: leads por Indicação).
  • Reduz o número de handoffs entre equipes, diminuindo o
    risco de abandono por falta de follow-up.
  • O tempo de {custo:.0f}h é {'adequado' if custo <= 15 else 'aceitável'} para leads com alta
    intenção de conversão.
  • A passagem direta Lead → Atendimento → Agendamento →
    Confirmação é possível em leads com convicção já formada,
    onde o orçamento pode ser apresentado no próprio dia da
    consulta, eliminando etapas redundantes.

  Aplicação prática:
  • Criar um "fast track" no CRM para leads por Indicação ou
    que já consultaram anteriormente, ativando diretamente o
    fluxo de {len(caminho)} etapas identificado pelo Dijkstra.
  • Para leads frios (Instagram/TikTok), seguir o caminho
    completo com orçamento e negociação.
""")


# ══════════════════════════════════════════════════════════════════
#  VISUALIZAÇÃO DO GRAFO
# ══════════════════════════════════════════════════════════════════

def visualizar_grafo(caminho_otimo: list):
    """Plota o grafo direcionado destacando o caminho ótimo."""

    # Posições dos nós (layout manual para melhor legibilidade)
    pos = {
        0: (0.0,  0.5),   # Lead Novo
        1: (1.5,  0.5),   # Em Atendimento
        2: (3.0,  1.0),   # Orçamento
        3: (4.5,  1.0),   # Negociação
        4: (4.5,  0.0),   # Agendamento
        5: (6.0,  0.5),   # Pré-Cirúrgico
        6: (7.5,  0.5),   # Confirmação
    }

    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_xlim(-0.5, 8.5)
    ax.set_ylim(-0.8, 1.8)
    ax.axis("off")
    fig.patch.set_facecolor("#0d1117")
    ax.set_facecolor("#0d1117")

    fig.suptitle("Hospital São Rafael – Grafo CRM e Caminho Ótimo (Dijkstra)\nSprint 4 | FIAP",
                 fontsize=13, weight="bold", color="white")

    caminho_arestas = set(zip(caminho_otimo, caminho_otimo[1:]))

    # Desenhar arestas
    for no, vizinhos in GRAFO.items():
        x1, y1 = pos[no]
        for viz, peso in vizinhos:
            x2, y2 = pos[viz]
            is_otimo = (no, viz) in caminho_arestas
            cor   = "#00ff88" if is_otimo else "#555555"
            lw    = 2.5       if is_otimo else 1.0
            alpha = 1.0       if is_otimo else 0.6

            # Leve curvatura para evitar sobreposição
            dx, dy = x2 - x1, y2 - y1
            mid_x  = (x1 + x2) / 2
            mid_y  = (y1 + y2) / 2 + (0.15 if (no, viz) not in [(3, 0)] else -0.2)

            ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                        arrowprops=dict(
                            arrowstyle="-|>",
                            color=cor, lw=lw, alpha=alpha,
                            connectionstyle=f"arc3,rad={'0.15' if abs(dy)>0.3 else '0.05'}"
                        ))

            # Label do peso
            ax.text(mid_x, mid_y, f"{peso}h",
                    ha="center", va="center", fontsize=7.5,
                    color=cor if is_otimo else "#888888",
                    fontweight="bold" if is_otimo else "normal",
                    bbox=dict(boxstyle="round,pad=0.2",
                              fc="#0d1117", ec="none", alpha=0.8))

    # Desenhar nós
    for no, (x, y) in pos.items():
        is_otimo = no in caminho_otimo
        cor_no   = "#00ff88" if is_otimo else "#1f3a5f"
        cor_txt  = "#0d1117"  if is_otimo else "#aaaaaa"
        cor_bord = "#00ff88" if is_otimo else "#3a6896"

        circle = plt.Circle((x, y), 0.30, color=cor_no, zorder=5, linewidth=2,
                             ec=cor_bord)
        ax.add_patch(circle)

        ax.text(x, y + 0.04, str(no),
                ha="center", va="center", fontsize=11,
                color=cor_txt, fontweight="bold", zorder=6)

        ax.text(x, y - 0.50, NOS[no],
                ha="center", va="center", fontsize=8,
                color="#00ff88" if is_otimo else "#aaaaaa",
                fontweight="bold" if is_otimo else "normal",
                wrap=True, zorder=6)

    # Legenda
    patch_otimo  = mpatches.Patch(color="#00ff88", label="Caminho ótimo (Dijkstra)")
    patch_outros = mpatches.Patch(color="#555555", label="Outros caminhos")
    ax.legend(handles=[patch_otimo, patch_outros],
              loc="lower right", fontsize=9,
              facecolor="#161b22", edgecolor="#30363d",
              labelcolor="white")

    plt.tight_layout()
    plt.savefig("sprint4_grafo_dijkstra.png", dpi=150, facecolor="#0d1117")
    print("  ✓ Gráfico salvo em: sprint4_grafo_dijkstra.png")


# ══════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    print("\n" + "█"*60)
    print("  SPRINT 4 – GRAFOS E DIJKSTRA NO CRM")
    print("  Hospital São Rafael | FIAP – Engenharia de Software")
    print("█"*60)

    # Tarefa 1
    imprimir_grafo()

    # Tarefa 2
    custo, caminho = executar_dijkstra()

    # Tarefa 3
    interpretar_resultado(custo, caminho)

    # Visualização
    sep("VISUALIZAÇÃO DO GRAFO")
    visualizar_grafo(caminho)

    sep("RESUMO FINAL")
    print(f"\n  Algoritmo : Dijkstra (heap de prioridade)")
    print(f"  Origem    : [{ORIGEM}] {NOS[ORIGEM]}")
    print(f"  Destino   : [{DESTINO}] {NOS[DESTINO]}")
    print(f"  Custo     : {custo:.0f} horas")
    print(f"  Caminho   : {' → '.join(NOS[n] for n in caminho)}")
    print(f"\n  Arquivo gerado: sprint4_grafo_dijkstra.png")
    print("\n" + "█"*60 + "\n")


if __name__ == "__main__":
    main()
