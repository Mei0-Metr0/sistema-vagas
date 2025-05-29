from enum import Enum
from typing import Optional
from pydantic import BaseModel

class TipoCota(str, Enum):
    AC = "AC"
    LI_EP = "LI_EP"
    LI_PCD = "LI_PCD"
    LI_Q = "LI_Q"
    LI_PPI = "LI_PPI"
    LB_EP = "LB_EP"
    LB_PCD = "LB_PCD"
    LB_Q = "LB_Q"
    LB_PPI = "LB_PPI"

class Candidato(BaseModel):
    cpf: str
    nota_final: float
    cota: TipoCota
    vaga_selecionada: Optional[str] = None
    vaga_garantida: Optional[str] = None
    chamada: Optional[int] = None

class Vagas(BaseModel):
    AC: int = 0
    LI_EP: int = 0
    LI_PCD: int = 0
    LI_Q: int = 0
    LI_PPI: int = 0
    LB_EP: int = 0
    LB_PCD: int = 0
    LB_Q: int = 0
    LB_PPI: int = 0

class ChamadaResult(BaseModel):
    candidatos_chamados: list[Candidato]
    vagas_selecionadas: dict[TipoCota, int]
    saldo_vagas: dict[TipoCota, int]
    tamanho_lista: dict[TipoCota, int]