from typing import Tuple, List, Dict, Any
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
        if passo == 1: # AC
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
            ]
        elif passo == 2: # LI_EP (todos exceto AC que já foram em AC)
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota != TipoCota.AC
            ]
        elif passo == 3: # LI_PCD
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_PCD, TipoCota.LB_PCD] # Candidatos de LB_PCD podem concorrer aqui
            ]
        elif passo == 4: # LI_Q
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_Q, TipoCota.LB_Q] # Candidatos de LB_Q podem concorrer aqui
            ]
        elif passo == 5: # LI_PPI
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LI_PPI, TipoCota.LB_PPI] # Candidatos de LB_PPI podem concorrer aqui
            ]
        elif passo == 6: # LB_EP (todos de baixa renda)
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota in [TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI]
            ]
        elif passo == 7: # LB_PCD (específico baixa renda PCD)
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota == TipoCota.LB_PCD
            ]
        elif passo == 8: # LB_Q (específico baixa renda Quilombola)
            return [
                c for c in candidatos
                if c.chamada is None
                and c.vaga_selecionada is None
                and c.status == StatusCandidato.PENDENTE
                and c.cota == TipoCota.LB_Q
            ]
        elif passo == 9: # LB_PPI (específico baixa renda PPI)
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
        candidatos_todos = self.repo.list_candidatos()
        candidatos_ordenados = self._ordenar_por_nota(candidatos_todos)
        
        # Filtragem específica para o passo, considerando apenas candidatos pendentes e não chamados
        candidatos_filtrados_para_passo = self._filtrar_candidatos(candidatos_ordenados, passo)
        
        cota_alvo_do_passo = self.INDICE_PARA_COTA[passo-1]
        vagas_preenchidas_neste_passo = 0
        candidatos_selecionados_neste_passo = []
        
        for candidato in candidatos_filtrados_para_passo:
            if vagas_preenchidas_neste_passo < vagas_ofertadas:
                if candidato.vaga_selecionada is None and candidato.status == StatusCandidato.PENDENTE:
                        candidato.vaga_selecionada = cota_alvo_do_passo
                        candidato.chamada = chamada_num
                        candidato.status = StatusCandidato.SELECIONADO
        
                        self.repo.update_candidato(candidato.id, candidato.dict(exclude_unset=True))
                        candidatos_selecionados_neste_passo.append(candidato)
                        vagas_preenchidas_neste_passo += 1
            else:
                break

        tamanho_lista_considerada_para_passo = len(candidatos_filtrados_para_passo)
        saldo_candidatos_para_passo = tamanho_lista_considerada_para_passo - vagas_preenchidas_neste_passo
        
        return vagas_preenchidas_neste_passo, tamanho_lista_considerada_para_passo, saldo_candidatos_para_passo

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
            raise NotFoundException("Nenhum candidato carregado. Faça o upload do CSV primeiro.")
        
        vagas_base = self.repo.get_vagas() 
        if not vagas_base or sum(vagas_base.dict().values()) == 0:
             vagas_base = self.repo.get_vagas_originais()
             if not vagas_base:
                raise ValidationException("Vagas não definidas. Defina as vagas na primeira etapa.")

        chamada_num = self.repo.get_chamada_num()

        vagas_ofertadas_nesta_chamada = {
            cota: int(getattr(vagas_base, cota.value) * fator_multiplicacao)
            for cota in TipoCota
        }
        
        saldo_vagas_passos = [0] * 9 
        tamanho_lista_passos = [0] * 9 
        vagas_preenchidas_passos = [0] * 9 

        for passo_idx in range(len(self.INDICE_PARA_COTA)):
            passo_num = passo_idx + 1
            cota_do_passo = self.INDICE_PARA_COTA[passo_idx]
            
            vagas_para_cota_nesta_chamada = vagas_ofertadas_nesta_chamada[cota_do_passo]
            
            if vagas_para_cota_nesta_chamada > 0:
                (v_preenchidas, t_lista, s_candidatos) = self._executar_passo(
                    passo_num, 
                    vagas_para_cota_nesta_chamada,
                    chamada_num
                )
                vagas_preenchidas_passos[passo_idx] = v_preenchidas
                tamanho_lista_passos[passo_idx] = t_lista
                saldo_vagas_passos[passo_idx] = vagas_para_cota_nesta_chamada - v_preenchidas 
            else:
                vagas_preenchidas_passos[passo_idx] = 0
                tamanho_lista_passos[passo_idx] = 0 
                saldo_vagas_passos[passo_idx] = 0

        novo_saldo_repo = Vagas()
        vagas_originais_repo = self.repo.get_vagas_originais()

        for i, cota_enum in self.INDICE_PARA_COTA.items():
            vagas_iniciais_para_cota = getattr(vagas_base, cota_enum.value, 0)
            vagas_preenchidas_para_cota = vagas_preenchidas_passos[i]
            saldo_para_proxima_chamada = max(0, vagas_iniciais_para_cota - vagas_preenchidas_para_cota)
            setattr(novo_saldo_repo, cota_enum.value, saldo_para_proxima_chamada)
        
        self.repo.set_vagas(novo_saldo_repo)

        candidatos_chamados_nesta_rodada = [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO
        ]
        
        vagas_selecionadas_dict = {self.INDICE_PARA_COTA[i]: vagas_preenchidas_passos[i] for i in range(9)}
        saldo_vagas_dict = novo_saldo_repo.dict()
        tamanho_lista_dict = {self.INDICE_PARA_COTA[i]: tamanho_lista_passos[i] for i in range(9)}

        return ChamadaResult(
            candidatos_chamados=candidatos_chamados_nesta_rodada,
            vagas_selecionadas=vagas_selecionadas_dict,
            saldo_vagas=saldo_vagas_dict,
            tamanho_lista=tamanho_lista_dict,
            chamada_num=chamada_num
        )

    def marcar_nao_homologados(self, cpfs: List[str]) -> List[Dict[str, Any]]:
        """Marca candidatos como não homologados e recalcula vagas"""
        vagas_liberadas_por_cota: Dict[TipoCota, int] = {cota: 0 for cota in TipoCota}
        chamada_atual_num = self.repo.get_chamada_num()

        for cpf in cpfs:
            candidato = self.repo.get_candidato_by_cpf(cpf)
            if candidato:
                if candidato.status == StatusCandidato.SELECIONADO and candidato.chamada == chamada_atual_num:
                    cota_onde_foi_selecionado = candidato.vaga_selecionada
                    
                    candidato.status = StatusCandidato.NAO_HOMOLOGADO
                    candidato.vaga_selecionada = None
                    
                    self.repo.update_candidato(candidato.id, {
                        "status": StatusCandidato.NAO_HOMOLOGADO, 
                        "vaga_selecionada": None, 
                        # "chamada": None # Opcional: remove da chamada específica
                    })
                    if cota_onde_foi_selecionado:
                        vagas_liberadas_por_cota[cota_onde_foi_selecionado] +=1

        vagas_atuais_repo = self.repo.get_vagas()
        novas_vagas_repo = vagas_atuais_repo.copy()

        for cota, qtd_liberada in vagas_liberadas_por_cota.items():
            valor_atual = getattr(novas_vagas_repo, cota.value)
            setattr(novas_vagas_repo, cota.value, valor_atual + qtd_liberada)
        
        self.repo.set_vagas(novas_vagas_repo)
        self.repo.increment_chamada_num()

        return self._calcular_vagas_disponiveis_formatado()

    def _calcular_vagas_disponiveis_formatado(self) -> List[Dict[str, Any]]:
        """Calcula vagas disponíveis após não homologações"""
        vagas_saldo_atual_repo = self.repo.get_vagas()
        vagas_originais_edital = self.repo.get_vagas_originais()

        if not vagas_originais_edital:
            raise ValidationException("Vagas não definidas. Não é possível formatar vagas disponíveis.")

        formatted_list = []
        for cota_enum in TipoCota:
            cota_str = cota_enum.value
            originais = getattr(vagas_originais_edital, cota_str, 0)
            disponiveis_para_proxima = getattr(vagas_saldo_atual_repo, cota_str, 0)
            formatted_list.append({
                "Cota": cota_str,
                "Vagas Originais": originais, 
                "Vagas Disponíveis": disponiveis_para_proxima 
            })
        return formatted_list

    def listar_candidatos_chamada(self, chamada_num: int) -> List[Candidato]:
        """Lista candidatos de uma chamada específica que foram SELECIONADOS"""
        return [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO
        ]

    def listar_candidatos_por_status(self, status: StatusCandidato) -> List[Candidato]:
        """Lista candidatos por status"""
        return [
            c for c in self.repo.list_candidatos()
            if c.status == status
        ]

    def listar_todas_chamadas(self) -> Dict[int, List[Candidato]]:
        """Lista todas as chamadas realizadas com candidatos SELECIONADOS"""
        candidatos = self.repo.list_candidatos()
        chamadas = {}
        
        for c in candidatos:
            if c.chamada is not None and c.status == StatusCandidato.SELECIONADO:
                if c.chamada not in chamadas:
                    chamadas[c.chamada] = []
                chamadas[c.chamada].append(c)
        
        return chamadas

    def get_vagas_disponiveis(self) -> List[Dict[str, Any]]:
        """Retorna as vagas disponíveis (saldo atual) por cota no formato de lista de dicionários."""
        return self._calcular_vagas_disponiveis_formatado()

    def reset_sistema(self) -> None:
        """Reseta todo o sistema (apenas para administração)"""
        self.repo.reset()