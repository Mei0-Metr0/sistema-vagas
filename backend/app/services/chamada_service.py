from typing import Tuple, List, Dict, Optional
import pandas as pd
from domain.entities import (
    Candidato, Vagas, ChamadaResult, CandidatoCreate
)
from domain.enums import TipoCota, StatusCandidato
from repositories.in_memory_repository import InMemoryRepository
from core.exceptions import (
    NotFoundException, ValidationException
)

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

    def __init__(self, repository: InMemoryRepository):
        self.repo = repository

    def carregar_candidatos(self, candidatos: List[CandidatoCreate]) -> int:
        """Carrega candidatos no repositório e retorna o total carregado"""
        total = 0
        for candidato in candidatos:
            existing = self.repo.get_candidato_by_cpf(candidato.cpf)
            if not existing:
                self.repo.add_candidato(Candidato(**candidato.dict()))
                total += 1
        return total

    def definir_vagas(self, vagas: Vagas) -> None:
        """Define a quantidade de vagas para cada cota"""
        self.repo.set_vagas(vagas)

    def _ordenar_por_nota(self, candidatos: List[Candidato]) -> List[Candidato]:
        """Ordena candidatos por nota final (decrescente)"""
        return sorted(
            candidatos,
            key=lambda x: x.nota_final,
            reverse=True
        )

    def _filtrar_candidatos(
        self,
        candidatos: List[Candidato],
        passo: int
    ) -> List[Candidato]:
        """Filtra candidatos de acordo com o passo atual"""
        if passo == 1:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
            ]
        elif passo == 2:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota != TipoCota.AC
            ]
        elif passo == 3:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_PCD, TipoCota.LB_PCD]
            ]
        elif passo == 4:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_Q, TipoCota.LB_Q]
            ]
        elif passo == 5:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_PPI, TipoCota.LB_PPI]
            ]
        elif passo == 6:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI]
            ]
        elif passo == 7:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota == TipoCota.LB_PCD
            ]
        elif passo == 8:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota == TipoCota.LB_Q
            ]
        elif passo == 9:
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota == TipoCota.LB_PPI
            ]
        else:
            raise ValidationException(f"Passo {passo} inválido")

    def _executar_passo(
        self,
        passo: int,
        vagas_ofertadas: int,
        chamada_num: int
    ) -> Tuple[int, int, int, List[Candidato]]:
        """Executa um passo do processo de seleção"""
        candidatos = self.repo.list_candidatos()
        candidatos_ordenados = self._ordenar_por_nota(candidatos)
        candidatos_filtrados = self._filtrar_candidatos(candidatos_ordenados, passo)
        
        cota_selecionada = self.INDICE_PARA_COTA[passo-1]
        vagas_preenchidas = 0
        candidatos_atualizados = []
        
        for candidato in candidatos_filtrados[:vagas_ofertadas]:
            candidato.vaga_selecionada = cota_selecionada
            candidato.chamada = chamada_num
            candidato.status = StatusCandidato.SELECIONADO
            self.repo.update_candidato(candidato.id, candidato.dict())
            candidatos_atualizados.append(candidato)
            vagas_preenchidas += 1
        
        tamanho_lista = len(candidatos_filtrados)
        saldo_candidatos = tamanho_lista - vagas_ofertadas
        
        return vagas_preenchidas, tamanho_lista, saldo_candidatos

    def _ajustar_saldo_vagas(self, saldo_vagas: List[int]) -> List[int]:
        """Ajusta saldo de vagas redistribuindo déficits"""
        saldo_ajustado = saldo_vagas.copy()
        for i in range(len(saldo_ajustado)-2, -1, -1):
            if saldo_ajustado[i+1] < 0:
                saldo_ajustado[i] += saldo_ajustado[i+1]
                saldo_ajustado[i+1] = 0
        return saldo_ajustado

    def gerar_chamada(self, fator_multiplicacao: float = 1.0) -> ChamadaResult:
        """Gera uma nova chamada de seleção"""
        if not self.repo.list_candidatos():
            raise NotFoundException("Nenhum candidato carregado")
        
        vagas_originais = self.repo.get_vagas_originais()
        if not vagas_originais:
            raise ValidationException("Vagas não definidas")
        
        vagas_ajustadas = {
            cota: int(qtd * fator_multiplicacao)
            for cota, qtd in vagas_originais.dict().items()
        }
        
        saldo_vagas = [0] * 9
        tamanho_lista = [0] * 9
        vagas_selecionadas = [0] * 9
        chamada_num = self.repo.get_chamada_num()

        for passo in range(1, 10):
            (vagas_selecionadas[passo-1], 
             tamanho_lista[passo-1], 
             saldo_vagas[passo-1]) = self._executar_passo(
                passo, 
                vagas_ajustadas[self.INDICE_PARA_COTA[passo-1].value],
                chamada_num
            )

        saldo_ajustado = self._ajustar_saldo_vagas(saldo_vagas)

        for i in range(9):
            difference = saldo_vagas[i] - saldo_ajustado[i]
            if difference > 0:
                self._executar_passo(i+1, difference, chamada_num)

        candidatos_chamados = [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num
        ]

        return ChamadaResult(
            candidatos_chamados=candidatos_chamados,
            vagas_selecionadas={
                self.INDICE_PARA_COTA[i]: vagas_selecionadas[i] 
                for i in range(9)
            },
            saldo_vagas={
                self.INDICE_PARA_COTA[i]: saldo_ajustado[i] 
                for i in range(9)
            },
            tamanho_lista={
                self.INDICE_PARA_COTA[i]: tamanho_lista[i] 
                for i in range(9)
            },
            chamada_num=chamada_num
        )

    def marcar_nao_homologados(self, cpfs: List[str]) -> Dict[TipoCota, int]:
        """Marca candidatos como não homologados e recalcula vagas"""
        for cpf in cpfs:
            candidato = self.repo.get_candidato_by_cpf(cpf)
            if candidato:
                self.repo.update_candidato(candidato.id, {
                    "status": StatusCandidato.NAO_HOMOLOGADO,
                    "vaga_selecionada": None,
                    "chamada": None
                })
        
        return self._calcular_vagas_disponiveis()

    def _calcular_vagas_disponiveis(self) -> Dict[TipoCota, int]:
        """Calcula vagas disponíveis após não homologações"""
        vagas_originais = self.repo.get_vagas_originais()
        if not vagas_originais:
            raise ValidationException("Vagas não definidas")
        
        vagas_ocupadas = {cota: 0 for cota in TipoCota}
        candidatos = self.repo.list_candidatos()
        
        for cota in TipoCota:
            vagas_ocupadas[cota] = len([
                c for c in candidatos
                if c.vaga_selecionada == cota
                and c.status == StatusCandidato.SELECIONADO
            ])
        
        return {
            cota: max(0, getattr(vagas_originais, cota.value) - vagas_ocupadas[cota])
            for cota in TipoCota
        }

    def listar_candidatos_chamada(self, chamada_num: int) -> List[Candidato]:
        """Lista candidatos de uma chamada específica"""
        return [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num
        ]

    def listar_candidatos_por_status(self, status: StatusCandidato) -> List[Candidato]:
        """Lista candidatos por status"""
        return [
            c for c in self.repo.list_candidatos()
            if c.status == status
        ]

    def listar_todas_chamadas(self) -> Dict[int, List[Candidato]]:
        """Lista todas as chamadas realizadas"""
        candidatos = self.repo.list_candidatos()
        chamadas = {}
        
        for c in candidatos:
            if c.chamada is not None:
                if c.chamada not in chamadas:
                    chamadas[c.chamada] = []
                chamadas[c.chamada].append(c)
        
        return chamadas

    def get_vagas_disponiveis(self) -> Dict[TipoCota, int]:
        """Retorna as vagas disponíveis por cota"""
        return self._calcular_vagas_disponiveis()

    def reset_sistema(self) -> None:
        """Reseta todo o sistema (apenas para administração)"""
        self.repo.reset()