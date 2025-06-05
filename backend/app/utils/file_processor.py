import pandas as pd
from typing import List, Dict, Any
from io import StringIO
from ..core.exceptions import InvalidFileException

class FileProcessor:
    @staticmethod
    def csv_to_dict(file_content: bytes) -> List[Dict[str, Any]]:
        try:
            csv_data = StringIO(file_content.decode('utf-8'))
            df = pd.read_csv(csv_data)
            return df.to_dict('records')
        except Exception as e:
            raise InvalidFileException(f"Erro ao processar CSV: {e.detail}")

    @staticmethod
    def dict_to_csv(data: List[Dict[str, Any]]) -> bytes:
        try:
            df = pd.DataFrame(data)
            csv_content = df.to_csv(index=False)
            return csv_content.encode('utf-8')
        except Exception as e:
            raise InvalidFileException(f"Erro ao gerar CSV: {e.detail}")