from typing import List, Dict, Any, Tuple
from collections import defaultdict
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
        0: TipoCota.AC, 1: TipoCota.LI_EP, 2: TipoCota.LI_PCD, 3: TipoCota.LI_Q, 4: TipoCota.LI_PPI,
        5: TipoCota.LB_EP, 6: TipoCota.LB_PCD, 7: TipoCota.LB_Q, 8: TipoCota.LB_PPI
    }

    PRIORIDADE_PREENCHIMENTO = {
        TipoCota.LB_PPI: [TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_PCD, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LB_Q: [TipoCota.LB_PPI, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_PCD, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LB_PCD: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_Q, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LB_EP: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LI_EP, TipoCota.LI_PPI, TipoCota.LI_Q, TipoCota.LI_PCD, TipoCota.AC],
        TipoCota.LI_PPI: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_Q, TipoCota.LI_PCD, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LI_Q: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_PCD, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LI_PCD: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_Q, TipoCota.LI_EP, TipoCota.AC],
        TipoCota.LI_EP: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_Q, TipoCota.LI_PCD, TipoCota.AC],
        TipoCota.AC: [TipoCota.LB_PPI, TipoCota.LB_Q, TipoCota.LB_PCD, TipoCota.LB_EP, TipoCota.LI_PPI, TipoCota.LI_PCD, TipoCota.LI_EP]
    }

    COTA_PARA_PASSO = {v: k + 1 for k, v in INDICE_PARA_COTA.items()}

    def __init__(self, repository: InMemoryRepository):
        self.repo = repository

    def carregar_candidatos(self, candidatos: List[CandidatoCreate]) -> int:
        total = 0
        for candidato_data in candidatos:
            self.repo.add_candidato(Candidato(**candidato_data.model_dump()))
            total += 1
        return total

    def aplicar_filtro_candidatos(self, campus: str, curso: str, turno: str) -> int:
        if not self.repo.list_candidatos():
            raise ValidationException("Nenhum candidato carregado para aplicar o filtro.")
        self.repo.set_view_context(campus, curso, turno)
        candidatos_no_contexto = [
            c for c in self.repo.list_candidatos()
            if c.campus == campus and c.curso == curso and c.turno == turno
        ]
        if not candidatos_no_contexto:
            raise NotFoundException(f"Nenhum candidato encontrado para o filtro: Campus='{campus}', Curso='{curso}', Turno='{turno}'.")
        return len(candidatos_no_contexto)

    def definir_vagas(self, vagas: Vagas) -> None:
        context = self.repo.get_view_context()
        if not context:
            raise ValidationException("Filtro de curso não foi aplicado. Aplique um filtro antes de definir as vagas.")
        curso_key = (context['campus'], context['curso'], context['turno'])
        self.repo.set_vagas_para_curso(curso_key, vagas)
        if self.repo.get_chamada_num() > 1: return
        self.repo.chamada_num = 1

    def _ordenar_por_nota(self, candidatos: List[Candidato]) -> List[Candidato]:
        return sorted(candidatos, key=lambda c: c.nota_final, reverse=True)

    def _filtrar_candidatos_para_passo(self, candidatos_do_curso: List[Candidato], passo: int, cpfs_ja_selecionados: set, ignore_status: bool = False) -> List[Candidato]:
        if ignore_status:
            candidatos_elegiveis = [
                c for c in candidatos_do_curso
                if c.cpf not in cpfs_ja_selecionados
            ]
        else:
            candidatos_elegiveis = [
                c for c in candidatos_do_curso
                if c.status == StatusCandidato.PENDENTE and c.cpf not in cpfs_ja_selecionados
            ]

        if passo == 1: return candidatos_elegiveis
        elif passo == 2: return [c for c in candidatos_elegiveis if c.cota != TipoCota.AC]
        elif passo == 3: return [c for c in candidatos_elegiveis if c.cota in [TipoCota.LI_PCD, TipoCota.LB_PCD]]
        elif passo == 4: return [c for c in candidatos_elegiveis if c.cota in [TipoCota.LI_Q, TipoCota.LB_Q]]
        elif passo == 5: return [c for c in candidatos_elegiveis if c.cota in [TipoCota.LI_PPI, TipoCota.LB_PPI]]
        elif passo == 6: return [c for c in candidatos_elegiveis if c.cota in [TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI]]
        elif passo == 7: return [c for c in candidatos_elegiveis if c.cota == TipoCota.LB_PCD]
        elif passo == 8: return [c for c in candidatos_elegiveis if c.cota == TipoCota.LB_Q]
        elif passo == 9: return [c for c in candidatos_elegiveis if c.cota == TipoCota.LB_PPI]
        else: raise ValidationException(f"Passo {passo} inválido")

    def _executar_passo(self, cota_alvo_do_passo: TipoCota, vagas_ofertadas: int, chamada_num: int, candidatos_para_passo: List[Candidato], cpfs_ja_selecionados_nesta_chamada: set) -> int:
        vagas_preenchidas = 0
        for candidato in candidatos_para_passo:
            if vagas_preenchidas >= vagas_ofertadas: break
            if candidato.cpf not in cpfs_ja_selecionados_nesta_chamada:
                self.repo.update_candidato(candidato.id, {"status": StatusCandidato.SELECIONADO, "vaga_selecionada": cota_alvo_do_passo, "chamada": chamada_num})
                cpfs_ja_selecionados_nesta_chamada.add(candidato.cpf)
                vagas_preenchidas += 1
        return vagas_preenchidas

    def _ajustar_saldo_vagas(self, saldo_vagas: List[int]) -> List[int]:
        saldo_ajustado = saldo_vagas.copy()
        for i in range(len(saldo_ajustado)-2, -1, -1):
            if saldo_ajustado[i+1] < 0:
                saldo_ajustado[i] += saldo_ajustado[i+1]
                saldo_ajustado[i+1] = 0
        return saldo_ajustado

    def _calcular_classificacao_por_cota(self, candidatos_do_curso: List[Candidato]) -> Dict[str, Dict[str, int]]:
        classificacoes: Dict[str, Dict[str, int]] = defaultdict(dict)

        ELIGIBILITY_FOR_RANKING = {
            TipoCota.AC: [TipoCota.AC, TipoCota.LI_EP, TipoCota.LI_PCD, TipoCota.LI_Q, TipoCota.LI_PPI, TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI],
            TipoCota.LI_EP: [TipoCota.LI_EP, TipoCota.LI_PCD, TipoCota.LI_Q, TipoCota.LI_PPI, TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI],
            TipoCota.LI_PCD: [TipoCota.LI_PCD, TipoCota.LB_PCD],
            TipoCota.LI_Q: [TipoCota.LI_Q, TipoCota.LB_Q],
            TipoCota.LI_PPI: [TipoCota.LI_PPI, TipoCota.LB_PPI],
            TipoCota.LB_EP: [TipoCota.LB_EP, TipoCota.LB_PCD, TipoCota.LB_Q, TipoCota.LB_PPI],
            TipoCota.LB_PCD: [TipoCota.LB_PCD],
            TipoCota.LB_Q: [TipoCota.LB_Q],
            TipoCota.LB_PPI: [TipoCota.LB_PPI],
        }

        for target_cota, eligible_source_cotas in ELIGIBILITY_FOR_RANKING.items():
            candidatos_para_ranking = sorted([c for c in candidatos_do_curso if c.cota in eligible_source_cotas], key=lambda c: c.nota_final, reverse=True)
            class_key = f"class_{target_cota.value}"
            for i, cand in enumerate(candidatos_para_ranking):
                if cand.cpf not in classificacoes: classificacoes[cand.cpf] = {}
                classificacoes[cand.cpf][class_key] = i + 1
                
        return classificacoes

    def gerar_chamada(self, fator_multiplicacao: int = 1) -> ChamadaResult:
        if not self.repo.list_candidatos(): raise NotFoundException("Nenhum candidato carregado.")
        view_context = self.repo.get_view_context()
        if not view_context: raise ValidationException("Nenhum curso foi selecionado. Aplique um filtro primeiro.")

        chamada_num = self.repo.get_chamada_num()
        cpfs_ja_selecionados = {c.cpf for c in self.repo.list_candidatos() if c.status == StatusCandidato.SELECIONADO}
        
        candidatos_por_curso = defaultdict(list)
        for cand in self.repo.list_candidatos():
            if (cand.campus == view_context['campus'] and cand.curso == view_context['curso'] and cand.turno == view_context['turno']):
                candidatos_por_curso[(cand.campus, cand.curso, cand.turno)].append(cand)

        candidatos_do_curso_completo = candidatos_por_curso.get((view_context['campus'], view_context['curso'], view_context['turno']), [])
        classificacoes_por_cpf = self._calcular_classificacao_por_cota(candidatos_do_curso_completo)

        for fase in [1, 2]:
            for curso_key, candidatos_do_curso in candidatos_por_curso.items():
                vagas_obj = self.repo.get_vagas_para_curso(curso_key)
                if not vagas_obj: continue
                candidatos_da_fase = [c for c in candidatos_do_curso if c.opcao == fase]
                candidatos_ordenados = self._ordenar_por_nota(candidatos_da_fase)
                self._processar_chamada_para_curso(curso_key, candidatos_ordenados, cpfs_ja_selecionados, fator_multiplicacao)

        candidatos_contexto_final = [c for c in self.repo.list_candidatos() if c.campus == view_context['campus'] and c.curso == view_context['curso'] and c.turno == view_context['turno']]
        for cand in candidatos_contexto_final:
            update_data = {}
            for cota_enum in TipoCota:
                cota_str = cota_enum.value
                class_key = f"class_{cota_str}"
                if cand.cpf in classificacoes_por_cpf and class_key in classificacoes_por_cpf[cand.cpf]:
                    update_data[class_key] = classificacoes_por_cpf[cand.cpf][class_key]
                else:
                    update_data[class_key] = None
            if update_data: self.repo.update_candidato(cand.id, update_data)

        return self._montar_resultado_para_contexto(view_context, chamada_num, fator_multiplicacao)

    def _processar_chamada_para_curso(self, curso_key, candidatos_ordenados, cpfs_ja_selecionados, fator_multiplicacao):
        chamada_num = self.repo.get_chamada_num()
        vagas_obj = self.repo.get_vagas_para_curso(curso_key)
        if not vagas_obj: return

        vagas_ofertadas = {c: int(getattr(vagas_obj, c.value, 0) * fator_multiplicacao) for c in TipoCota}
        vagas_preenchidas_na_cota = defaultdict(int)

        for passo_idx in range(len(self.INDICE_PARA_COTA)):
            passo_num = passo_idx + 1
            cota_alvo = self.INDICE_PARA_COTA[passo_idx]
            vagas_para_ofertar = vagas_ofertadas.get(cota_alvo, 0)
            if vagas_para_ofertar <= 0: continue

            candidatos_para_passo = self._filtrar_candidatos_para_passo(candidatos_ordenados, passo_num, cpfs_ja_selecionados)
            preenchidas = self._executar_passo(cota_alvo, vagas_para_ofertar - vagas_preenchidas_na_cota[cota_alvo], chamada_num, candidatos_para_passo, cpfs_ja_selecionados)
            vagas_preenchidas_na_cota[cota_alvo] += preenchidas

            remanescentes = vagas_para_ofertar - vagas_preenchidas_na_cota[cota_alvo]
            if remanescentes > 0:
                lista_prioridades = self.PRIORIDADE_PREENCHIMENTO.get(cota_alvo, [])
                for cota_fallback in lista_prioridades:
                    if remanescentes <= 0: break
                    cands_fallback = [c for c in candidatos_ordenados if c.cota == cota_fallback and c.cpf not in cpfs_ja_selecionados]
                    preenchidas_fallback = self._executar_passo(cota_alvo, remanescentes, chamada_num, cands_fallback, cpfs_ja_selecionados)
                    vagas_preenchidas_na_cota[cota_alvo] += preenchidas_fallback
                    remanescentes -= preenchidas_fallback
        
        saldo_atual = self.repo.get_vagas_para_curso(curso_key)
        if saldo_atual:
            novo_saldo_dict = saldo_atual.model_dump()
            for cota, preenchidas in vagas_preenchidas_na_cota.items():
                novo_saldo_dict[cota.value] = max(0, novo_saldo_dict[cota.value] - preenchidas)
            self.repo.set_vagas_para_curso(curso_key, Vagas(**novo_saldo_dict))

    def _montar_resultado_para_contexto(self, context: Dict[str, str], chamada_num: int, fator_multiplicacao: int) -> ChamadaResult:
        campus, curso, turno = context['campus'], context['curso'], context['turno']
        curso_key = (campus, curso, turno)

        candidatos_chamados_no_contexto = [
            c for c in self.repo.list_candidatos()
            if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO and
            c.campus == campus and c.curso == curso and c.turno == turno
        ]

        vagas_selecionadas_dict = defaultdict(int)
        for cand in candidatos_chamados_no_contexto:
            if cand.vaga_selecionada:
                vagas_selecionadas_dict[cand.vaga_selecionada] += 1
        
        saldo_remanescente_obj = self.repo.get_vagas_para_curso(curso_key) or Vagas()
        
        tamanho_lista_dict = {}
        candidatos_do_curso_total = [c for c in self.repo.list_candidatos() if c.campus == campus and c.curso == curso and c.turno == turno]
        candidatos_ordenados = self._ordenar_por_nota(candidatos_do_curso_total)
        for i in range(len(self.INDICE_PARA_COTA)):
            passo_num = i + 1
            cota_alvo = self.INDICE_PARA_COTA[i]
            lista_passo = self._filtrar_candidatos_para_passo(candidatos_ordenados, passo_num, set(), ignore_status=True)
            tamanho_lista_dict[cota_alvo] = len(lista_passo)

        saldo_candidatos_vs_oferta_list = []
        vagas_originais = self.repo.get_vagas_originais_para_curso(curso_key) or Vagas()
        for i in range(len(self.INDICE_PARA_COTA)):
            cota_atual = self.INDICE_PARA_COTA[i]
            oferta_para_cota = int(getattr(vagas_originais, cota_atual.value, 0) * fator_multiplicacao)
            tamanho_lista = tamanho_lista_dict.get(cota_atual, 0)
            saldo_candidatos_vs_oferta_list.append(tamanho_lista - oferta_para_cota)
        
        saldo_candidatos_vs_oferta_ajustado_list = self._ajustar_saldo_vagas(saldo_candidatos_vs_oferta_list)

        saldo_candidatos_chamada_atual_dict = {self.INDICE_PARA_COTA[i]: saldo_candidatos_vs_oferta_list[i] for i in range(len(self.INDICE_PARA_COTA))}
        saldo_candidatos_chamada_atual_ajustado_dict = {self.INDICE_PARA_COTA[i]: saldo_candidatos_vs_oferta_ajustado_list[i] for i in range(len(self.INDICE_PARA_COTA))}

        candidatos_do_curso_para_retorno = [
            c for c in self.repo.list_candidatos()
            if c.campus == campus and c.curso == curso and c.turno == turno and c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO
        ]

        return ChamadaResult(
            candidatos_chamados=candidatos_do_curso_para_retorno,
            vagas_selecionadas=dict(vagas_selecionadas_dict),
            saldo_remanescente_proxima_chamada=saldo_remanescente_obj.model_dump(),
            tamanho_lista=tamanho_lista_dict,
            chamada_num=chamada_num,
            saldo_candidatos_chamada_atual=saldo_candidatos_chamada_atual_dict,
            saldo_candidatos_chamada_atual_ajustado=saldo_candidatos_chamada_atual_ajustado_dict
        )

    def marcar_nao_homologados(self, cpfs: List[str]) -> List[Dict[str, Any]]:
        vagas_liberadas_por_cota: Dict[Tuple[str, str, str], Dict[TipoCota, int]] = defaultdict(lambda: defaultdict(int))
        numeros_chamadas = {c.chamada for c in self.repo.list_candidatos() if c.status == StatusCandidato.SELECIONADO and c.chamada is not None}
        ultima_chamada_com_selecionados = max(numeros_chamadas) if numeros_chamadas else 0

        for cpf in cpfs:
            candidatos_do_cpf = self.repo.get_candidatos_by_cpf(cpf)
            for candidato in candidatos_do_cpf:
                if candidato.status == StatusCandidato.SELECIONADO and candidato.chamada == ultima_chamada_com_selecionados:
                    cota_liberada = candidato.vaga_selecionada
                    curso_key = (candidato.campus, candidato.curso, candidato.turno)
                    self.repo.update_candidato(candidato.id, {"status": StatusCandidato.NAO_HOMOLOGADO, "vaga_selecionada": None})
                    if cota_liberada and curso_key:
                        vagas_liberadas_por_cota[curso_key][cota_liberada] += 1

        for curso_key, liberadas in vagas_liberadas_por_cota.items():
            vagas_atuais = self.repo.get_vagas_para_curso(curso_key)
            if vagas_atuais:
                novo_saldo = vagas_atuais.model_copy()
                for cota, qtd in liberadas.items():
                    valor_atual = getattr(novo_saldo, cota.value, 0)
                    setattr(novo_saldo, cota.value, valor_atual + qtd)
                self.repo.set_vagas_para_curso(curso_key, novo_saldo)

        self.repo.increment_chamada_num()
        return self.get_vagas_disponiveis()

    def listar_candidatos_chamada(self, chamada_num: int) -> List[Candidato]:
        candidatos_chamada = [c for c in self.repo.list_candidatos() if c.chamada == chamada_num and c.status == StatusCandidato.SELECIONADO]
        return self._ordenar_por_nota(candidatos_chamada)

    def get_vagas_disponiveis(self) -> List[Dict[str, Any]]:
        context = self.repo.get_view_context()
        if not context: raise ValidationException("Nenhum curso selecionado para visualização.")
        curso_key = (context['campus'], context['curso'], context['turno'])
        vagas_originais = self.repo.get_vagas_originais_para_curso(curso_key) or Vagas()
        vagas_disponiveis = self.repo.get_vagas_para_curso(curso_key) or Vagas()
        formatted_list = []
        for cota_enum in TipoCota:
            cota_str = cota_enum.value
            formatted_list.append({
                "Cota": cota_str,
                "Vagas Originais": getattr(vagas_originais, cota_str, 0),
                "Vagas Disponíveis": getattr(vagas_disponiveis, cota_str, 0)
            })
        return formatted_list

    def gerar_relatorio_chamada_completo(self, chamada_num: int) -> List[Candidato]:
        candidatos_relatorio = [c for c in self.repo.list_candidatos() if c.chamada == chamada_num]
        return self._ordenar_por_nota(candidatos_relatorio)
    
    def gerar_relatorio_geral_por_curso(self) -> List[Candidato]:
        """
        Gera um relatório com TODOS os candidatos de um curso/turno (contexto),
        com suas respectivas classificações calculadas em todas as cotas.
        """
        view_context = self.repo.get_view_context()
        if not view_context:
            raise ValidationException("Nenhum curso foi selecionado. Aplique um filtro primeiro.")

        candidatos_do_curso = [
            c for c in self.repo.list_candidatos()
            if c.campus == view_context['campus'] and
               c.curso == view_context['curso'] and
               c.turno == view_context['turno']
        ]

        if not candidatos_do_curso:
            raise NotFoundException("Nenhum candidato encontrado para o filtro atual.")

        classificacoes_por_cpf = self._calcular_classificacao_por_cota(candidatos_do_curso)

        for cand in candidatos_do_curso:
            if cand.cpf in classificacoes_por_cpf:
                update_data = classificacoes_por_cpf[cand.cpf]
                self.repo.update_candidato(cand.id, update_data)
        
        candidatos_atualizados = [self.repo.get_candidato(c.id) for c in candidatos_do_curso]

        return self._ordenar_por_nota(candidatos_atualizados)

    def reset_sistema(self) -> None:
        self.repo.reset()