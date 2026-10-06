import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

import indicadores_brasil as ib


class TestBlocos(unittest.TestCase):
    def test_divide_em_blocos_sem_sobreposicao(self):
        blocos = ib.blocos_de_datas(date(2015, 1, 1), date(2026, 10, 6))
        self.assertEqual(blocos[0], (date(2015, 1, 1), date(2023, 12, 31)))
        self.assertEqual(blocos[1], (date(2024, 1, 1), date(2026, 10, 6)))

    def test_periodo_curto_tem_um_bloco(self):
        self.assertEqual(ib.blocos_de_datas(date(2026, 1, 1), date(2026, 1, 31)),
                         [(date(2026, 1, 1), date(2026, 1, 31))])


class TestConversoes(unittest.TestCase):
    def test_sgs_converte_e_ignora_valores_invalidos(self):
        itens = [{"data": "01/01/2026", "valor": "0.16"}, {"data": "01/02/2026", "valor": ""}]
        valores = ib.converter_sgs("IPCA", itens)
        self.assertEqual(valores, [ib.Valor("IPCA", date(2026, 1, 1), Decimal("0.16"))])

    def test_data_do_trimestre(self):
        self.assertEqual(ib.data_do_trimestre("202401"), date(2024, 1, 1))
        self.assertEqual(ib.data_do_trimestre("202404"), date(2024, 10, 1))
        with self.assertRaises(ValueError):
            ib.data_do_trimestre("202405")

    def test_sidra_pula_cabecalho_e_valores_ausentes(self):
        linhas = [{"D3C": "Trimestre", "V": "Valor"},
                  {"D3C": "202401", "V": "350000"},
                  {"D3C": "202402", "V": "..."},
                  {"D3C": "201004", "V": "100"}]
        valores = ib.converter_sidra("FBCF", linhas, date(2015, 1, 1))
        self.assertEqual(valores, [ib.Valor("FBCF", date(2024, 1, 1), Decimal("350000"))])

    def test_focus_anual_mantem_ano_corrente_e_seguinte(self):
        itens = [{"Data": "2026-10-02", "DataReferencia": "2026", "Mediana": 4.8},
                 {"Data": "2026-10-02", "DataReferencia": "2027", "Mediana": 4.1},
                 {"Data": "2026-10-02", "DataReferencia": "2029", "Mediana": 3.5}]
        refs = [e.referencia for e in ib.converter_focus_anual("IPCA", itens)]
        self.assertEqual(refs, ["2026", "2027"])

    def test_focus_12m(self):
        expectativas = ib.converter_focus_12m([{"Data": "2026-10-02", "Mediana": 4.35}])
        self.assertEqual(expectativas, [ib.Expectativa("IPCA", "12M", date(2026, 10, 2), Decimal("4.35"))])

    def test_sem_duplicados_mantem_ultimo(self):
        registros = [("a", 1), ("a", 2), ("b", 3)]
        self.assertEqual(ib.sem_duplicados(registros, lambda r: r[0]), [("a", 2), ("b", 3)])


class TestFormatosEPayload(unittest.TestCase):
    def test_decimal_br(self):
        self.assertEqual(ib.formatar_decimal_br(Decimal("5.4321")), "5,4321")
        self.assertEqual(ib.formatar_decimal_br(Decimal("277305")), "277305")

    def test_payload_preserva_precisao(self):
        linhas = ib.linhas_payload_valores([ib.Valor("USD", date(2026, 1, 2), Decimal("5.43210000"))], "agora")
        self.assertEqual(linhas[0]["valor"], "5.43210000")
        self.assertEqual(linhas[0]["data_referencia"], "2026-01-02")

    def test_ler_dotenv(self):
        with tempfile.TemporaryDirectory() as pasta:
            arquivo = Path(pasta) / ".env"
            arquivo.write_text('# comentário\nSUPABASE_URL="https://x.supabase.co"\nVAZIO=\nINVALIDA\n', encoding="utf-8")
            self.assertEqual(ib.ler_dotenv(arquivo), {"SUPABASE_URL": "https://x.supabase.co", "VAZIO": ""})

    def test_dotenv_inexistente(self):
        self.assertEqual(ib.ler_dotenv(Path("nao-existe/.env")), {})

    def test_csv_valores(self):
        with tempfile.TemporaryDirectory() as pasta:
            arquivo = Path(pasta) / "saida.csv"
            ib.gravar_csv_valores([ib.Valor("IPCA", date(2026, 1, 1), Decimal("0.16"))], arquivo)
            conteudo = arquivo.read_text(encoding="utf-8-sig").splitlines()
            self.assertEqual(conteudo, ["indicador;data_referencia;valor", "IPCA;01/01/2026;0,16"])


if __name__ == "__main__":
    unittest.main()
