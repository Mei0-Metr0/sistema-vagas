import { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCsvPreview } from '../../hooks/useCsvPreview';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';

import { useDispatch } from 'react-redux';
import { setMasterList } from '../../store/slices/candidatesSlice';
import { setWorkflowStep } from '../../store/slices/uiSlice';

import '../../styles/components/csvUploadSection.css';

const CsvUploadSection = () => {

    const dispatch = useDispatch();

    const [file, setFile] = useState(null);
    const [delimiter, setDelimiter] = useState(';');
    const { request, loading, error: apiErrorHook } = useApi();
    const { preview, generatePreview } = useCsvPreview();
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isDragging, setIsDragging] = useState(false);

    const processFile = useCallback((selectedFile) => {
        const isValidType = selectedFile && (
            selectedFile.type === "text/csv" ||
            selectedFile.type === "application/vnd.ms-excel" ||
            selectedFile.name.toLowerCase().endsWith('.csv')
        );

        if (isValidType) {
            setFile(selectedFile);
            setStatus({ message: '', type: '' });
        } else {
            setFile(null);
            setStatus({ message: 'Por favor, selecione um arquivo .csv válido.', type: 'error' });
        }
    }, []);

    useEffect(() => {
        if (file) {
            generatePreview(file, delimiter);
        } else {
            generatePreview(null, null);
        }
    }, [file, delimiter, generatePreview]);

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
            const endpointWithDelimiter = `/chamadas/upload?delimiter=${encodeURIComponent(delimiter)}`;

            const responseData = await request({
                endpoint: endpointWithDelimiter,
                method: 'POST',
                data: formData,
                isFormData: true
            });

            if (responseData && responseData.status === 'success' && responseData.data) {
                setStatus({
                    message: `Arquivo ${responseData.data.filename} carregado com sucesso! ${responseData.data.records_processed} registros processados.`,
                    type: 'success'
                });
                dispatch(setMasterList(responseData.data.candidatos));
                dispatch(setWorkflowStep('upload-complete'));
            } else {
                setStatus({
                    message: responseData?.detail || 'Resposta do servidor é inesperada.',
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
    }, [processFile]);

    return (
        <Card title="1. UPLOAD DO CSV">
            <div className="row">
                <div className="col-md-9">
                    <label htmlFor="csv-file" className="form-label fw-bold">
                        Arquivo CSV
                    </label>
                </div>
                <div className="col-md-3">
                    <label htmlFor="delimiter-select" className="form-label fw-bold">
                        Separador
                    </label>
                </div>
            </div>

            <div className="row">
                {/* Coluna da Esquerda: Área de Upload */}
                <div className="col-md-9">
                    <div className="position-relative h-100">
                        <div
                            className="csv-drop-zone d-flex flex-column justify-content-center"
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            onClick={() => document.getElementById('csv-file').click()}
                            role="button" tabIndex={0}
                            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') { document.getElementById('csv-file').click(); } }}
                        >
                            <input type="file" id="csv-file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
                            <div className="drop-zone-content">
                                <label htmlFor="csv-file" className="form-label">
                                    {isDragging ? "SOLTE O ARQUIVO CSV AQUI" : "ARRASTE E SOLTE O ARQUIVO CSV AQUI, OU CLIQUE PARA SELECIONAR"}
                                </label>
                                <div className="file-info">
                                    {file ? `Arquivo selecionado: ${file.name}` : "Nenhum arquivo selecionado"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Controles (Seletor e Botão) */}
                <div className="col-md-3 controls-column">
                    <select id="delimiter-select" className="form-select" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} disabled={loading}>
                        <option value=";">Ponto e vírgula (;)</option>
                        <option value=",">Vírgula (,)</option>
                        <option value="\t">Tab (invisível)</option>
                    </select>

                    <button className="btn-app btn-app-primary w-100" onClick={handleUpload} disabled={loading || !file}>
                        {loading ? 'Enviando...' : 'Enviar Arquivo'}
                    </button>
                </div>
            </div>

            {/* CONTAINER DA PRÉ-VISUALIZAÇÃO */}
            <div className="preview-container mt-4">
                {apiErrorHook && <Alert message={apiErrorHook} type="error" />}
                {!apiErrorHook && status.message && <Alert message={status.message} type={status.type} />}

                {preview && preview.headers && preview.headers.length > 0 && (
                    <div className="table-responsive">
                        <h6>Pré-visualização do CSV (primeiras linhas):</h6>
                        <table className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    {preview.headers.map(header => (<th key={header}>{header}</th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((row, index) => (
                                    <tr key={index}>
                                        {preview.headers.map(header => (<td key={`${index}-${header}`}>{row[header]}</td>))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CsvUploadSection;