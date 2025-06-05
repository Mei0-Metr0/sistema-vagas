import { useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCsvPreview } from '../../hooks/useCsvPreview';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';

import '../../styles/components/csvUploadSection.css';

const CsvUploadSection = () => {
  const [file, setFile] = useState(null);
  const { request, loading, error: apiErrorHook } = useApi();
  const { preview, generatePreview } = useCsvPreview();
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      generatePreview(selectedFile);
      setStatus({ message: '', type: '' });
    } else {
      setFile(null);
      setPreview(null);
      setStatus({ message: 'Por favor, selecione um arquivo .csv válido.', type: 'error' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ message: 'Nenhum arquivo selecionado ou o arquivo não é CSV.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const responseData = await request({
        endpoint: '/chamadas/upload',
        method: 'POST',
        data: formData,
        isFormData: true
      });

      if (responseData && responseData.status === 'success' && responseData.data) {
        setStatus({
          message: `Arquivo ${responseData.data.filename} carregado com sucesso! ${responseData.data.records_processed} registros processados.`,
          type: 'success'
        });
      } else {
        setStatus({
          message: responseData?.message || 'Arquivo carregado, mas a resposta do servidor é inesperada.',
          type: 'warning'
        });
      }
    } catch (err) {
      setStatus({
        message: err.message || 'Erro ao carregar arquivo',
        type: 'error'
      });
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [generatePreview]);

  return (
    <Card title="1. Upload do CSV">
      <div className="mb-3 position-relative">
        <div
          className={`csv-drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            // Impede que o clique no botão dispare a seleção de arquivo
            if (!e.target.closest('.upload-button')) {
              document.getElementById('csv-file').click();
            }
          }}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('csv-file').click();
            }
          }}
        >
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div className="drop-zone-content">
            <label htmlFor="csv-file" className="form-label">
              {isDragging ? "SOLTE O ARQUIVO CSV AQUI" : "ARRASTE E SOLTE O ARQUIVO CSV AQUI, OU CLIQUE PARA SELECIONAR"}
            </label>
            
            <div className="file-info">
              {file ? `Arquivo selecionado: ${file.name}` : "Nenhum arquivo selecionado"}
            </div>
          </div>

          <div className="upload-button-container">
            <button
              className="btn-app btn-app-primary upload-button"
              onClick={(e) => {
                e.stopPropagation(); // Impede que o clique propague para a área do drop zone
                handleUpload();
              }}
              disabled={loading || !file}
            >
              {loading ? 'Enviando...' : 'Enviar arquivo'}
            </button>
          </div>
        </div>
      </div>

      {apiErrorHook && <Alert message={apiErrorHook} type="error" />}
      {!apiErrorHook && status.message && <Alert message={status.message} type={status.type} />}

      {preview && (
        <div className="mt-3 table-responsive">
          <h6>Pré-visualização do CSV (primeiras linhas):</h6>
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                {preview.headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, index) => (
                <tr key={index}>
                  {preview.headers.map(header => (
                    <td key={`${index}-${header}`}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default CsvUploadSection;