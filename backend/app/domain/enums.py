from enum import Enum

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

class StatusCandidato(str, Enum):
    SELECIONADO = "SELECIONADO"
    NAO_HOMOLOGADO = "NAO_HOMOLOGADO"
    PENDENTE = "PENDENTE"