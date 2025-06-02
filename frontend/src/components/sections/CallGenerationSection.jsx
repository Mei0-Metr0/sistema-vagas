import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';
import CandidatesTable from '../tables/CandidatesTable';
import MultiplierForm from '../forms/MultiplierForm';
import VacanciesTable from '../tables/VacanciesTable';

const CallGenerationSection = () => {
  const { request, loading, error } = useApi();
  const [status, setStatus] = useState({ message: '', type: '' });
  const { currentCall, vacanciesInfo, balance } = useSelector(state => state.call);
  
  const handleGenerateCall = async (multiplier) => {
    try {
      const data = await request({
        endpoint: '/chamadas/gerar-chamada',
        method: 'POST',
        data: { fator_multiplicacao: multiplier }
      });
      
      if (data.status === 'success') {
        setStatus({ 
          message: `${data.chamada_num}ª chamada gerada com sucesso!`, 
          type: 'success' 
        });
      }
    } catch (err) {
      setStatus({ 
        message: err.message || 'Erro ao gerar chamada', 
        type: 'error' 
      });
    }
  };

  return (
    <Card title="3. Gerar chamada">
      <div className="row mb-3">
        <div className="col-md-6">
          <MultiplierForm onSubmit={handleGenerateCall} loading={loading} />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <button 
            className="btn btn-primary w-100"
            onClick={() => handleGenerateCall(1.0)}
            disabled={loading}
          >
            {loading ? 'Processando...' : `Gerar ${currentCall + 1}ª chamada`}
          </button>
        </div>
      </div>
      
      {error && <Alert message={error} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}
      
      {(vacanciesInfo.length > 0 || balance.length > 0) && (
        <div className="mt-4">
          <h4 className="estatisticas-chamada">Estatísticas da chamada</h4>
          <div className="row">
            <div className="col-md-6">
              <h5>Saldo de vagas por cota</h5>
              <VacanciesTable 
                data={balance}
                headers={['Cota', 'Saldo', 'Saldo Ajustado']}
              />
            </div>
            <div className="col-md-6">
              <h5>Vagas selecionadas e tamanho das listas</h5>
              <VacanciesTable 
                data={vacanciesInfo}
                headers={['Cota', 'Vagas Selecionadas', 'Tamanho da Lista']}
              />
            </div>
          </div>
          
          <CandidatesTable />
          
          <div className="mt-3">
            <a 
              href={`/download_chamada?chamada_num=${currentCall}`} 
              className="btn btn-success"
            >
              Download da chamada
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CallGenerationSection;