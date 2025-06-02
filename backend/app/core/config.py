from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Sistema de Chamadas Universitárias"
    debug: bool = False
    max_file_size: int = 10 * 1024 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"

settings = Settings()