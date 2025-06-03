import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';
import CandidatesTable from '../tables/CandidatesTable';
import MultiplierForm from '../forms/MultiplierForm';
import VacanciesTable from '../tables/VacanciesTable';
import { setCallData } // Importar de callSlice
    from '../../store/slices/callSlice';
import { setCandidates } // Importar de candidatesSlice
    from '../../store/slices/candidatesSlice';

const CallGenerationSection = () => {
  const { request, loading, error: apiErrorHook } = useApi(); // Renomeado 'error' para evitar conflito
  const [status, setStatus] = useState({ message: '', type: '' });
  const { currentCall, vacanciesInfo, balance } = useSelector(state => state.call);
  const dispatch = useDispatch();

  const handleGenerateCall = async (multiplier) => {
    setStatus({ message: '', type: '' }); // Limpar status anterior
    console.log(`Iniciando handleGenerateCall com multiplicador: ${multiplier}`);

    try {
      const backendResponse = await request({
        endpoint: '/chamadas/gerar-chamada',
        method: 'POST',
        data: { fator_multiplicacao: multiplier }
      });

      console.log("Resposta do backend para /gerar-chamada:", backendResponse);

      if (backendResponse && typeof backendResponse.chamada_num === 'number') {
        // Transformar dados para o callSlice
        const transformedVacanciesInfo = Object.keys(backendResponse.vagas_selecionadas || {}).map(cota => ({
          'Cota': cota,
          'Vagas Selecionadas': backendResponse.vagas_selecionadas[cota],
          'Tamanho da Lista': backendResponse.tamanho_lista[cota]
        }));
        console.log("transformedVacanciesInfo para Redux:", transformedVacanciesInfo);

        const transformedBalance = Object.keys(backendResponse.saldo_vagas || {}).map(cota => ({
          'Cota': cota,
          'Saldo': backendResponse.saldo_vagas[cota], // Usando saldo_vagas para ambas colunas por enquanto
          'Saldo Ajustado': backendResponse.saldo_vagas[cota]
        }));
        console.log("transformedBalance para Redux:", transformedBalance);

        dispatch(setCallData({
          chamada_num: backendResponse.chamada_num,
          vagas_info: transformedVacanciesInfo,
          saldo_vagas: transformedBalance
        }));

        // Transformar dados para o candidatesSlice
        const transformedCandidates = (backendResponse.candidatos_chamados || []).map(cand => ({
          'ID': cand.id,
          'CPF': cand.cpf,
          'Nome': cand.nome || '',
          'Email': cand.email || '',
          'Nota Final': cand.nota_final,
          'Cota do candidato': cand.cota, // Cota original do candidato
          'Vaga Selecionada': cand.vaga_selecionada, // Cota na qual foi selecionado
          'Status': cand.status,
          'Chamada': cand.chamada
        }));
        console.log("transformedCandidates para Redux:", transformedCandidates);

        dispatch(setCandidates(transformedCandidates));

        setStatus({
          message: `${backendResponse.chamada_num}ª chamada gerada com sucesso!`,
          type: 'success'
        });
      } else {
        console.warn("Resposta do backend para /gerar-chamada não contém os dados esperados:", backendResponse);
        setStatus({
          message: 'Resposta recebida do servidor, mas dados da chamada estão incompletos ou ausentes.',
          type: 'warning'
        });
        // Opcional: limpar dados das tabelas se a resposta for inválida
        // dispatch(setCallData({ chamada_num: currentCall, vagas_info: [], saldo_vagas: [] }));
        // dispatch(setCandidates([]));
      }
    } catch (errCaught) { // Renomeado 'err'
      console.error("Erro em handleGenerateCall:", errCaught);
      setStatus({
        message: errCaught.message || 'Erro desconhecido ao gerar chamada',
        type: 'error'
      });
      // Opcional: limpar dados das tabelas em caso de erro
      // dispatch(setCallData({ chamada_num: currentCall, vagas_info: [], saldo_vagas: [] }));
      // dispatch(setCandidates([]));
    }
  };

  // Adicione este log para ver o estado atual que o componente está usando para renderizar
  console.log("Dados do Redux para renderização - vacanciesInfo:", vacanciesInfo, "balance:", balance);

  return (
    <Card title="3. Gerar chamada">
      <div className="row mb-3">
        <div className="col-md-6">
          {/* Passando o valor de currentCall + 1 para o texto do botão no MultiplierForm */}
          {/* No entanto, o MultiplierForm não usa currentCall para o texto do botão. */}
          {/* O botão principal é que usa currentCall. */}
          <MultiplierForm onSubmit={handleGenerateCall} loading={loading} />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <button
            className="btn btn-primary w-100"
            onClick={() => handleGenerateCall(1.0)} // Você pode pegar o valor do MultiplierForm aqui se desejar
            disabled={loading}
          >
            {loading ? 'Processando...' : `Gerar ${currentCall === 0 ? 1 : currentCall + 1}ª chamada`}
          </button>
        </div>
      </div>

      {/* Exibir erro do hook useApi, se houver */}
      {apiErrorHook && <Alert message={apiErrorHook} type="error" />}
      {/* Exibir status da operação de gerar chamada */}
      {status.message && <Alert message={status.message} type={status.type} />}

      {/* Condição para exibir a seção de estatísticas */}
      {/* Renderiza se a chamada foi bem sucedida e há dados para mostrar, ou se já havia dados de antes */}
      { (status.type === 'success' || vacanciesInfo.length > 0 || balance.length > 0) && (
        <div className="mt-4">
          <h4 className="estatisticas-chamada">Estatísticas da {currentCall}ª chamada</h4> {/* Atualizado para currentCall */}
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

          <CandidatesTable /> {/* CandidatesTable usa dados do slice 'candidates' */}

          {/* Link de download - Certifique-se que currentCall é o número da chamada gerada */}
          {currentCall > 0 && (
            <div className="mt-3">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/chamadas/exportar/${currentCall}`}
                className="btn btn-success"
                download // Adiciona o atributo download para forçar o download
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