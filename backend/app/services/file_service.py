import pandas as pd
from typing import List, Dict, Any
from domain.entities import CandidatoCreate
from core.exceptions import InvalidFileException
from io import StringIO

class FileService:
    @staticmethod
    def process_csv(file_content: bytes) -> List[Dict[str, Any]]:
        try:
            # Ler o conteúdo do arquivo CSV
            csv_data = StringIO(file_content.decode('iso-8859-1'))
            df = pd.read_csv(csv_data, sep=';', decimal=',')
            
            # Verificar colunas obrigatórias
            required_columns = ['CPF', 'Nota Final', 'Cota do Candidato']
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
                    cota=row['Cota do Candidato'],
                    nome=row.get('Nome', ''),
                    email=row.get('E-mail', ''),
                    campus=row.get('Campus', ''),
                    curso=row.get('Curso', '')
                ))
            except (ValueError, TypeError, KeyError) as e:
                cpf = row.get('CPF', 'N/A')
                raise InvalidFileException(f"Erro ao converter os dados do candidato com CPF {cpf}. Verifique os tipos de dados. Erro: {str(e)}")
        return candidatos