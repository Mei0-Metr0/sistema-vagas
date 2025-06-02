from fastapi import HTTPException, status

class CustomHTTPException(HTTPException):
    def __init__(self, status_code: int, detail: str, headers: dict = None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class InvalidFileException(CustomHTTPException):
    def __init__(self, detail: str = "Arquivo inválido"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class NotFoundException(CustomHTTPException):
    def __init__(self, detail: str = "Recurso não encontrado"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class ValidationException(CustomHTTPException):
    def __init__(self, detail: str = "Erro de validação"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )