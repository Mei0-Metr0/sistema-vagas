import pandas as pd
from typing import List, Dict, Any
from domain.entities import CandidatoCreate
from core.exceptions import InvalidFileException

class FileService:
    @staticmethod
    def process_csv(file_content: bytes) -> List[Dict[str, Any]]:
        try:
            # Usar StringIO para ler o conteúdo do arquivo
            from io import StringIO
            csv_data = StringIO(file_content.decode('utf-8'))
            
            # Ler o CSV com pandas
            df = pd.read_csv(csv_data)
            
            # Verificar colunas obrigatórias
            required_columns = ['CPF', 'Nota Final', 'Cota do candidato']
            if not all(col in df.columns for col in required_columns):
                missing = [col for col in required_columns if col not in df.columns]
                raise InvalidFileException(f"Colunas obrigatórias faltando: {', '.join(missing)}")
            
            # Converter para lista de dicionários
            return df.to_dict('records')
        except Exception as e:
            raise InvalidFileException(f"Erro ao processar arquivo: {str(e)}")

    @staticmethod
    def convert_to_candidatos(data: List[Dict[str, Any]]) -> List[CandidatoCreate]:
        candidatos = []
        for row in data:
            try:
                candidatos.append(CandidatoCreate(
                    cpf=str(row['CPF']),
                    nota_final=float(row['Nota Final']),
                    cota=row['Cota do candidato'],
                    nome=row.get('Nome', ''),
                    email=row.get('Email', '')
                ))
            except Exception as e:
                raise InvalidFileException(f"Erro ao converter linha: {str(e)}")
        return candidatos