import { useState } from 'react';
import Papa from 'papaparse';

export const useCsvPreview = () => {
  const [preview, setPreview] = useState(null);

  const generatePreview = (file) => {
    Papa.parse(file, {
      header: true,
      preview: 10, // Mostra apenas as primeiras 10 linhas
      delimiter: ';',
      encoding: 'ISO-8859-1',
      complete: (results) => {
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