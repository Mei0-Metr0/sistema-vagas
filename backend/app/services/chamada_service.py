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
        self.repo.chamada_num = 1

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

        candidatos_elegiveis_geral = [
            c for c in candidatos
            if c.chamada is None
            and c.vaga_selecionada is None
            and c.status == StatusCandidato.PENDENTE
        ]

        if passo == 1: # AC
            return candidatos_elegiveis_geral
        elif passo == 2: # LI_EP (Apenas cotistas concorrem aqui)
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota != TipoCota.AC
            ]
        elif passo == 3: # LI_PCD
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota in [TipoCota.LI_PCD, TipoCota.LB_PCD] # Candidatos de LB_PCD podem concorrer aqui
            ]
        elif passo == 4: # LI_Q
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota in [TipoCota.LI_Q, TipoCota.LB_Q] # Candidatos de LB_Q podem concorrer aqui
            ]
        elif passo == 5: # LI_PPI
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota in [TipoCota.LI_PPI, TipoCota.LB_PPI] # Candidatos de LB_PPI podem concorrer aqui
            ]
        elif passo == 6: # LB_EP (todos de baixa renda)
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota in [TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI]
            ]
        elif passo == 7: # LB_PCD (específico baixa renda PCD)
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota == TipoCota.LB_PCD
            ]
        elif passo == 8: # LB_Q (específico baixa renda Quilombola)
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota == TipoCota.LB_Q
            ]
        elif passo == 9: # LB_PPI (específico baixa renda Preto Parto Indigena)
            return [
                c for c in candidatos_elegiveis_geral
                if c.cota == TipoCota.LB_PPI
            ]
        else:
            raise ValidationException(f"Passo {passo} inválido")

    def _executar_passo(
        self,
        cota_alvo_do_passo: TipoCota, 
        vagas_ofertadas_para_cota_do_passo: int,
        chamada_num: int,
        candidatos_ordenados_e_filtrados_para_passo: List[Candidato] 
    ) -> int:
        """Executa um passo do processo de seleção"""
        vagas_preenchidas_neste_passo = 0
        
        for candidato in candidatos_ordenados_e_filtrados_para_passo:
            if candidato.vaga_selecionada is None and candidato.status == StatusCandidato.PENDENTE and candidato.chamada is None:
                if vagas_preenchidas_neste_passo < vagas_ofertadas_para_cota_do_passo:
                    candidato.vaga_selecionada = cota_alvo_do_passo
                    candidato.chamada = chamada_num
                    candidato.status = StatusCandidato.SELECIONADO
            
                    self.repo.update_candidato(candidato.id, candidato.dict(exclude_unset=True))
                    vagas_preenchidas_neste_passo += 1
                else:
                    break
        
        return vagas_preenchidas_neste_passo
    
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
        
        vagas_base_para_calculo_oferta = self.repo.get_vagas() 
        if not vagas_base_para_calculo_oferta or sum(vagas_base_para_calculo_oferta.dict().values()) == 0:
             vagas_base_para_calculo_oferta = self.repo.get_vagas_originais()
             if not vagas_base_para_calculo_oferta:
                raise ValidationException("Vagas não definidas. Defina as vagas na primeira etapa.")

        chamada_num = self.repo.get_chamada_num()

        vagas_ofertadas_nesta_chamada = {
            cota: int(getattr(vagas_base_para_calculo_oferta, cota.value, 0) * fator_multiplicacao)
            for cota in TipoCota
        }
        
        saldo_vagas_passos = [0] * len(self.INDICE_PARA_COTA)  
        tamanho_lista_passos = [0] * len(self.INDICE_PARA_COTA) 
        vagas_preenchidas_passos = [0] * len(self.INDICE_PARA_COTA) 

        candidatos_todos_do_repo = self.repo.list_candidatos()
        candidatos_ordenados_globalmente = self._ordenar_por_nota(candidatos_todos_do_repo)

        for passo_idx in range(len(self.INDICE_PARA_COTA)):
            passo_num = passo_idx + 1
            cota_do_passo_atual = self.INDICE_PARA_COTA[passo_idx]
            
            candidatos_filtrados_para_este_passo = self._filtrar_candidatos(candidatos_ordenados_globalmente, passo_num)
            tamanho_lista_passos[passo_idx] = len(candidatos_filtrados_para_este_passo)
            
            vagas_para_ofertar_na_cota_do_passo = vagas_ofertadas_nesta_chamada.get(cota_do_passo_atual, 0) # Usar .get com default
            
            if vagas_para_ofertar_na_cota_do_passo > 0 and tamanho_lista_passos[passo_idx] > 0 :
                v_preenchidas = self._executar_passo(
                    cota_alvo_do_passo=cota_do_passo_atual,
                    vagas_ofertadas_para_cota_do_passo=vagas_para_ofertar_na_cota_do_passo,
                    chamada_num=chamada_num,
                    candidatos_ordenados_e_filtrados_para_passo=candidatos_filtrados_para_este_passo
                )
                vagas_preenchidas_passos[passo_idx] = v_preenchidas
                saldo_vagas_passos[passo_idx] = vagas_para_ofertar_na_cota_do_passo - v_preenchidas 
            else:
                vagas_preenchidas_passos[passo_idx] = 0
                saldo_vagas_passos[passo_idx] = vagas_para_ofertar_na_cota_do_passo 

        saldo_candidatos_vs_oferta_list = []
        for i in range(len(self.INDICE_PARA_COTA)):
            cota_atual_enum = self.INDICE_PARA_COTA[i]
            oferta_para_cota = vagas_ofertadas_nesta_chamada.get(cota_atual_enum, 0)
            saldo_candidatos_vs_oferta_list.append(tamanho_lista_passos[i] - oferta_para_cota)
        
        saldo_candidatos_vs_oferta_ajustado_list = self._ajustar_saldo_vagas(saldo_candidatos_vs_oferta_list)

        saldo_candidatos_chamada_atual_dict = {
            self.INDICE_PARA_COTA[i]: saldo_candidatos_vs_oferta_list[i] 
            for i in range(len(self.INDICE_PARA_COTA))
        }
        saldo_candidatos_chamada_atual_ajustado_dict = {
            self.INDICE_PARA_COTA[i]: saldo_candidatos_vs_oferta_ajustado_list[i] 
            for i in range(len(self.INDICE_PARA_COTA))
        }

        novo_saldo_repo = Vagas()
        vagas_disponiveis_inicio_chamada = self.repo.get_vagas()

        for i, cota_enum_vaga_preenchida in self.INDICE_PARA_COTA.items():
            vagas_cota_inicio_chamada = getattr(vagas_disponiveis_inicio_chamada, cota_enum_vaga_preenchida.value, 0)
            preenchidas_nesta_cota_nesta_chamada = vagas_preenchidas_passos[i] 
            saldo_final_para_cota = max(0, vagas_cota_inicio_chamada - preenchidas_nesta_cota_nesta_chamada)
            setattr(novo_saldo_repo, cota_enum_vaga_preenchida.value, saldo_final_para_cota)
        
        self.repo.set_vagas(novo_saldo_repo)

        candidatos_chamados_nesta_rodada = [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO
        ]
        
        vagas_selecionadas_dict = {self.INDICE_PARA_COTA[i]: vagas_preenchidas_passos[i] for i in range(len(self.INDICE_PARA_COTA))}
        tamanho_lista_dict = {self.INDICE_PARA_COTA[i]: tamanho_lista_passos[i] for i in range(len(self.INDICE_PARA_COTA))}

        return ChamadaResult(
            candidatos_chamados=candidatos_chamados_nesta_rodada,
            vagas_selecionadas=vagas_selecionadas_dict,
            saldo_remanescente_proxima_chamada=novo_saldo_repo.dict(),
            tamanho_lista=tamanho_lista_dict,
            chamada_num=chamada_num,
            saldo_candidatos_chamada_atual=saldo_candidatos_chamada_atual_dict,
            saldo_candidatos_chamada_atual_ajustado=saldo_candidatos_chamada_atual_ajustado_dict
        )

    def marcar_nao_homologados(self, cpfs: List[str]) -> List[Dict[str, Any]]:
        """Marca candidatos como não homologados e recalcula vagas para a próxima chamada."""
        vagas_liberadas_por_cota_da_vaga: Dict[TipoCota, int] = {cota: 0 for cota in TipoCota}

        ultima_chamada_com_selecionados = 0
        if self.repo.list_candidatos():
             numeros_chamadas_com_selecionados = {
                c.chamada for c in self.repo.list_candidatos() 
                if c.status == StatusCandidato.SELECIONADO and c.chamada is not None
            }
             if numeros_chamadas_com_selecionados:
                 ultima_chamada_com_selecionados = max(numeros_chamadas_com_selecionados)


        for cpf in cpfs:
            candidato = self.repo.get_candidato_by_cpf(cpf)
            if candidato:
                if candidato.status == StatusCandidato.SELECIONADO and candidato.chamada == ultima_chamada_com_selecionados:
                    cota_onde_foi_selecionado = candidato.vaga_selecionada
                    
                    candidato.status = StatusCandidato.NAO_HOMOLOGADO
                    candidato.vaga_selecionada = None 
                    
                    self.repo.update_candidato(candidato.id, {
                        "status": StatusCandidato.NAO_HOMOLOGADO, 
                        "vaga_selecionada": None,
                    })
                    if cota_onde_foi_selecionado:
                        vagas_liberadas_por_cota_da_vaga[cota_onde_foi_selecionado] +=1

        vagas_saldo_atual_repo = self.repo.get_vagas() 
        novo_saldo_com_liberadas = vagas_saldo_atual_repo.copy()

        for cota, qtd_liberada in vagas_liberadas_por_cota_da_vaga.items():
            if qtd_liberada > 0:
                valor_atual_na_cota = getattr(novo_saldo_com_liberadas, cota.value, 0)
                setattr(novo_saldo_com_liberadas, cota.value, valor_atual_na_cota + qtd_liberada)
        
        self.repo.set_vagas(novo_saldo_com_liberadas)
        
        self.repo.increment_chamada_num() 

        return self._calcular_vagas_disponiveis_formatado()

    def _calcular_vagas_disponiveis_formatado(self) -> List[Dict[str, Any]]:
        """Calcula vagas disponíveis após não homologações"""
        vagas_saldo_atual_repo = self.repo.get_vagas()
        vagas_originais_edital = self.repo.get_vagas_originais()

        if not vagas_originais_edital:
            vagas_originais_edital = Vagas()

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
        candidatos_chamada = [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO
        ]
        if not candidatos_chamada and chamada_num > 0 :
            pass
        return candidatos_chamada

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
        if not self.repo.get_vagas_originais():
            raise ValidationException("Vagas não definidas.")
        return self._calcular_vagas_disponiveis_formatado()

    def reset_sistema(self) -> None:
        """Reseta todo o sistema (apenas para administração)"""
        self.repo.reset()