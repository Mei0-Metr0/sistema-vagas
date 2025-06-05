import { useState } from 'react';
import Papa from 'papaparse';

export const useCsvPreview = () => {
  const [preview, setPreview] = useState(null);

  const generatePreview = (file) => {
    Papa.parse(file, {
      header: true,
      preview: 10, // Mostra apenas as primeiras 10 linhas
      complete: (results) => {
        setPreview({
          headers: results.meta.fields,
          rows: results.data
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