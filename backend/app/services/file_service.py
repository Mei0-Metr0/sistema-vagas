import pandas as pd
from typing import List, Dict, Any
from domain.entities import CandidatoCreate
from core.exceptions import InvalidFileException
from io import StringIO
import re
import unicodedata

class FileService:

    @staticmethod
    def _normalize_column_name(col_name: str) -> str:
        """
        Normaliza o nome de uma coluna: remove espaços extras, converte para minúsculas,
        substitui espaços por underscores e remove acentos.
        """

        normalized = col_name.strip().lower()
        
        normalized = normalized.replace(' ', '_')
        
        normalized = str(unicodedata.normalize('NFKD', normalized).encode('ascii', 'ignore').decode('utf-8'))
        
        # Opcional: Remover caracteres não alfanuméricos, exceto underscores
        # normalized = re.sub(r'[^a-z0-9_]', '', normalized)
        
        return normalized

    @staticmethod
    def process_csv(file_content: bytes, delimiter: str, encoding: str) -> List[Dict[str, Any]]:
        try:
            csv_data = StringIO(file_content.decode(encoding))
            df = pd.read_csv(csv_data, sep=delimiter, decimal=',')

            df.columns = [FileService._normalize_column_name(col) for col in df.columns]
            
            required_columns = [
                'cpf', 'nota_final', 'cota_do_candidato', 'opcao_de_inscricao'
            ]

            if not all(col in df.columns for col in required_columns):
                missing = [col for col in required_columns if col not in df.columns]
                raise InvalidFileException(f"Colunas obrigatórias faltando no CSV ou com nomes inesperados após normalização: {', '.join(missing)}")
            
            return df.to_dict('records')

        except UnicodeDecodeError:
            raise InvalidFileException(
                f"Não foi possível decodificar o arquivo com o encoding '{encoding}'. "
                "Por favor, selecione o encoding correto."
            )
        except Exception as e:
            if isinstance(e, pd.errors.EmptyDataError):
                raise InvalidFileException("O arquivo CSV está vazio.")
            elif isinstance(e, pd.errors.ParserError):
                raise InvalidFileException(f"Erro de análise do CSV. Verifique o delimitador e o formato do arquivo. Detalhe: {str(e)}")
            else:
                raise InvalidFileException(f"Erro ao processar arquivo CSV: {str(e)}")

    @staticmethod
    def convert_to_candidatos(data: List[Dict[str, Any]]) -> List[CandidatoCreate]:
        candidatos = []
        for row in data:
            try:
                opcao_str = str(row.get('opcao_de_inscricao', ''))

                match = re.search(r'\d+', opcao_str)
                if not match:
                    raise ValueError(f"O valor na coluna 'opcao_de_inscricao' ('{opcao_str}') não contém um número válido. Verifique o formato.")
                opcao_int = int(match.group(0))

                candidatos.append(CandidatoCreate(
                    cpf=str(row['cpf']),
                    nota_final=float(row['nota_final']),
                    cota=row['cota_do_candidato'],
                    opcao=opcao_int,
                    nome=row.get('nome', ''),
                    email=row.get('e-mail', row.get('email', '')),
                    campus=row.get('campus', ''),
                    curso=row.get('curso', ''),
                    turno=row.get('turno', '')
                ))

            except (ValueError, TypeError, KeyError) as e:
                cpf = row.get('cpf', 'N/A')
                raise InvalidFileException(
                    f"Erro ao converter dados do candidato com CPF {cpf}. "
                    "Verifique os tipos de dados ou o conteúdo das colunas. "
                    f"Detalhe: {str(e)}. Dados da linha: {row}"
                )
        return candidatos