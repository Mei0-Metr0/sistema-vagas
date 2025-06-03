from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from typing import List, Optional 

import pandas as pd
import logging

from fastapi.responses import StreamingResponse
from api.dependencies import get_chamada_service, get_file_service
from services.chamada_service import ChamadaService
from services.file_service import FileService
from domain.entities import (
    Vagas, ChamadaResult, Candidato, FileUploadResponse, UploadSuccessResponse, BaseModel
)

from core.exceptions import InvalidFileException, ValidationException, NotFoundException 
from core.config import settings 
import io

router = APIRouter(prefix="/chamadas", tags=["chamadas"])

@router.post("/upload", response_model=UploadSuccessResponse, summary="Upload de arquivo CSV") 
async def upload_csv(
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service),
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    print(f"Recebendo arquivo: {file.filename}, tipo: {file.content_type}, tamanho aproximado: {file.size} bytes")
    try:
        content = await file.read()
        
        if len(content) > settings.max_file_size:
            raise HTTPException(status_code=413, detail=f"Arquivo muito grande. Tamanho máximo: {settings.max_file_size // (1024*1024)}MB")

        records = file_service.process_csv(content)
        candidatos = file_service.convert_to_candidatos(records)
        
        chamada_service.repo.reset() 
        total_carregados = chamada_service.carregar_candidatos(candidatos)

        return {
            "status": "success",
            "data": FileUploadResponse(
                filename=file.filename,
                size=len(content), 
                content_type=file.content_type or "application/octet-stream",
                records_processed=total_carregados
            )
        }
    except InvalidFileException as e:
        logging.exception(f"Erro de arquivo inválido durante o upload: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException: 
        raise
    except Exception as e:
        logging.exception("Erro interno não esperado no upload_csv")
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar o arquivo: {str(e)}")

@router.post("/definir-vagas", summary="Definir quantidade de vagas por cota para o edital")
async def definir_vagas(
    vagas: Vagas, 
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        chamada_service.definir_vagas(vagas) 
        chamada_service.repo.chamada_num = 1 
        return {"status": "success", "message": "Distribuição de vagas definida com sucesso.", "total_vagas": sum(vagas.dict().values())}
    except Exception as e:
        logging.exception("Erro interno ao definir vagas")
        raise HTTPException(status_code=500, detail=f"Erro ao definir vagas: {str(e)}")


class GerarChamadaPayload(BaseModel): 
    fator_multiplicacao: Optional[float] = 1.0

@router.post("/gerar-chamada", response_model=ChamadaResult, summary="Gerar nova chamada")
async def gerar_chamada(
    payload: GerarChamadaPayload = Body(GerarChamadaPayload(fator_multiplicacao=1.0)), 
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return chamada_service.gerar_chamada(payload.fator_multiplicacao)
    except ValidationException as e:
        logging.exception(f"Erro de validação ao gerar chamada (fator: {payload.fator_multiplicacao}): {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except NotFoundException as e:
        logging.exception(f"Recurso não encontrado ao gerar chamada (fator: {payload.fator_multiplicacao}): {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.exception(f"Erro interno não esperado ao gerar chamada (fator: {payload.fator_multiplicacao})")
        raise HTTPException(status_code=500, detail=f"Erro interno ao gerar chamada: {str(e)}")


@router.post("/marcar-nao-homologados", summary="Marcar candidatos não homologados e preparar para próxima chamada")
async def marcar_nao_homologados(
    cpfs: List[str] = Body(...), 
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        vagas_disponiveis_formatado = chamada_service.marcar_nao_homologados(cpfs)
        proxima_chamada_num = chamada_service.repo.get_chamada_num()
        
        return {
            "status": "success",
            "message": f"{len(cpfs) if cpfs else 'Nenhum'} candidato(s) marcado(s) como não homologado(s). Preparado para a {proxima_chamada_num}ª chamada.",
            "vagas_disponiveis": vagas_disponiveis_formatado,
            "proxima_chamada": proxima_chamada_num
        }
    except ValidationException as e:
        logging.exception(f"Erro de validação ao marcar não homologados: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logging.exception("Erro interno não esperado ao marcar não homologados")
        raise HTTPException(status_code=500, detail=f"Erro interno ao marcar não homologados: {str(e)}")


@router.get("/listar/{chamada_num}", response_model=List[Candidato], summary="Listar candidatos de uma chamada")
async def listar_chamada(
    chamada_num: int,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        candidatos = chamada_service.listar_candidatos_chamada(chamada_num)
        return candidatos
    except NotFoundException as e: 
        logging.exception(f"Chamada {chamada_num} não encontrada ao listar: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.exception(f"Erro interno não esperado ao listar chamada {chamada_num}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar chamada: {str(e)}")

@router.get("/exportar/{chamada_num}", summary="Exportar chamada para CSV")
async def exportar_chamada(
    chamada_num: int,
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        candidatos = chamada_service.listar_candidatos_chamada(chamada_num)
        if not candidatos: 
            logging.warning(f"Tentativa de exportar chamada {chamada_num} sem candidatos ou chamada inexistente.")
            raise HTTPException(status_code=404, detail=f"Nenhum candidato encontrado para a chamada {chamada_num} para exportação.")
            
        colunas_ordenadas = [
            "id", "cpf", "nome", "email", "nota_final", 
            "cota", "vaga_selecionada", "status", "chamada"
        ]
        
        candidatos_dict_list = []
        for c in candidatos:
            cand_dict = c.dict(exclude_none=True) 
            for col in colunas_ordenadas:
                if col not in cand_dict:
                    cand_dict[col] = None 
            candidatos_dict_list.append(cand_dict)

        df = pd.DataFrame(candidatos_dict_list, columns=colunas_ordenadas)
        
        stream = io.StringIO()
        df.to_csv(stream, index=False, sep=';', decimal=',')
        
        response = StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=chamada_{chamada_num}.csv"
            }
        )
        return response
    except HTTPException: 
        raise
    except Exception as e:
        logging.exception(f"Erro interno não esperado ao exportar chamada {chamada_num}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao exportar chamada: {str(e)}")

@router.get("/vagas-disponiveis", summary="Obter vagas disponíveis por cota para a próxima chamada")
async def vagas_disponiveis_endpoint( 
    chamada_service: ChamadaService = Depends(get_chamada_service)
):
    try:
        return chamada_service.get_vagas_disponiveis()
    except ValidationException as e:
        logging.exception(f"Erro de validação ao obter vagas disponíveis: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logging.exception("Erro interno não esperado ao obter vagas disponíveis")
        raise HTTPException(status_code=500, detail=f"Erro ao obter vagas disponíveis: {str(e)}")