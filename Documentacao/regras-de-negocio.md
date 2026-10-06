# Regras de negócio — indicadores, cálculos e insights

Todas as regras ficam em `Aplicativo/src/lib/dominio/` (funções puras, testadas). A interface só exibe o resultado.

## Indicadores

| Código | Indicador | Fonte | Periodicidade | No site |
|---|---|---|---|---|
| IPCA | IPCA (% no mês) | BCB/SGS 433 | mensal | sim |
| IGPM | IGP-M (% no mês) | BCB/SGS 189 | mensal | sim |
| INPC | INPC (% no mês) | BCB/SGS 188 | mensal | não |
| SELIC_META | Meta Selic (% a.a.) | BCB/SGS 432 | diária | sim |
| CDI | CDI (% ao dia) | BCB/SGS 12 | diária | sim |
| USD | Dólar PTAX venda | BCB/SGS 1 | diária | sim |
| EUR | Euro PTAX venda | BCB/SGS 21619 | diária | não |
| IBCBR | IBC-Br dessazonalizado | BCB/SGS 24364 | mensal | não |
| FBCF | FBCF, valores correntes (R$ mi) | IBGE/SIDRA 1846 | trimestral | não |
| FBCF_REAL | FBCF, variação real interanual (%) | IBGE/SIDRA 5932 | trimestral | não |
| Focus | Medianas de IPCA, Selic, câmbio e PIB (ano corrente e seguinte) e IPCA 12 meses | BCB/Olinda | diária (agrupada por semana) | não |

Metas de inflação (centro e tolerância por ano) ficam na tabela `metas_inflacao`. A partir de 2025 a meta é contínua (3,00% ± 1,50 p.p.). Confira no site do BCB ao atualizar.

## Cálculos

Valores trafegam como texto (Postgres `numeric`) e são calculados com `decimal.js`. Float só para desenhar gráficos.

| Cálculo | Fórmula | Arquivo |
|---|---|---|
| Acumulado de N meses | Π(1 + vᵢ/100) − 1 | `inflacao.ts` |
| Mensal anualizado | (1 + v/100)¹² − 1 | `inflacao.ts` |
| Média de 3 meses anualizada | (1 + acumulado 3m)⁴ − 1 | `inflacao.ts` |
| IPCA × meta | compara IPCA 12m com centro, piso e teto do ano; conta meses seguidos fora da banda (6 seguidos a partir de 2025 = descumprimento da meta contínua) | `inflacao.ts` |
| Spread IGP-M − IPCA | diferença dos acumulados de 12 meses (p.p.) | `inflacao.ts` |
| CDI acumulado | Π(1 + dᵢ/100) − 1 sobre as taxas diárias; vazio se faltarem dados no início ou no fim do período (tolerância de 5 dias) | `juros.ts` |
| Juro real ex-post 12m | (1 + CDI 12m)/(1 + IPCA 12m) − 1 | `paineis/inflacao-juros.ts` |
| Juro real ex-ante | (1 + Selic meta)/(1 + IPCA esperado 12m no Focus) − 1 | `resumo.ts` |
| Rendimento real do CDI no ano | (1 + CDI ano)/(1 + IPCA ano) − 1 | `insights/regras-mercado.ts` |
| Variação cambial | última cotação antes do início × última até o fim | `cambio.ts` |
| Volatilidade | desvio-padrão amostral de ln(Pₜ/Pₜ₋₁) em 21 dias úteis × √252 | `cambio.ts` |
| Crescimento 12m (IBC-Br) | média dos 12 meses / média dos 12 anteriores − 1 | `atividade.ts` |
| Inflação implícita no restante do ano | (1 + esperado no ano)/(1 + acumulado no ano) − 1 | `expectativas.ts` |
| Revisões do Focus | semanas seguidas de alta ou queda da mediana (última coleta de cada semana) | `expectativas.ts` |
| Calculadora de correção | índices mensais: do mês inicial ao final, inclusive (como a Calculadora do Cidadão); CDI: da data inicial até a véspera da final; se o índice ainda não foi divulgado até o fim, corrige até o último dado e avisa; arredondamento a centavos (meio para cima) só no fim | `correcao.ts` |

## Insights e alertas

Gerados a cada carregamento a partir dos dados e da tabela `regras_alerta` (configurável pelo admin em *Administração → Alertas*). Quando passa do limite, o insight vira **alerta** com a severidade configurada; dentro do limite, algumas regras geram um insight **informativo**.

| Regra | Dispara quando | Limite padrão |
|---|---|---|
| IPCA_FORA_META | IPCA 12m fora da banda da meta | banda do ano |
| INFLACAO_ACELERANDO | média 3m anualizada − IPCA 12m ≥ limite (abaixo de −limite: informativo "desacelerando") | 1 p.p. |
| JURO_REAL | juro real ex-ante ≥ limite (restritivo) ou ≤ limite inferior (estimulativo) | 6% / 2% a.a. |
| SPREAD_IGPM_IPCA | \|IGP-M 12m − IPCA 12m\| ≥ limite | 3 p.p. |
| DOLAR_MOVIMENTO | \|variação do dólar no mês\| ≥ limite (informa "maior alta/queda desde") | 5% |
| DOLAR_VOLATILIDADE | volatilidade atual ÷ média de 12 meses ≥ limite | 1,5× |
| FOCUS_REVISOES | expectativa de IPCA do ano revisada na mesma direção por N semanas | 4 semanas |
| CDI_REAL | sempre (informativo) | — |
| ATIVIDADE_DESACELERA | queda do crescimento 12m do IBC-Br em 3 meses ≥ limite | 0,5 p.p. |
| MAIORES_VARIACOES | sempre (informativo): 3 indicadores que mais variaram no período filtrado | — |

O site público mostra só insights informativos de indicadores públicos (IPCA × meta, CDI real e maiores variações).

## Relatório do mês

Só para meses encerrados (a partir de 01/2016). Planilha Google com abas *Resumo*, *Insights*, *Séries* (24 meses) e *IPCA x Meta* (com gráfico). O Excel é exportado da própria planilha pelo Drive. O rascunho do Gmail leva assunto "Relatório de indicadores — MM/AAAA", os principais números, os 3 primeiros insights e o `.xlsx` anexo — **sem destinatário e nunca enviado** pelo portal.
