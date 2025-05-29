from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import pandas as pd
from services.chamada_service import ChamadaService
from domain.entities import Vagas, ChamadaResult
from typing import Optional

router = APIRouter(prefix="/api/v1/chamadas", tags=["chamadas"])

def get_chamada_service() -> ChamadaService:
    return ChamadaService()

@router.post("/upload", summary="Upload de arquivo CSV com candidatos")
async def upload_csv(file: UploadFile = File(...), service: ChamadaService = Depends(get_chamada_service)):
    try:
        df = pd.read_csv(file.file)
        service.carregar_dados(df)
        return {"status": "success", "preview": df.head(10).to_dict('records')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/definir-vagas", summary="Definir quantidade de vagas por cota")
async def definir_vagas(vagas: Vagas, service: ChamadaService = Depends(get_chamada_service)):
    service.definir_vagas(vagas)
    return {"status": "success", "total_vagas": sum(vagas.dict().values())}

@router.post("/gerar-chamada", response_model=ChamadaResult, summary="Gerar nova chamada")
async def gerar_chamada(
    fator_multiplicacao: Optional[float] = 1.0,
    service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return service.gerar_chamada(fator_multiplicacao)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/marcar-nao-homologados", summary="Marcar candidatos não homologados")
async def marcar_nao_homologados(
    cpfs_nao_homologados: list[str],
    service: ChamadaService = Depends(get_chamada_service)
):
    try:
        vagas = service.marcar_nao_homologados(cpfs_nao_homologados)
        return {
            "status": "success",
            "vagas_disponiveis": vagas.dict(),
            "proxima_chamada": service.chamada_num
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/exportar", summary="Exportar chamada para CSV")
async def exportar_chamada(
    chamada_num: int,
    service: ChamadaService = Depends(get_chamada_service)
):
    try:
        df = service.exportar_chamada(chamada_num)
        return df.to_dict('records')
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))