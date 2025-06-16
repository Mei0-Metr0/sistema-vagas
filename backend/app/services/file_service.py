import pandas as pd
from typing import List, Dict, Any
from domain.entities import CandidatoCreate
from core.exceptions import InvalidFileException
from io import StringIO
import re

class FileService:
    @staticmethod
    def process_csv(file_content: bytes, delimiter: str, encoding: str) -> List[Dict[str, Any]]:
        try:
            csv_data = StringIO(file_content.decode(encoding))
            df = pd.read_csv(csv_data, sep=delimiter, decimal=',')

            df.columns = [
                col.strip().lower()
                .replace(' ', '_').replace('ç', 'c').replace('ã', 'a')
                for col in df.columns
            ]

            required_columns = [
                'cpf', 'nota_final', 'cota_do_candidato', 'opcao'
            ]

            if not all(col in df.columns for col in required_columns):
                missing = [col for col in required_columns if col not in df.columns]
                raise InvalidFileException(f"Colunas obrigatórias faltando no CSV: {', '.join(missing)}")

            return df.to_dict('records')

        except UnicodeDecodeError:
            raise InvalidFileException(
                f"Não foi possível decodificar o arquivo com o encoding '{encoding}'. "
                "Por favor, selecione o encoding correto."
            )
        except Exception as e:
            raise InvalidFileException(f"Erro ao processar arquivo CSV: {str(e)}")

    @staticmethod
    def convert_to_candidatos(data: List[Dict[str, Any]]) -> List[CandidatoCreate]:
        candidatos = []
        for row in data:
            try:
                row_cleaned = {
                    k.strip().lower()
                    .replace(' ', '_').replace('ç', 'c').replace('ã', 'a'): v
                    for k, v in row.items()
                }

                opcao_str = str(row_cleaned.get('opcao', ''))

                match = re.search(r'\d+', opcao_str)
                if not match:
                    raise ValueError(f"Formato de opção inválido: '{opcao_str}'")
                opcao_int = int(match.group(0))

                candidatos.append(CandidatoCreate(
                    cpf=str(row_cleaned['cpf']),
                    nota_final=float(row_cleaned['nota_final']),
                    cota=row_cleaned['cota_do_candidato'],
                    opcao=opcao_int,
                    nome=row_cleaned.get('nome', ''),
                    email=row_cleaned.get('e-mail', row_cleaned.get('email', '')),
                    campus=row_cleaned.get('campus', ''),
                    curso=row_cleaned.get('curso', ''),
                    turno=row_cleaned.get('turno', '')
                ))

            except (ValueError, TypeError, KeyError) as e:
                cpf = row.get('cpf', 'N/A')
                raise InvalidFileException(
                    f"Erro ao converter dados do candidato com CPF {cpf}. "
                    "Verifique os tipos de dados e os nomes das colunas (ex: 'nota final', 'Opção'). "
                    f"Detalhe: {str(e)}"
                )

        return candidatos