#!/usr/bin/env python3
"""
Coleta os indicadores econômicos do Portal Perfin, grava no Supabase e gera CSVs.

Fontes:
  - BCB/SGS: IPCA (433), IGP-M (189), INPC (188), Meta Selic (432), CDI (12),
             Dólar PTAX venda (1), Euro PTAX venda (21619), IBC-Br dessazonalizado (24364)
  - IBGE/SIDRA: FBCF valores correntes (tabela 1846) e variação real interanual (tabela 5932)
  - BCB/Olinda: Boletim Focus (medianas anuais e IPCA esperado em 12 meses)

Somente biblioteca padrão do Python (3.10+).

Uso:
  python indicadores_brasil.py                    # desde 2015-01-01, grava no Supabase e no CSV
  python indicadores_brasil.py 2020-01-01         # data inicial customizada
  python indicadores_brasil.py --sem-supabase     # só gera os CSVs

Variáveis (ambiente ou arquivo .env na raiz do repositório):
  SUPABASE_URL, SUPABASE_SECRET_KEY
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

PASTA = Path(__file__).resolve().parent
PASTA_SAIDA = PASTA / "saida"
DATA_INICIAL_PADRAO = date(2015, 1, 1)
TAMANHO_LOTE = 1000

SERIES_SGS = {
    "IPCA": 433,
    "IGPM": 189,
    "INPC": 188,
    "SELIC_META": 432,
    "CDI": 12,
    "USD": 1,
    "EUR": 21619,
    "IBCBR": 24364,
}

SIDRA = {
    "FBCF": "https://apisidra.ibge.gov.br/values/t/1846/n1/all/v/585/p/all/c11255/93406",
    "FBCF_REAL": "https://apisidra.ibge.gov.br/values/t/5932/n1/all/v/6561/p/all/c11255/93406",
}

OLINDA = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata"
FOCUS_ANUAIS = {"IPCA": "IPCA", "SELIC": "Selic", "CAMBIO": "Câmbio", "PIB": "PIB Total"}


@dataclass(frozen=True)
class Valor:
    indicador: str
    data: date
    valor: Decimal


@dataclass(frozen=True)
class Expectativa:
    indicador: str
    referencia: str
    data_coleta: date
    mediana: Decimal


class ErroConfiguracao(Exception):
    pass


# ----------------------------------------------------------------------------
# Funções puras (testadas em test_indicadores_brasil.py)
# ----------------------------------------------------------------------------

def blocos_de_datas(inicio: date, fim: date, anos: int = 9) -> list[tuple[date, date]]:
    """Divide o período em blocos (a API do SGS limita séries diárias a 10 anos por consulta)."""
    blocos = []
    ini = inicio
    while ini <= fim:
        fim_bloco = min(date(ini.year + anos, ini.month, 1) - timedelta(days=1), fim)
        blocos.append((ini, fim_bloco))
        ini = fim_bloco + timedelta(days=1)
    return blocos


def converter_decimal(texto: object) -> Decimal | None:
    try:
        return Decimal(str(texto).strip().replace(",", "."))
    except (InvalidOperation, ValueError):
        return None


def converter_sgs(indicador: str, itens: list[dict]) -> list[Valor]:
    valores = []
    for item in itens:
        valor = converter_decimal(item.get("valor"))
        if valor is None:
            continue
        data = datetime.strptime(item["data"], "%d/%m/%Y").date()
        valores.append(Valor(indicador, data, valor))
    return valores


def data_do_trimestre(periodo: str) -> date:
    """'202402' (ano + trimestre) -> primeiro dia do trimestre."""
    ano, trimestre = int(periodo[:4]), int(periodo[4:])
    if not 1 <= trimestre <= 4:
        raise ValueError(f"trimestre inválido: {periodo}")
    return date(ano, 3 * (trimestre - 1) + 1, 1)


def converter_sidra(indicador: str, linhas: list[dict], inicio: date) -> list[Valor]:
    valores = []
    for linha in linhas[1:]:  # a primeira linha é o cabeçalho
        valor = converter_decimal(linha.get("V"))
        try:
            data = data_do_trimestre(linha.get("D3C", ""))
        except ValueError:
            continue
        if valor is not None and data >= date(inicio.year, 1, 1):
            valores.append(Valor(indicador, data, valor))
    return valores


def converter_focus_anual(indicador: str, itens: list[dict]) -> list[Expectativa]:
    """Mantém só as expectativas para o ano da coleta e o seguinte."""
    saida = []
    for item in itens:
        mediana = converter_decimal(item.get("Mediana"))
        data = date.fromisoformat(item["Data"][:10])
        referencia = str(item.get("DataReferencia", ""))
        if mediana is None or referencia not in (str(data.year), str(data.year + 1)):
            continue
        saida.append(Expectativa(indicador, referencia, data, mediana))
    return saida


def converter_focus_12m(itens: list[dict]) -> list[Expectativa]:
    saida = []
    for item in itens:
        mediana = converter_decimal(item.get("Mediana"))
        if mediana is not None:
            saida.append(Expectativa("IPCA", "12M", date.fromisoformat(item["Data"][:10]), mediana))
    return saida


def sem_duplicados(registros: list, chave) -> list:
    """Mantém o último registro de cada chave (a Olinda pode repetir linhas)."""
    return list({chave(r): r for r in registros}.values())


def ler_dotenv(caminho: Path) -> dict[str, str]:
    variaveis = {}
    if not caminho.exists():
        return variaveis
    for linha in caminho.read_text(encoding="utf-8-sig").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        nome, valor = linha.split("=", 1)
        variaveis[nome.strip()] = valor.strip().strip('"').strip("'")
    return variaveis


def formatar_decimal_br(valor: Decimal) -> str:
    return format(valor.normalize(), "f").replace(".", ",")


def linhas_payload_valores(valores: list[Valor], agora: str) -> list[dict]:
    # Valores vão como texto para preservar a precisão do `numeric` no Postgres.
    return [
        {"indicador_codigo": v.indicador, "data_referencia": v.data.isoformat(),
         "valor": format(v.valor, "f"), "atualizado_em": agora}
        for v in valores
    ]


def linhas_payload_focus(expectativas: list[Expectativa], agora: str) -> list[dict]:
    return [
        {"indicador": e.indicador, "referencia": e.referencia,
         "data_coleta": e.data_coleta.isoformat(), "mediana": format(e.mediana, "f"),
         "atualizado_em": agora}
        for e in expectativas
    ]


# ----------------------------------------------------------------------------
# Rede
# ----------------------------------------------------------------------------

def baixar_json(url: str, tentativas: int = 3):
    for tentativa in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PortalPerfin/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as erro:
            if tentativa == tentativas:
                raise
            print(f"  tentativa {tentativa} falhou ({erro}); repetindo...")
            time.sleep(3 * tentativa)


def serie_sgs(indicador: str, codigo: int, inicio: date, fim: date) -> list[Valor]:
    valores = []
    for ini, fim_bloco in blocos_de_datas(inicio, fim):
        url = (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json"
               f"&dataInicial={ini:%d/%m/%Y}&dataFinal={fim_bloco:%d/%m/%Y}")
        valores.extend(converter_sgs(indicador, baixar_json(url) or []))
    return valores


def url_olinda(recurso: str, filtro: str, campos: str) -> str:
    parametros = {"$filter": filtro, "$select": campos, "$format": "json", "$top": "100000"}
    return f"{OLINDA}/{recurso}?" + urllib.parse.urlencode(parametros, quote_via=urllib.parse.quote)


def focus(inicio: date) -> list[Expectativa]:
    expectativas = []
    for codigo, nome in FOCUS_ANUAIS.items():
        filtro = f"Indicador eq '{nome}' and baseCalculo eq 0 and Data ge '{inicio.isoformat()}'"
        dados = baixar_json(url_olinda("ExpectativasMercadoAnuais", filtro, "Indicador,Data,DataReferencia,Mediana"))
        expectativas.extend(converter_focus_anual(codigo, dados.get("value", [])))
    filtro = f"Indicador eq 'IPCA' and Suavizada eq 'S' and baseCalculo eq 0 and Data ge '{inicio.isoformat()}'"
    dados = baixar_json(url_olinda("ExpectativasMercadoInflacao12Meses", filtro, "Indicador,Data,Mediana"))
    expectativas.extend(converter_focus_12m(dados.get("value", [])))
    return sem_duplicados(expectativas, lambda e: (e.indicador, e.referencia, e.data_coleta))


# ----------------------------------------------------------------------------
# Supabase (PostgREST) e CSV
# ----------------------------------------------------------------------------

def configuracao_supabase() -> tuple[str, str]:
    arquivo = ler_dotenv(PASTA.parents[2] / ".env")
    url = os.environ.get("SUPABASE_URL") or arquivo.get("SUPABASE_URL")
    chave = os.environ.get("SUPABASE_SECRET_KEY") or arquivo.get("SUPABASE_SECRET_KEY")
    if not url or not chave:
        raise ErroConfiguracao("Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou use --sem-supabase).")
    return url.rstrip("/"), chave


def upsert(url_base: str, chave: str, tabela: str, conflito: str, linhas: list[dict]) -> None:
    destino = f"{url_base}/rest/v1/{tabela}?on_conflict={conflito}"
    for i in range(0, len(linhas), TAMANHO_LOTE):
        corpo = json.dumps(linhas[i:i + TAMANHO_LOTE]).encode("utf-8")
        cabecalhos = {
            "apikey": chave,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        if not chave.startswith("sb_"):
            # Chave antiga (JWT service_role) também precisa do Authorization; as novas sb_secret_ não.
            cabecalhos["Authorization"] = f"Bearer {chave}"
        req = urllib.request.Request(destino, data=corpo, method="POST", headers=cabecalhos)
        try:
            with urllib.request.urlopen(req, timeout=120):
                pass
        except urllib.error.HTTPError as erro:
            # O corpo da resposta não contém a chave; o cabeçalho de envio nunca é impresso.
            detalhe = erro.read().decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"Falha ao gravar em {tabela} (HTTP {erro.code}): {detalhe}") from None


def gravar_csv_valores(valores: list[Valor], arquivo: Path) -> None:
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    temporario = arquivo.with_suffix(".tmp")
    with open(temporario, "w", newline="", encoding="utf-8-sig") as f:
        escritor = csv.writer(f, delimiter=";")
        escritor.writerow(["indicador", "data_referencia", "valor"])
        for v in sorted(valores, key=lambda v: (v.indicador, v.data)):
            escritor.writerow([v.indicador, v.data.strftime("%d/%m/%Y"), formatar_decimal_br(v.valor)])
    temporario.replace(arquivo)  # só substitui o CSV antigo se tudo foi gravado


def gravar_csv_focus(expectativas: list[Expectativa], arquivo: Path) -> None:
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    temporario = arquivo.with_suffix(".tmp")
    with open(temporario, "w", newline="", encoding="utf-8-sig") as f:
        escritor = csv.writer(f, delimiter=";")
        escritor.writerow(["indicador", "referencia", "data_coleta", "mediana"])
        for e in sorted(expectativas, key=lambda e: (e.indicador, e.referencia, e.data_coleta)):
            escritor.writerow([e.indicador, e.referencia, e.data_coleta.strftime("%d/%m/%Y"),
                               formatar_decimal_br(e.mediana)])
    temporario.replace(arquivo)


# ----------------------------------------------------------------------------
# Execução
# ----------------------------------------------------------------------------

def coletar(inicio: date, fim: date) -> tuple[list[Valor], list[Expectativa], list[str]]:
    valores, falhas = [], []
    for indicador, codigo in SERIES_SGS.items():
        print(f"Baixando {indicador} (SGS {codigo})...")
        try:
            valores.extend(serie_sgs(indicador, codigo, inicio, fim))
        except Exception as erro:  # uma série com problema não impede as demais
            falhas.append(f"{indicador}: {erro}")
    for indicador, url in SIDRA.items():
        print(f"Baixando {indicador} (IBGE/SIDRA)...")
        try:
            valores.extend(converter_sidra(indicador, baixar_json(url), inicio))
        except Exception as erro:
            falhas.append(f"{indicador}: {erro}")
    print("Baixando Boletim Focus (BCB/Olinda)...")
    try:
        expectativas = focus(inicio)
    except Exception as erro:
        expectativas = []
        falhas.append(f"FOCUS: {erro}")
    return valores, expectativas, falhas


def main(argumentos: list[str]) -> int:
    sem_supabase = "--sem-supabase" in argumentos
    datas = [a for a in argumentos if not a.startswith("--")]
    inicio = date.fromisoformat(datas[0]) if datas else DATA_INICIAL_PADRAO
    fim = date.today()

    credenciais = None if sem_supabase else configuracao_supabase()
    valores, expectativas, falhas = coletar(inicio, fim)

    gravar_csv_valores(valores, PASTA_SAIDA / "indicadores_brasil.csv")
    gravar_csv_focus(expectativas, PASTA_SAIDA / "expectativas_focus.csv")
    print(f"CSVs gravados em {PASTA_SAIDA}")

    if credenciais:
        agora = datetime.now(timezone.utc).isoformat()
        url, chave = credenciais
        upsert(url, chave, "indicador_valores", "indicador_codigo,data_referencia",
               linhas_payload_valores(valores, agora))
        upsert(url, chave, "expectativas_focus", "indicador,referencia,data_coleta",
               linhas_payload_focus(expectativas, agora))
        print(f"Supabase: {len(valores)} valores e {len(expectativas)} expectativas gravados.")

    for falha in falhas:
        print(f"ERRO: {falha}")
    return 1 if falhas else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except ErroConfiguracao as erro:
        print(f"ERRO: {erro}")
        sys.exit(2)
