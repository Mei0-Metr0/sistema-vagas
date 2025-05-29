from typing import Tuple, List
import pandas as pd
from domain.entities import TipoCota, Candidato, ChamadaResult, Vagas

class ChamadaService:
    INDICE_PARA_COTA = {
        0: TipoCota.AC,
        1: TipoCota.LI_EP,
        2: TipoCota.LI_PCD,
        3: TipoCota.LI_Q,
        4: TipoCota.LI_PPI,
        5: TipoCota.LB_EP,
        6: TipoCota.LB_PCD,
        7: TipoCota.LB_Q,
        8: TipoCota.LB_PPI
    }

    def __init__(self):
        self.df = None
        self.vagas = Vagas()
        self.vagas_originais = None
        self.chamada_num = 1

    def carregar_dados(self, df: pd.DataFrame):
        required_columns = ['CPF', 'Nota Final', 'Cota do candidato']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"Colunas necessárias faltando: {required_columns}")
        
        df = df.copy()
        df['vagaSelecionada'] = df.get('vagaSelecionada', "")
        df['vagaGarantida'] = df.get('vagaGarantida', "")
        df['ch'] = df.get('ch', 0)
        
        self.df = df

    def definir_vagas(self, vagas: Vagas):
        self.vagas = vagas
        self.vagas_originais = vagas.copy()

    def _ordenar_por_nota_final(self, df: pd.DataFrame) -> pd.DataFrame:
        return df.sort_values(by='Nota Final', ascending=False).reset_index(drop=True)

    def _executar_passo(self, df: pd.DataFrame, passo: int, vagas_ofertadas: int, chamada: int) -> Tuple[int, int, int, pd.DataFrame]:
        df = df.copy()
        
        if 'vagaSelecionada' not in df.columns:
            df['vagaSelecionada'] = ""
        if 'vagaGarantida' not in df.columns:
            df['vagaGarantida'] = ""
        if 'ch' not in df.columns:
            df['ch'] = 0

        condicoes = {
            1: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == ""),
            2: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & (df['Cota do candidato'] != 'AC'),
            3: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & ((df['Cota do candidato'] == 'LI_PCD') | (df['Cota do candidato'] == 'LB_PCD')),
            4: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & ((df['Cota do candidato'] == 'LI_Q') | (df['Cota do candidato'] == 'LB_Q')),
            5: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & ((df['Cota do candidato'] == 'LI_PPI') | (df['Cota do candidato'] == 'LB_PPI')),
            6: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & ((df['Cota do candidato'] == 'LB_EP') | (df['Cota do candidato'] == 'LB_PCD') | (df['Cota do candidato'] == 'LB_Q') | (df['Cota do candidato'] == 'LB_PPI')),
            7: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & (df['Cota do candidato'] == 'LB_PCD'),
            8: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & (df['Cota do candidato'] == 'LB_Q'),
            9: (df['ch'] == 0) & (df['vagaSelecionada'] == "") & (df['vagaGarantida'] == "") & (df['Cota do candidato'] == 'LB_PPI')
        }

        condicao = condicoes.get(passo)
        if condicao is None:
            raise ValueError(f"Passo {passo} inválido")

        cota_selecionada = self.INDICE_PARA_COTA[passo-1].value
        indices_preencher = df[condicao].head(vagas_ofertadas).index
        tamanho_lista = len(df[condicao])
        
        df.loc[indices_preencher, 'vagaSelecionada'] = cota_selecionada
        df.loc[indices_preencher, 'ch'] = chamada
        
        vagas_preenchidas = len(indices_preencher)
        saldo_candidatos = tamanho_lista - vagas_ofertadas
        
        return vagas_preenchidas, tamanho_lista, saldo_candidatos, df

    def _ajustar_saldo_vagas(self, saldo_vagas: List[int]) -> List[int]:
        saldo_ajustado = saldo_vagas.copy()
        for i in range(len(saldo_ajustado)-2, -1, -1):
            if saldo_ajustado[i+1] < 0:
                saldo_ajustado[i] += saldo_ajustado[i+1]
                saldo_ajustado[i+1] = 0
        return saldo_ajustado

    def gerar_chamada(self, fator_multiplicacao: float = 1.0) -> ChamadaResult:
        if self.df is None or self.vagas_originais is None:
            raise ValueError("Dados ou vagas não configurados")

        df_ordenado = self._ordenar_por_nota_final(self.df)
        vagas_ajustadas = {k: int(v * fator_multiplicacao) for k, v in self.vagas.dict().items()}

        saldo_vagas = [0] * 9
        tamanho_lista = [0] * 9
        vagas_selecionadas = [0] * 9

        for passo in range(1, 10):
            (vagas_selecionadas[passo-1], 
             tamanho_lista[passo-1], 
             saldo_vagas[passo-1], 
             df_ordenado) = self._executar_passo(
                df_ordenado, passo, vagas_ajustadas[self.INDICE_PARA_COTA[passo-1].value], self.chamada_num
            )

        saldo_ajustado = self._ajustar_saldo_vagas(saldo_vagas)

        for i in range(9):
            difference = saldo_vagas[i] - saldo_ajustado[i]
            if difference > 0:
                _, _, _, df_ordenado = self._executar_passo(
                    df_ordenado, i+1, difference, self.chamada_num
                )

        self.df = df_ordenado

        candidatos_chamados = df_ordenado[df_ordenado['ch'] == self.chamada_num].to_dict('records')
        
        return ChamadaResult(
            candidatos_chamados=candidatos_chamados,
            vagas_selecionadas={self.INDICE_PARA_COTA[i]: vagas_selecionadas[i] for i in range(9)},
            saldo_vagas={self.INDICE_PARA_COTA[i]: saldo_ajustado[i] for i in range(9)},
            tamanho_lista={self.INDICE_PARA_COTA[i]: tamanho_lista[i] for i in range(9)}
        )

    def marcar_nao_homologados(self, cpfs_nao_homologados: List[str]) -> Vagas:
        if self.df is None or self.chamada_num == 0:
            raise ValueError("Nenhuma chamada gerada")

        for cpf in cpfs_nao_homologados:
            idx = self.df[self.df['CPF'] == cpf].index
            if len(idx) > 0:
                self.df.loc[idx, 'vagaSelecionada'] = ""
                self.df.loc[idx, 'vagaGarantida'] = "Não homologado"
                self.df.loc[idx, 'ch'] = 0

        vagas_disponiveis = self._calcular_vagas_disponiveis()
        self.vagas = vagas_disponiveis
        self.chamada_num += 1
        
        return vagas_disponiveis

    def _calcular_vagas_disponiveis(self) -> Vagas:
        vagas_ocupadas = {cota.value: 0 for cota in TipoCota}
        
        for cota in TipoCota:
            vagas_ocupadas[cota.value] = len(self.df[
                (self.df['vagaSelecionada'] == cota.value) & 
                (self.df['vagaGarantida'] != "Não homologado")
            ])
        
        return Vagas(**{
            cota.value: max(0, self.vagas_originais.dict()[cota.value] - vagas_ocupadas[cota.value])
            for cota in TipoCota
        })

    def exportar_chamada(self, chamada_num: int) -> pd.DataFrame:
        if self.df is None or 'ch' not in self.df.columns or self.df['ch'].max() < chamada_num:
            raise ValueError("Chamada não encontrada")
        
        return self.df[self.df['ch'] == chamada_num]