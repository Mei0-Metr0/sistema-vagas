from fastapi import FastAPI
from core.config import settings
from api.v1.endpoints import chamadas
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.app_name,
    description="Sistema de Chamadas Universitárias",
    version="1.0.0",
    debug=settings.debug
)

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://meusite.com.br",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Permite essas origens
    allow_credentials=True,
    allow_methods=["*"],              # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],              # Permite todos os headers
)

app.include_router(chamadas.router)

@app.get("/")
async def root():
    return {"message": "Sistema de Chamadas Universitárias"}