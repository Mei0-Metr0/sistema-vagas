from fastapi import Depends
from repositories.in_memory_repository import InMemoryRepository
from services.chamada_service import ChamadaService
from services.file_service import FileService

global_repository = InMemoryRepository()

def get_repository() -> InMemoryRepository:
    return global_repository

def get_chamada_service(repo: InMemoryRepository = Depends(get_repository)) -> ChamadaService:
    return ChamadaService(repo)

def get_file_service() -> FileService:
    return FileService()