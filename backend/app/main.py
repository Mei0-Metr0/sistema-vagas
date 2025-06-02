from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.v1.endpoints import chamadas

app = FastAPI(
    title=settings.app_name,
    description="Sistema de Chamadas Universitárias",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(chamadas.router)

@app.get("/")
async def root():
    return {
        "message": "Bem-vindo ao Sistema de Chamadas Universitárias",
        "docs": "/docs",
        "redoc": "/redoc"
    }