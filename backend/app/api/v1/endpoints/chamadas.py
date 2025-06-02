from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List, Optional

from fastapi.responses import StreamingResponse
from api.dependencies import get_chamada_service, get_file_service
from services.chamada_service import ChamadaService
from services.file_service import FileService
from domain.entities import (
    Vagas, ChamadaResult, Candidato, FileUploadResponse
)
from core.exceptions import InvalidFileException
import io

router = APIRouter(prefix="/chamadas", tags=["chamadas"])

@router.post("/upload", response_model=FileUploadResponse, summary="Upload de arquivo CSV")
async def upload_csv(
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service),
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    print(f"Recebendo arquivo: {file.filename}, tipo: {file.content_type}, tamanho: {file.size} bytes")
    try:
        content = await file.read()
        records = file_service.process_csv(content)
        candidatos = file_service.convert_to_candidatos(records)
        total = chamada_service.carregar_candidatos(candidatos)
        
        return FileUploadResponse(
            filename=file.filename,
            size=len(content),
            content_type=file.content_type,
            records_processed=total
        )
    except InvalidFileException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/definir-vagas", summary="Definir quantidade de vagas por cota")
async def definir_vagas(
    vagas: Vagas,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    chamada_service.definir_vagas(vagas)
    return {"status": "success", "total_vagas": sum(vagas.dict().values())}

@router.post("/gerar-chamada", response_model=ChamadaResult, summary="Gerar nova chamada")
async def gerar_chamada(
    fator_multiplicacao: Optional[float] = 1.0,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return chamada_service.gerar_chamada(fator_multiplicacao)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/marcar-nao-homologados", summary="Marcar candidatos não homologados")
async def marcar_nao_homologados(
    cpfs: List[str],
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        vagas = chamada_service.marcar_nao_homologados(cpfs)
        return {
            "status": "success",
            "vagas_disponiveis": vagas,
            "proxima_chamada": chamada_service.repo.get_chamada_num() + 1
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/listar/{chamada_num}", response_model=List[Candidato], summary="Listar candidatos de uma chamada")
async def listar_chamada(
    chamada_num: int,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return chamada_service.listar_candidatos_chamada(chamada_num)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/exportar/{chamada_num}", summary="Exportar chamada para CSV")
async def exportar_chamada(
    chamada_num: int,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        candidatos = chamada_service.listar_candidatos_chamada(chamada_num)
        df = pd.DataFrame([c.dict() for c in candidatos])
        
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        
        response = StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=chamada_{chamada_num}.csv"
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/vagas-disponiveis", summary="Obter vagas disponíveis por cota")
async def vagas_disponiveis(
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return chamada_service.get_vagas_disponiveis()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))