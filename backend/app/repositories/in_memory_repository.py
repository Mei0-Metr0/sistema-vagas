from typing import Dict, List, Optional
from domain.entities import Candidato, Vagas
from domain.enums import TipoCota

class InMemoryRepository:
    def __init__(self):
        self.candidatos: Dict[int, Candidato] = {}
        self.vagas: Vagas = Vagas()
        self.vagas_originais: Optional[Vagas] = None
        self.chamada_num: int = 1
        self.next_id = 1

    def add_candidato(self, candidato: Candidato) -> Candidato:
        candidato.id = self.next_id
        self.candidatos[self.next_id] = candidato
        self.next_id += 1
        return candidato

    def get_candidato(self, candidato_id: int) -> Optional[Candidato]:
        return self.candidatos.get(candidato_id)

    def get_candidato_by_cpf(self, cpf: str) -> Optional[Candidato]:
        for cand in self.candidatos.values():
            if cand.cpf == cpf:
                return cand
        return None

    def list_candidatos(self) -> List[Candidato]:
        return list(self.candidatos.values())

    def update_candidato(self, candidato_id: int, candidato_update: dict) -> Optional[Candidato]:
        if candidato_id not in self.candidatos:
            return None
        self.candidatos[candidato_id] = Candidato(**{**self.candidatos[candidato_id].dict(), **candidato_update})
        return self.candidatos[candidato_id]

    def delete_candidato(self, candidato_id: int) -> bool:
        if candidato_id in self.candidatos:
            del self.candidatos[candidato_id]
            return True
        return False

    def set_vagas(self, vagas: Vagas) -> None:
        self.vagas = vagas
        self.vagas_originais = vagas.copy()

    def get_vagas(self) -> Vagas:
        return self.vagas

    def get_vagas_originais(self) -> Optional[Vagas]:
        return self.vagas_originais

    def increment_chamada_num(self) -> int:
        self.chamada_num += 1
        return self.chamada_num

    def get_chamada_num(self) -> int:
        return self.chamada_num

    def reset(self) -> None:
        self.candidatos = {}
        self.vagas = Vagas()
        self.vagas_originais = None
        self.chamada_num = 1
        self.next_id = 1