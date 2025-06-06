import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';
import CandidatesTable from '../tables/CandidatesTable';
import MultiplierForm from '../forms/MultiplierForm';
import VacanciesTable from '../tables/VacanciesTable';
import { setCallData } from '../../store/slices/callSlice';
import { setCandidates } from '../../store/slices/candidatesSlice';

const CallGenerationSection = () => {
  const { request, loading, error: apiErrorHook } = useApi();
  const [status, setStatus] = useState({ message: '', type: '' });

  const { currentCall, vacanciesInfo, balance } = useSelector(state => state.call);
  const dispatch = useDispatch();

  const handleGenerateCall = async (multiplier) => {
    setStatus({ message: '', type: '' });

    try {
      const backendResponse = await request({
        endpoint: '/chamadas/gerar-chamada',
        method: 'POST',
        data: { fator_multiplicacao: multiplier }
      });

      if (backendResponse && typeof backendResponse.chamada_num === 'number') {
        const transformedVacanciesInfo = Object.keys(backendResponse.vagas_selecionadas || {}).map(cota => ({
          'Cota': cota,
          'Vagas Selecionadas': backendResponse.vagas_selecionadas[cota],
          'Tamanho da Lista': backendResponse.tamanho_lista[cota]
        }));

        const transformedBalanceForCallStats = Object.keys(backendResponse.saldo_candidatos_chamada_atual || {}).map(cota => ({
          'Cota': cota,
          'Saldo': backendResponse.saldo_candidatos_chamada_atual[cota],
          'Saldo Ajustado': backendResponse.saldo_candidatos_chamada_atual_ajustado[cota]
        }));

        dispatch(setCallData({
          chamada_num: backendResponse.chamada_num,
          vagas_info: transformedVacanciesInfo,
          saldo_vagas: transformedBalanceForCallStats
        }));

        const transformedCandidates = (backendResponse.candidatos_chamados || []).map(cand => ({
          'ID': cand.id,
          'Campus': cand.campus || '',
          'Curso': cand.curso || '',
          'Turno': cand.turno || '',
          'CPF': cand.cpf,
          'Nome': cand.nome || '',
          'E-mail': cand.email || '',
          'Nota Final': cand.nota_final,
          'Cota do candidato': cand.cota,
          'Vaga Selecionada': cand.vaga_selecionada,
          'Status': cand.status,
          'Chamada': cand.chamada
        }));

        dispatch(setCandidates(transformedCandidates));

        setStatus({
          message: `${backendResponse.chamada_num}ª chamada gerada com sucesso!`,
          type: 'success'
        });
      } else {
        console.warn("Resposta do backend para /gerar-chamada não contém os dados esperados:", backendResponse);
        setStatus({
          message: backendResponse?.detail || 'Resposta recebida do servidor, mas dados da chamada estão incompletos ou ausentes.',
          type: 'warning'
        });
      }
    } catch (errCaught) {
      console.error("Erro em handleGenerateCall:", errCaught);
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
            className="btn-app btn-app-primary w-100"
            onClick={() => {
              const multiplierInput = document.getElementById('fator-multiplicacao');
              const currentMultiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1.0;
              handleGenerateCall(currentMultiplier);
            }}
            disabled={loading}
          >
            {loading ? 'Processando...' : `Gerar ${currentCall === 0 && !status.message ? 1 : (status.type === 'success' ? currentCall +1 : currentCall +1)}ª chamada`}
          </button>
        </div>
      </div>

      {apiErrorHook && <Alert message={apiErrorHook} type="error" />}
      {!apiErrorHook && status.message && <Alert message={status.message} type={status.type} />}

      {((status.type === 'success' && !apiErrorHook) || (vacanciesInfo && vacanciesInfo.length > 0) || (balance && balance.length > 0)) && (
        <div className="mt-4">
          <h4 className="mb-2 me-3 border-bottom pb-4">ESTATÍSTICAS DA {currentCall}ª CHAMADA</h4>
          <div className="row mt-4">
            <div className="col-md-6">
              <h5>Saldo de vagas por cota</h5>
              <VacanciesTable
                data={balance}
                headers={['Cota', 'Saldo', 'Saldo Ajustado']}
                contents={['Cota', 'Saldo', 'Saldo Ajustado']}
              />
            </div>
            <div className="col-md-6">
              <h5>Vagas selecionadas e tamanho das listas</h5>
              <VacanciesTable
                data={vacanciesInfo}
                headers={['Cota', 'Vagas Selecionadas', 'Tamanho da Lista']}
                contents={['Cota', 'Vagas Selecionadas', 'Tamanho da Lista']}
              />
            </div>
          </div>

          <CandidatesTable />

          {currentCall > 0 && (
            <div className="mt-3">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/chamadas/exportar/${currentCall}`}
                className="btn-app btn-app-success"
                download
              >
                Download da {currentCall}ª chamada
              </a>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CallGenerationSection;