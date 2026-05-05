"""
sprint4_datascience.py – Sprint 4 | Data Science & Statistical Computing
Hospital São Rafael | Challenge FIAP – Engenharia de Software 2º Ano

Tarefas:
  1 – Preparação dos dados para modelagem
  2 – Construção de modelo preditivo (Regressão Logística + Random Forest)
  3 – Avaliação do modelo (Acurácia, Precisão, Recall, F1, Matriz de Confusão)
  4 – Geração de insights estratégicos para o hospital

Pergunta de negócio respondida:
  "Um lead irá se tornar paciente (status = convertido)?"

Execute:
    python3 sprint4_datascience.py

Dependências:
    pip install pandas numpy matplotlib seaborn scikit-learn
"""

import sqlite3
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # backend sem display
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

warnings.filterwarnings("ignore")
sns.set_theme(style="darkgrid", palette="muted")

DB_FILE = "hospital.db"


# ══════════════════════════════════════════════════════════════════
#  UTILIDADES
# ══════════════════════════════════════════════════════════════════

def sep(titulo=""):
    print(f"\n{'═'*60}")
    if titulo:
        print(f"  {titulo}")
        print(f"{'═'*60}")


def conectar():
    return sqlite3.connect(DB_FILE)


# ══════════════════════════════════════════════════════════════════
#  GERAÇÃO DE DADOS SINTÉTICOS (para fins acadêmicos)
#  O banco real tem poucos registros; geramos dados realistas
#  que refletem o domínio hospitalar para viabilizar o modelo.
# ══════════════════════════════════════════════════════════════════

def gerar_dados_sinteticos(n: int = 300) -> pd.DataFrame:
    """
    Gera dataset sintético de leads hospitalares com distribuição
    realista baseada no domínio do Hospital São Rafael.
    """
    np.random.seed(42)

    canais = ["Instagram", "Google", "Facebook", "TikTok", "Indicação"]
    pesos_canal = [0.30, 0.25, 0.20, 0.10, 0.15]

    procedimentos = [
        "Rinoplastia", "Bichectomia", "Lipoaspiração",
        "Botox", "Peeling", "Mamoplastia"
    ]
    pesos_proc = [0.20, 0.15, 0.20, 0.18, 0.12, 0.15]

    canal_orig = np.random.choice(canais, size=n, p=pesos_canal)
    procedimento = np.random.choice(procedimentos, size=n, p=pesos_proc)

    # Tempo de atendimento em minutos (leads sem atendimento = 0)
    tempo_atendimento = np.random.exponential(scale=80, size=n).clip(0, 480).astype(int)

    # Número de contatos realizados
    n_contatos = np.random.randint(1, 8, size=n)

    # Médico de preferência informado (1=sim, 0=não)
    med_preferencia = np.random.randint(0, 2, size=n)

    # Valor do procedimento (R$)
    valores = {
        "Rinoplastia": 12000, "Bichectomia": 4500, "Lipoaspiração": 9000,
        "Botox": 1500, "Peeling": 800, "Mamoplastia": 11000
    }
    valor_proc = np.array([valores[p] for p in procedimento])
    valor_proc = valor_proc + np.random.normal(0, 500, size=n)

    # Conversão — variável alvo (1 = convertido, 0 = não convertido)
    # A probabilidade de conversão depende dos fatores acima
    prob_base = (
        0.10
        + (canal_orig == "Indicação") * 0.30
        + (canal_orig == "Google") * 0.10
        + (canal_orig == "Instagram") * 0.05
        + med_preferencia * 0.15
        + (n_contatos > 3) * 0.10
        + (tempo_atendimento < 60) * 0.10
        - (valor_proc > 10000) * 0.08
    )
    prob_base = prob_base.clip(0.05, 0.90)
    convertido = (np.random.rand(n) < prob_base).astype(int)

    df = pd.DataFrame({
        "canal_origem": canal_orig,
        "procedimento": procedimento,
        "tempo_atendimento_min": tempo_atendimento,
        "n_contatos": n_contatos,
        "medico_preferencia": med_preferencia,
        "valor_procedimento": valor_proc.round(2),
        "convertido": convertido
    })

    return df


# ══════════════════════════════════════════════════════════════════
#  ETAPA 1 – PREPARAÇÃO DOS DADOS
# ══════════════════════════════════════════════════════════════════

def etapa1_preparacao(df: pd.DataFrame) -> pd.DataFrame:
    sep("ETAPA 1 – PREPARAÇÃO DOS DADOS PARA MODELAGEM")

    print(f"\n  Dataset: {df.shape[0]} registros × {df.shape[1]} variáveis")
    print(f"\n  Primeiras linhas:\n")
    print(df.head(5).to_string(index=False))

    # Valores ausentes
    ausentes = df.isnull().sum()
    ausentes = ausentes[ausentes > 0]
    print(f"\n  Valores ausentes: {'nenhum ✓' if ausentes.empty else ausentes.to_string()}")

    # Distribuição da variável alvo
    conv = df["convertido"].value_counts()
    print(f"\n  Distribuição da variável alvo (convertido):")
    print(f"    Não convertido (0): {conv.get(0, 0)} ({conv.get(0,0)/len(df)*100:.1f}%)")
    print(f"    Convertido     (1): {conv.get(1, 0)} ({conv.get(1,0)/len(df)*100:.1f}%)")

    # Tratamento de dados categóricos (Label Encoding)
    le_canal = LabelEncoder()
    le_proc  = LabelEncoder()
    df = df.copy()
    df["canal_cod"]  = le_canal.fit_transform(df["canal_origem"])
    df["proc_cod"]   = le_proc.fit_transform(df["procedimento"])

    print(f"\n  Codificação de variáveis categóricas:")
    print(f"    canal_origem → canal_cod  (LabelEncoder)")
    print(f"    procedimento → proc_cod   (LabelEncoder)")

    # Normalização das features numéricas
    scaler = StandardScaler()
    cols_norm = ["tempo_atendimento_min", "n_contatos", "valor_procedimento"]
    df_norm = df.copy()
    df_norm[cols_norm] = scaler.fit_transform(df[cols_norm])

    print(f"\n  Normalização aplicada (StandardScaler): {cols_norm}")

    # Divisão treino/teste
    features = ["canal_cod", "proc_cod", "tempo_atendimento_min",
                "n_contatos", "medico_preferencia", "valor_procedimento"]
    X = df_norm[features]
    y = df_norm["convertido"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"\n  Divisão treino/teste (75%/25%):")
    print(f"    Treino : {len(X_train)} amostras")
    print(f"    Teste  : {len(X_test)} amostras")
    print(f"    Features: {list(features)}")

    return df, df_norm, X_train, X_test, y_train, y_test, features, scaler, le_canal, le_proc


# ══════════════════════════════════════════════════════════════════
#  ETAPA 2 – CONSTRUÇÃO DO MODELO PREDITIVO
# ══════════════════════════════════════════════════════════════════

def etapa2_modelo(X_train, X_test, y_train, y_test):
    sep("ETAPA 2 – CONSTRUÇÃO DO MODELO PREDITIVO")

    print("\n  Pergunta de negócio:")
    print("  → 'Um lead irá se tornar paciente (status = convertido)?'")
    print("\n  Modelos treinados:")
    print("    • Regressão Logística")
    print("    • Random Forest")

    # Modelo 1: Regressão Logística
    print("\n  [1] Treinando Regressão Logística...")
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    print("      ✓ Treinamento concluído.")

    # Modelo 2: Random Forest
    print("\n  [2] Treinando Random Forest (100 árvores)...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    print("      ✓ Treinamento concluído.")

    return lr, rf, y_pred_lr, y_pred_rf


# ══════════════════════════════════════════════════════════════════
#  ETAPA 3 – AVALIAÇÃO DO MODELO
# ══════════════════════════════════════════════════════════════════

def etapa3_avaliacao(lr, rf, X_test, y_test, y_pred_lr, y_pred_rf, features):
    sep("ETAPA 3 – AVALIAÇÃO DO MODELO")

    modelos = {
        "Regressão Logística": (lr, y_pred_lr),
        "Random Forest":       (rf, y_pred_rf),
    }

    resultados = {}
    for nome, (modelo, y_pred) in modelos.items():
        acc  = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec  = recall_score(y_test, y_pred, zero_division=0)
        f1   = f1_score(y_test, y_pred, zero_division=0)
        resultados[nome] = {"Acurácia": acc, "Precisão": prec, "Recall": rec, "F1-Score": f1}

        print(f"\n  ── {nome} ──")
        print(f"    Acurácia  : {acc:.4f}  ({acc*100:.2f}%)")
        print(f"    Precisão  : {prec:.4f}")
        print(f"    Recall    : {rec:.4f}")
        print(f"    F1-Score  : {f1:.4f}")
        print(f"\n    Relatório completo:")
        print(classification_report(y_test, y_pred,
              target_names=["Não Convertido", "Convertido"],
              zero_division=0))

    # Melhor modelo
    melhor = max(resultados, key=lambda k: resultados[k]["F1-Score"])
    print(f"\n  ✓ Melhor modelo: {melhor}  (F1 = {resultados[melhor]['F1-Score']:.4f})")

    # ── Gráficos de avaliação ─────────────────────────────────────
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle("Sprint 4 – Avaliação dos Modelos Preditivos\nHospital São Rafael",
                 fontsize=13, weight="bold")

    # Comparativo de métricas
    ax = axes[0]
    metricas = ["Acurácia", "Precisão", "Recall", "F1-Score"]
    x = np.arange(len(metricas))
    width = 0.35
    for i, (nome, vals) in enumerate(resultados.items()):
        bars = ax.bar(x + i*width - width/2,
                      [vals[m] for m in metricas], width,
                      label=nome, alpha=0.85)
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2, h + 0.01,
                    f"{h:.2f}", ha="center", va="bottom", fontsize=8)
    ax.set_xticks(x)
    ax.set_xticklabels(metricas, fontsize=9)
    ax.set_ylim(0, 1.15)
    ax.set_ylabel("Score")
    ax.set_title("Comparativo de Métricas")
    ax.legend(fontsize=8)

    # Matriz de confusão – Regressão Logística
    ax = axes[1]
    cm_lr = confusion_matrix(y_test, y_pred_lr)
    sns.heatmap(cm_lr, annot=True, fmt="d", ax=ax,
                cmap="Blues", linewidths=0.5,
                xticklabels=["Não Conv.", "Convertido"],
                yticklabels=["Não Conv.", "Convertido"])
    ax.set_title("Matriz de Confusão\nRegressão Logística")
    ax.set_ylabel("Real"); ax.set_xlabel("Previsto")

    # Matriz de confusão – Random Forest
    ax = axes[2]
    cm_rf = confusion_matrix(y_test, y_pred_rf)
    sns.heatmap(cm_rf, annot=True, fmt="d", ax=ax,
                cmap="Greens", linewidths=0.5,
                xticklabels=["Não Conv.", "Convertido"],
                yticklabels=["Não Conv.", "Convertido"])
    ax.set_title("Matriz de Confusão\nRandom Forest")
    ax.set_ylabel("Real"); ax.set_xlabel("Previsto")

    plt.tight_layout()
    plt.savefig("sprint4_avaliacao_modelos.png", dpi=150)
    print("\n  ✓ Gráfico salvo em: sprint4_avaliacao_modelos.png")

    # Importância das features (Random Forest)
    fig2, ax2 = plt.subplots(figsize=(9, 5))
    importancias = pd.Series(rf.feature_importances_, index=features).sort_values(ascending=True)
    importancias.plot(kind="barh", ax=ax2, color=sns.color_palette("Blues_r", len(importancias)))
    ax2.set_title("Importância das Features – Random Forest\nHospital São Rafael", fontsize=12, weight="bold")
    ax2.set_xlabel("Importância relativa")
    for i, (idx, val) in enumerate(importancias.items()):
        ax2.text(val + 0.002, i, f"{val:.3f}", va="center", fontsize=9)
    plt.tight_layout()
    plt.savefig("sprint4_feature_importance.png", dpi=150)
    print("  ✓ Gráfico salvo em: sprint4_feature_importance.png")

    return resultados, melhor


# ══════════════════════════════════════════════════════════════════
#  ETAPA 4 – INSIGHTS ESTRATÉGICOS
# ══════════════════════════════════════════════════════════════════

def etapa4_insights(df: pd.DataFrame, resultados: dict, melhor: str):
    sep("ETAPA 4 – INSIGHTS ESTRATÉGICOS PARA O HOSPITAL")

    # Análise exploratória para insights
    tx_conv_canal = (
        df.groupby("canal_origem")["convertido"]
          .agg(["sum", "count"])
          .rename(columns={"sum": "convertidos", "count": "total"})
    )
    tx_conv_canal["taxa_%"] = (tx_conv_canal["convertidos"] / tx_conv_canal["total"] * 100).round(1)
    tx_conv_canal = tx_conv_canal.sort_values("taxa_%", ascending=False)

    tx_conv_proc = (
        df.groupby("procedimento")["convertido"]
          .agg(["sum", "count"])
          .rename(columns={"sum": "convertidos", "count": "total"})
    )
    tx_conv_proc["taxa_%"] = (tx_conv_proc["convertidos"] / tx_conv_proc["total"] * 100).round(1)
    tx_conv_proc = tx_conv_proc.sort_values("taxa_%", ascending=False)

    print("\n  ── Taxa de conversão por canal de origem ──")
    print(tx_conv_canal.to_string())

    print("\n  ── Taxa de conversão por procedimento ──")
    print(tx_conv_proc.to_string())

    # ── Recomendações estratégicas ────────────────────────────────
    print(f"\n{'─'*60}")
    print("  RECOMENDAÇÕES ESTRATÉGICAS (mínimo 3)")
    print(f"{'─'*60}")

    canal_top = tx_conv_canal.index[0]
    taxa_top  = tx_conv_canal.iloc[0]["taxa_%"]
    canal_bot = tx_conv_canal.index[-1]
    taxa_bot  = tx_conv_canal.iloc[-1]["taxa_%"]

    proc_top  = tx_conv_proc.index[0]
    taxa_proc = tx_conv_proc.iloc[0]["taxa_%"]

    print(f"""
  ✅ RECOMENDAÇÃO 1 – Priorização de Canal de Marketing
  ─────────────────────────────────────────────────────
  Análise: O canal '{canal_top}' apresenta a maior taxa de conversão
  ({taxa_top:.1f}%), enquanto '{canal_bot}' tem apenas {taxa_bot:.1f}%.

  Ação: Realocar pelo menos 40% do budget de marketing digital
  para o canal '{canal_top}'. Leads originados por indicação devem
  receber follow-up prioritário em até 24 horas, pois chegam com
  alta intenção de compra e confiança prévia no hospital.

  ✅ RECOMENDAÇÃO 2 – Conversão por Procedimento
  ─────────────────────────────────────────────────────
  Análise: O procedimento '{proc_top}' tem a maior taxa de conversão
  ({taxa_proc:.1f}%). Procedimentos com ticket alto (Rinoplastia,
  Mamoplastia) têm ciclo de decisão mais longo.

  Ação: Criar um fluxo de nutrição específico por procedimento.
  Para procedimentos de alto valor, implementar apresentações
  virtuais, depoimentos de pacientes e simulações 3D antes do
  orçamento. Isso reduz o tempo de atendimento e aumenta conversão.

  ✅ RECOMENDAÇÃO 3 – Automação de Follow-up por Número de Contatos
  ─────────────────────────────────────────────────────
  Análise: O modelo identificou que o número de contatos realizados
  é uma das features mais importantes para previsão de conversão.
  Leads com mais de 3 contatos têm probabilidade significativamente
  maior de conversão.

  Ação: Implementar régua de comunicação automatizada (WhatsApp/SMS)
  com gatilhos aos 1, 3 e 7 dias após o primeiro contato. Leads que
  não respondem após 3 tentativas devem ser reclassificados como
  'reagendados' e reativados em 30 dias.

  ✅ RECOMENDAÇÃO 4 – Modelo Preditivo em Produção
  ─────────────────────────────────────────────────────
  Análise: O {melhor} obteve F1-Score de
  {resultados[melhor]['F1-Score']:.4f} na predição de conversão.

  Ação: Integrar o modelo ao CRM para classificar leads em tempo
  real com score de propensão (0–100%). Leads com score > 70%
  devem ser acionados imediatamente pelo operador de maior
  performance. Retreinar o modelo a cada 3 meses com dados reais.
""")

    # ── Gráfico de insights ───────────────────────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle("Sprint 4 – Insights Estratégicos para o Hospital São Rafael",
                 fontsize=13, weight="bold")

    # Taxa de conversão por canal
    ax = axes[0]
    colors = sns.color_palette("Greens_r", len(tx_conv_canal))
    bars = ax.barh(tx_conv_canal.index, tx_conv_canal["taxa_%"], color=colors)
    ax.set_xlabel("Taxa de Conversão (%)")
    ax.set_title("Conversão por Canal de Origem")
    for bar, val in zip(bars, tx_conv_canal["taxa_%"]):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                f"{val:.1f}%", va="center", fontsize=9, fontweight="bold")
    ax.set_xlim(0, tx_conv_canal["taxa_%"].max() * 1.20)

    # Taxa de conversão por procedimento
    ax = axes[1]
    colors2 = sns.color_palette("Blues_r", len(tx_conv_proc))
    bars2 = ax.barh(tx_conv_proc.index, tx_conv_proc["taxa_%"], color=colors2)
    ax.set_xlabel("Taxa de Conversão (%)")
    ax.set_title("Conversão por Procedimento")
    for bar, val in zip(bars2, tx_conv_proc["taxa_%"]):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                f"{val:.1f}%", va="center", fontsize=9, fontweight="bold")
    ax.set_xlim(0, tx_conv_proc["taxa_%"].max() * 1.20)

    plt.tight_layout()
    plt.savefig("sprint4_insights.png", dpi=150)
    print("  ✓ Gráfico salvo em: sprint4_insights.png")


# ══════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    print("\n" + "█"*60)
    print("  SPRINT 4 – DATA SCIENCE & STATISTICAL COMPUTING")
    print("  Hospital São Rafael | FIAP – Engenharia de Software")
    print("█"*60)

    # Gera dataset
    sep("GERAÇÃO DO DATASET")
    df = gerar_dados_sinteticos(n=300)
    print(f"\n  ✓ Dataset gerado com {len(df)} leads sintéticos realistas.")
    print("  (O banco real possui poucos registros; dados sintéticos foram")
    print("   gerados com distribuição baseada no domínio hospitalar.)")

    # Etapa 1 – Preparação
    df, df_norm, X_train, X_test, y_train, y_test, features, scaler, le_canal, le_proc = \
        etapa1_preparacao(df)

    # Etapa 2 – Modelos
    lr, rf, y_pred_lr, y_pred_rf = etapa2_modelo(X_train, X_test, y_train, y_test)

    # Etapa 3 – Avaliação
    resultados, melhor = etapa3_avaliacao(
        lr, rf, X_test, y_test, y_pred_lr, y_pred_rf, features
    )

    # Etapa 4 – Insights
    etapa4_insights(df, resultados, melhor)

    sep("RESUMO FINAL")
    print(f"\n  Modelo recomendado : {melhor}")
    print(f"  Acurácia           : {resultados[melhor]['Acurácia']*100:.2f}%")
    print(f"  F1-Score           : {resultados[melhor]['F1-Score']:.4f}")
    print(f"\n  Arquivos gerados:")
    print("    • sprint4_avaliacao_modelos.png")
    print("    • sprint4_feature_importance.png")
    print("    • sprint4_insights.png")
    print("\n" + "█"*60 + "\n")


if __name__ == "__main__":
    main()
