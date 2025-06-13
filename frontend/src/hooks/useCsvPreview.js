import { useState } from 'react';
import Papa from 'papaparse';

export const useCsvPreview = () => {
    const [preview, setPreview] = useState(null);

    const generatePreview = (file, delimiter, encoding) => {
        if (!file || !delimiter || !encoding) {
            setPreview(null);
            return;
        }

        Papa.parse(file, {
            header: true,
            preview: 5,
            delimiter: delimiter,
            encoding: encoding, 
            complete: (results) => {
                if (results.data.length === 0 || !results.meta.fields || results.meta.fields.length <= 1) {
                    setPreview({ headers: ['Erro'], rows: [{ 'Erro': 'Não foi possível ler o arquivo. Verifique o delimitador, o encoding e o formato do CSV.' }] });
                    return;
                }

                const cleanedHeaders = results.meta.fields.map(h => h.trim());
                const cleanedRows = results.data.map(row => {
                    const newRow = {};
                    for (const key in row) {
                        newRow[key.trim()] = row[key];
                    }
                    return newRow;
                });

                setPreview({
                    headers: cleanedHeaders,
                    rows: cleanedRows
                });
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                setPreview(null);
            }
        });
    };

    return { preview, generatePreview };
};