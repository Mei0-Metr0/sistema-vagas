from typing import Optional
from pydantic import BaseModel
from .enums import TipoCota, StatusCandidato

class CandidatoBase(BaseModel):
    cpf: str
    nome: Optional[str] = None
    email: Optional[str] = None

class CandidatoCreate(CandidatoBase):
    nota_final: float
    cota: TipoCota

class Candidato(CandidatoBase):
    id: Optional[int] = None
    nota_final: float
    cota: TipoCota
    vaga_selecionada: Optional[TipoCota] = None
    status: StatusCandidato = StatusCandidato.PENDENTE
    chamada: Optional[int] = None
    
    class Config:
        from_attributes = True

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
    chamada_num: int

class FileUploadResponse(BaseModel):
    filename: str
    size: int
    content_type: str
    records_processed: int

class UploadSuccessResponse(BaseModel):
    status: str
    data: FileUploadResponse