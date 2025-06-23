from typing import Dict, List, Optional, Tuple
from domain.entities import Candidato, Vagas

class InMemoryRepository:
    def __init__(self):
        self.candidatos: Dict[int, Candidato] = {}
        self.vagas_por_curso: Dict[Tuple[str, str, str], Vagas] = {}
        self.vagas_originais_por_curso: Dict[Tuple[str, str, str], Vagas] = {}
        
        self.view_context: Optional[Dict[str, str]] = None
        
        self.chamada_num: int = 1
        self.next_id = 1

    def set_candidatos(self, candidatos: List[Candidato]):
        """Substitui a lista de candidatos existente por uma nova."""
        self.candidatos = {c.id: c for c in candidatos}
    
    def set_view_context(self, campus: str, curso: str, turno: str):
        """Define o contexto de visualização atual (campus, curso, turno)"""
        self.view_context = {"campus": campus, "curso": curso, "turno": turno}

    def get_view_context(self) -> Optional[Dict[str, str]]:
        """Retorna o contexto de visualização atual"""
        return self.view_context

    def add_candidato(self, candidato: Candidato) -> Candidato:
        candidato.id = self.next_id
        self.candidatos[self.next_id] = candidato
        self.next_id += 1
        return candidato

    def get_candidato(self, candidato_id: int) -> Optional[Candidato]:
        return self.candidatos.get(candidato_id)

    def get_candidatos_by_cpf(self, cpf: str) -> List[Candidato]:
        """Retorna uma lista de todas as inscrições de um candidato pelo CPF."""
        return [cand for cand in self.candidatos.values() if cand.cpf == cpf]

    def list_candidatos(self) -> List[Candidato]:
        return list(self.candidatos.values())

    def update_candidato(self, candidato_id: int, candidato_update: dict) -> Optional[Candidato]:
        if candidato_id not in self.candidatos:
            return None

        current_data = self.candidatos[candidato_id].model_dump()
        current_data.update(candidato_update)
        self.candidatos[candidato_id] = Candidato(**current_data)
        return self.candidatos[candidato_id]

    def delete_candidato(self, candidato_id: int) -> bool:
        if candidato_id in self.candidatos:
            del self.candidatos[candidato_id]
            return True
        return False

    def set_vagas_para_curso(self, curso_key: Tuple[str, str, str], vagas: Vagas):
        """Define as vagas para um curso específico."""
        self.vagas_por_curso[curso_key] = vagas
        if curso_key not in self.vagas_originais_por_curso:
             self.vagas_originais_por_curso[curso_key] = vagas.model_copy()

    def get_vagas_para_curso(self, curso_key: Tuple[str, str, str]) -> Optional[Vagas]:
        """Obtém as vagas para um curso específico."""
        return self.vagas_por_curso.get(curso_key)

    def get_vagas_originais_para_curso(self, curso_key: Tuple[str, str, str]) -> Optional[Vagas]:
        """Obtém as vagas originais para um curso específico."""
        return self.vagas_originais_por_curso.get(curso_key)
        
    def list_cursos_com_vagas_definidas(self) -> List[Tuple[str, str, str]]:
        return list(self.vagas_por_curso.keys())

    def increment_chamada_num(self) -> int:
        self.chamada_num += 1
        return self.chamada_num

    def get_chamada_num(self) -> int:
        return self.chamada_num

    def reset(self) -> None:
        self.candidatos = {}
        self.vagas_por_curso = {}
        self.vagas_originais_por_curso = {}
        self.view_context = None
        self.chamada_num = 1
        self.next_id = 1