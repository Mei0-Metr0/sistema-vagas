import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCsvPreview } from '../../hooks/useCsvPreview';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';

const CsvUploadSection = () => {
  const [file, setFile] = useState(null);
  const { request, loading, error } = useApi();
  const { preview, generatePreview } = useCsvPreview();
  const [status, setStatus] = useState({ message: '', type: '' });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      generatePreview(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ message: 'Nenhum arquivo selecionado', type: 'error' });
      return;
    }

    console.info('Uploading file:', file.name);
    console.info('File size:', file.size);
    console.info('File type:', file.type);
    // console.info('Content:', file); // Cuidado ao logar o 'file' inteiro, pode ser grande

    const formData = new FormData();
    formData.append('file', file);

    try {
      const responseData = await request({ // Renomeado para responseData para clareza
        endpoint: '/chamadas/upload',
        method: 'POST',
        data: formData,
        isFormData: true
      });

      console.log('Upload response:', responseData);

      // Verifica se responseData e responseData.data existem antes de acessá-los
      if (responseData && responseData.status === 'success' && responseData.data) {
        setStatus({
          message: `Arquivo ${responseData.data.filename} carregado com sucesso! ${responseData.data.records_processed} registros processados.`, // CORRIGIDO
          type: 'success'
        });
      } else {
        // Caso a resposta tenha status 'success' mas não o payload esperado em 'data'
        setStatus({
          message: 'Arquivo carregado, mas a resposta do servidor é inesperada.',
          type: 'warning'
        });
        // Ou pode ser um erro se data.data for essencial
        // throw new Error('Resposta de upload inválida do servidor');
      }
    } catch (err) {
      setStatus({
        message: err.message || 'Erro ao carregar arquivo',
        type: 'error'
      });
    }
  };

  return (
    <Card title="2. Upload do CSV">
      <div className="mb-3">
        <label htmlFor="csv-file" className="form-label">Selecione o arquivo CSV</label>
        <input
          className="form-control"
          type="file"
          id="csv-file"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar arquivo'}
      </button>

      {error && <Alert message={error} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}

      {preview && (
        <div className="mt-3 table-responsive">
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