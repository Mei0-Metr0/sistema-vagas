import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';
import CandidatesTable from '../tables/CandidatesTable';
import MultiplierForm from '../forms/MultiplierForm';
import VacanciesTable from '../tables/VacanciesTable';
import { setCallData } from '../../store/slices/callSlice';
import { setCandidates, clearNonApprovedCpfs } from '../../store/slices/candidatesSlice';
import InfoLegend from '../ui/InfoLegend';
import CallStory from '../story/CallStory';


const CallGenerationSection = () => {

    const { request, loading, error: apiErrorHook } = useApi();
    const [status, setStatus] = useState({ message: '', type: '' });

    const [homologationStatus, setHomologationStatus] = useState({ message: '', type: '' });
    const [availableVacancies, setAvailableVacancies] = useState([]);
    const [showAvailableVacancies, setShowAvailableVacancies] = useState(false);
    const [nextCallNumber, setNextCallNumber] = useState(0);

    const { currentCall, vacanciesInfo, balance } = useSelector(state => state.call);
    const { data: candidates, nonApprovedCpfs } = useSelector(state => state.candidates);
    const dispatch = useDispatch();

    const resetCallGenerationState = () => {
        setStatus({ message: '', type: '' });
        setHomologationStatus({ message: '', type: '' });
        setShowAvailableVacancies(false);
        setAvailableVacancies([]);
        dispatch(setCandidates([]));
    }

    const handleGenerateCall = async (multiplier) => {
        resetCallGenerationState();

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
                    'Opção': cand.opcao,
                    'Chamada': cand.chamada,
                    'Class_AC': cand.class_AC,
                    'Class_LI_EP': cand.class_LI_EP,
                    'Class_LI_PCD': cand.class_LI_PCD,
                    'Class_LI_Q': cand.class_LI_Q,
                    'Class_LI_PPI': cand.class_LI_PPI,
                    'Class_LB_EP': cand.class_LB_EP,
                    'Class_LB_PCD': cand.class_LB_PCD,
                    'Class_LB_Q': cand.class_LB_Q,
                    'Class_LB_PPI': cand.class_LB_PPI,
                }));

                dispatch(setCandidates(transformedCandidates));

                setStatus({
                    message: `${backendResponse.chamada_num}ª chamada gerada com sucesso!`,
                    type: 'success'
                });

                setNextCallNumber(backendResponse.chamada_num + 1);

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

    const handleMarkNonApproved = async () => {
        if (nonApprovedCpfs.length === 0) {
            setHomologationStatus({ message: 'Selecione pelo menos um CPF na tabela acima.', type: 'warning' });
            return;
        }

        setHomologationStatus({ message: '', type: '' });
        try {
            const data = await request({
                endpoint: '/chamadas/marcar-nao-homologados',
                method: 'POST',
                data: nonApprovedCpfs,
            });

            if (data.status === 'success') {
                setHomologationStatus({
                    message: 'Candidatos marcados como não homologados! O sistema está pronto para a próxima chamada.',
                    type: 'success'
                });
                setAvailableVacancies(data.vagas_disponiveis);
                setNextCallNumber(data.proxima_chamada);
                setShowAvailableVacancies(true);
                dispatch(clearNonApprovedCpfs());
                dispatch(setCandidates([]));

                setStatus({ message: '', type: '' });
            }
        } catch (err) {
            setHomologationStatus({ message: err.message || 'Erro ao marcar candidatos', type: 'error' });
        }
    };

    const handleSkipApproval = async () => {
        setHomologationStatus({ message: '', type: '' });
        try {
            const data = await request({
                endpoint: '/chamadas/marcar-nao-homologados',
                method: 'POST',
                data: [],
            });

            if (data.status === 'success') {
                setHomologationStatus({
                    message: 'Processamento concluído! O sistema está pronto para a próxima chamada.',
                    type: 'success'
                });
                setAvailableVacancies(data.vagas_disponiveis);
                setNextCallNumber(data.proxima_chamada);
                setShowAvailableVacancies(true);
                dispatch(setCandidates([]));

                setStatus({ message: '', type: '' });
            }
        } catch (err) {
            setHomologationStatus({ message: err.message || 'Erro ao processar', type: 'error' });
        }
    };

    const shouldShowResultsSection = status.type === 'success' && !apiErrorHook;

    return (
        <Card
            title={
                <div className="card-title-container">
                    <span>3. GERAR CHAMADA E HOMOLOGAÇÃO</span>
                </div>
            }
        >
            <div className="row mb-3">
                <div className="col-md-6">
                    <MultiplierForm
                        onSubmit={handleGenerateCall}
                        loading={loading}
                        disabled={currentCall !== 0 && candidates.length > 0}
                    />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                    <button
                        className="btn-app btn-app-primary w-100"
                        onClick={() => {
                            const multiplierInput = document.getElementById('fator-multiplicacao');
                            const currentMultiplier = multiplierInput ? parseFloat(multiplierInput.value) : 1.0;
                            handleGenerateCall(currentMultiplier);
                        }}
                        disabled={loading || (currentCall !== 0 && candidates.length > 0)}
                    >
                        {loading ? 'Processando...' : `GERAR ${nextCallNumber === 0 ? 1 : nextCallNumber}ª CHAMADA`}
                    </button>
                </div>
            </div>

            {apiErrorHook && <Alert message={apiErrorHook} type="error" />}
            {!apiErrorHook && status.message && <Alert message={status.message} type={status.type} />}

            {shouldShowResultsSection && (
                <div className="mt-4">
                    <h4 className="mb-2 me-3 border-bottom pb-4">RESULTADOS DA {currentCall}ª CHAMADA</h4>
                    <CallStory />
                    {candidates.length === 0 && (
                        <Alert message="Nenhum candidato foi selecionado nesta chamada." type="info" />
                    )}
                    <div className="row mt-4">
                        <div className="col-md-6">
                            <h5>Saldo de vagas por cota</h5>
                            <VacanciesTable data={balance} headers={['Cota', 'Saldo', 'Saldo Ajustado']} contents={['Cota', 'Saldo', 'Saldo Ajustado']} />
                        </div>
                        <div className="col-md-6">
                            <h5>Vagas selecionadas e tamanho das listas</h5>
                            <VacanciesTable data={vacanciesInfo} headers={['Cota', 'Vagas Selecionadas', 'Tamanho da Lista']} contents={['Cota', 'Vagas Selecionadas', 'Tamanho da Lista']} />
                        </div>
                    </div>
                    <CandidatesTable />
                    <InfoLegend />
                    {candidates.length > 0 && (
                        <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3 border-top pt-4">
                            <div className="d-flex gap-3">
                                <button
                                    className="btn-app btn-app-primary"
                                    onClick={handleMarkNonApproved}
                                    disabled={loading || nonApprovedCpfs.length === 0}
                                    title={nonApprovedCpfs.length === 0 ? "Selecione ao menos um candidato na tabela para marcar" : ""}
                                >
                                    {loading ? 'Processando...' : `MARCAR ${nonApprovedCpfs.length} NÃO HOMOLOGADO(S)`}
                                </button>
                                <button
                                    className="btn-app btn-app-secondary"
                                    onClick={handleSkipApproval}
                                    disabled={loading}
                                >
                                    TODOS FORAM HOMOLOGADOS
                                </button>
                            </div>
                            <button
                                className="btn-app btn-app-success"
                                onClick={() => {
                                    const url = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/chamadas/exportar/${currentCall}`;
                                    window.location.href = url;
                                }}
                            >
                                DOWNLOAD DA LISTA DE CHAMADOS
                            </button>
                        </div>
                    )}
                </div>
            )}
            {homologationStatus.message && <Alert message={homologationStatus.message} type={homologationStatus.type} />}
            {showAvailableVacancies && (
                <div id="vagas-disponiveis" className="mt-4">
                    <h5 className="border-bottom pb-2">NOVAS VAGAS DISPONÍVEIS PARA A PRÓXIMA CHAMADA</h5>
                    <VacanciesTable
                        data={availableVacancies}
                        headers={['Cota', 'Vagas Ofertadas (Última Chamada)', 'Vagas Disponíveis (Próxima Chamada)']}
                        contents={['Cota', 'Vagas Originais', 'Vagas Disponíveis']}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                        <div className="alert alert-info mb-0">
                            Tudo pronto! Clique em "GERAR {nextCallNumber}ª CHAMADA" acima para continuar.
                        </div>
                        <button
                            className="btn-app btn-app-success"
                            onClick={() => {
                                const url = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/chamadas/relatorio-completo/${currentCall}`;
                                window.location.href = url;
                            }}
                        >
                            DOWNLOAD DO RESULTADO FINAL DA {currentCall}ª CHAMADA
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default CallGenerationSection;