import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircleFill, ExclamationTriangleFill, HourglassSplit, InfoCircleFill, ChevronDown, ChevronUp, LightbulbFill, Diagram3 } from 'react-bootstrap-icons';
import '../../styles/components/callStory.css';

import infoImage from '../../assets/info.png';

const COTA_NAMES = { AC: 'Ampla Concorrência', LI_EP: 'Escola Pública', LI_PCD: 'Escola Pública + PCD', LI_Q: 'Escola Pública + Quilombola', LI_PPI: 'Escola Pública + PPI', LB_EP: 'Baixa Renda', LB_PCD: 'Baixa Renda + PCD', LB_Q: 'Baixa Renda + Quilombola', LB_PPI: 'Baixa Renda + PPI' };
const HIERARCHY_ORDER = ['AC', 'LI_EP', 'LI_PCD', 'LI_Q', 'LI_PPI', 'LB_EP', 'LB_PCD', 'LB_Q', 'LB_PPI'];


const DynamicCascadeExplanation = ({ summaryData }) => {
    const logEntries = [];
    let cumulativeDeficit = 0;

    const initialBalances = summaryData.reduce((acc, item) => {
        acc[item.cota] = item.saldo;
        return acc;
    }, {});

    for (let i = HIERARCHY_ORDER.length - 1; i >= 0; i--) {
        const cota = HIERARCHY_ORDER[i];
        const initialBalance = initialBalances[cota] || 0;
        const receivedDeficit = cumulativeDeficit;

        if (initialBalance === 0 && receivedDeficit === 0) continue;

        const finalBalance = initialBalance + receivedDeficit;
        cumulativeDeficit = Math.min(0, finalBalance);
        const nextQuotaName = (i > 0) ? COTA_NAMES[HIERARCHY_ORDER[i - 1]] : null;

        logEntries.push({ cota, initialBalance, receivedDeficit, finalBalance, nextQuotaName });

        if (cumulativeDeficit === 0) {
            const unaffectedQuotas = HIERARCHY_ORDER.slice(0, i)
                .map(q => ({ cota: q, initialBalance: initialBalances[q] || 0 }))
                .filter(q => q.initialBalance !== undefined);
            if (unaffectedQuotas.length > 0) {
                logEntries.push({ type: 'UNAFFECTED', unaffectedQuotas });
            }
            break;
        }
    }

    return (
        <div key="cascade-explanation" className="adjustment-story-panel">
            <div className="story-panel-header">
                <InfoCircleFill className="story-panel-icon" />
                <h5 className="story-panel-title">O Efeito Cascata (Ajustando os Saldos)</h5>
            </div>
            <div className="adjustment-body narrative-cascade">
                <p>O sistema ajusta os saldos de baixo para cima na hierarquia. A "dívida" de uma cota sobe para a cota imediatamente mais geral. Vamos seguir a "dívida" subindo:</p>
                {logEntries.map((entry) => {
                    if (entry.type === 'UNAFFECTED') {
                        return (
                            <div key="unaffected" className="narrative-step">
                                <h6 className="narrative-title">Demais Cotas (para cima)</h6>
                                <p>Como a dívida foi completamente quitada, não há mais nenhum valor negativo para ser passado para cima. Portanto, todas as cotas restantes mantêm seu saldo original:</p>
                                <ul className='narrative-list'>
                                    {entry.unaffectedQuotas.map(q => (
                                        <li key={q.cota}><strong>{COTA_NAMES[q.cota]}</strong>: Saldo ajustado de <strong>{q.initialBalance}</strong>.</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }
                    return (
                        <div key={entry.cota} className="narrative-step">
                            <h6 className="narrative-title">Cota {COTA_NAMES[entry.cota]}</h6>
                            <p>
                                {entry.initialBalance >= 0 ? `Começa com um saldo positivo de ${entry.initialBalance}.` : `Tinha sua própria dívida de ${entry.initialBalance}.`}
                                {entry.receivedDeficit < 0 && ` Recebeu a dívida de ${entry.receivedDeficit} da(s) cota(s) inferior(es).`}
                            </p>
                            <p className="calculation-detail">
                                <strong>Cálculo do novo saldo:</strong> {entry.initialBalance} + ({entry.receivedDeficit}) = <strong>{entry.finalBalance}</strong>
                            </p>
                            <p className="narrative-result">
                                <strong>Resultado:</strong>{' '}
                                {entry.finalBalance < 0
                                    ? `A dívida atualizada de ${entry.finalBalance} é passada para a cota superior, a ${entry.nextQuotaName}. O Saldo Ajustado da ${COTA_NAMES[entry.cota]} se torna 0.`
                                    : `A dívida é totalmente paga! O Saldo Ajustado da cota ${COTA_NAMES[entry.cota]} fica em ${entry.finalBalance}.`
                                }
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- Componente Principal ---
const CallStory = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const { balance, vacanciesInfo } = useSelector(state => state.call);

    const slidesContent = useMemo(() => {
        const slides = [];

        // --- Slides 1 e 2: Introdutórios ---
        slides.push(<div key="principio-fundamental" className="story-panel status-neutral"> <div className="story-panel-header"> <LightbulbFill className="story-panel-icon" /> <h5 className="story-panel-title">Princípio Fundamental: Nenhuma Vaga Ociosa</h5> </div> <div className="story-panel-body"> <p className="story-text"> O objetivo do sistema é preencher o máximo de vagas possível. Para isso, ele segue uma regra clara: se uma cota específica não tem candidatos suficientes, as vagas não preenchidas são transferidas para cotas mais gerais, garantindo o aproveitamento total. </p> </div> </div>);
        slides.push(<div key="efeito-cascata" className="story-panel status-neutral"> <div className="story-panel-header"> <Diagram3 className="story-panel-icon" /> <h5 className="story-panel-title">O Processo: Efeito Cascata</h5> </div> <div className="story-panel-body"> <p className="story-text"> Pense nas cotas como uma cascata invertida, das mais específicas (como Baixa Renda + PPI) para a mais ampla (Ampla Concorrência). O sistema tenta preencher as vagas de baixo para cima. A "dívida" de vagas de uma cota inferior é sempre repassada para a superior, que tenta quitá-la com seus candidatos excedentes. </p> </div> </div>);

        // --- Dados para os slides ---
        const summaryData = HIERARCHY_ORDER.map(cota => {
            const balanceInfo = balance.find(b => b.Cota === cota) || {};
            const vacancyInfo = vacanciesInfo.find(v => v.Cota === cota) || {};
            return { cota, saldo: balanceInfo.Saldo, saldoAjustado: balanceInfo['Saldo Ajustado'], vagasOfertadas: vacancyInfo['Vagas Selecionadas'] || 0, tamanhoLista: vacancyInfo['Tamanho da Lista'] || 0 };
        }).filter(d => d.saldo !== undefined);

        if (summaryData.length === 0) return [];

        // --- Slides de Resumo por Cota ---
        const quotaSlides = summaryData.map((data) => {
            const { cota, saldo, saldoAjustado, vagasOfertadas, tamanhoLista } = data;
            let title, storyText, Icon, statusClass;

            if (vagasOfertadas === 0 && tamanhoLista === 0) {
                title = "Sem movimentação"; Icon = HourglassSplit; statusClass = 'status-neutral';
                storyText = `Nesta chamada, não foram ofertadas vagas ou não havia candidatos na lista para a cota ${COTA_NAMES[cota]}.`;
            } else if (saldo >= 0) {
                title = "Fila de espera suficiente!"; Icon = CheckCircleFill; statusClass = 'status-success';
                storyText = `Para a cota <strong>${COTA_NAMES[cota]}</strong>, o objetivo era preencher <strong>${vagasOfertadas}</strong> vaga(s). A fila de espera tinha <strong>${tamanhoLista}</strong> candidato(s) aptos.`;
                if (vagasOfertadas > 0) { storyText += ` Todos os convocados foram suficientes, resultando em um saldo positivo de <strong>${saldo}</strong> candidato(s).`; }
                else { storyText += ` Não foram ofertadas vagas, mas a lista possuía candidatos.`; }
                if (saldoAjustado < saldo) { const remanejados = saldo - saldoAjustado; storyText += ` Como esta fila tinha gente sobrando, <strong>${remanejados}</strong> candidato(s) foram remanejados para ajudar a preencher o déficit de cotas mais específicas.`; }
            } else {
                title = "Faltaram candidatos na fila!"; Icon = ExclamationTriangleFill; statusClass = 'status-warning';
                storyText = `A fila de espera para <strong>${COTA_NAMES[cota]}</strong>, com <strong>${tamanhoLista}</strong> candidato(s), não foi o bastante para preencher as <strong>${vagasOfertadas}</strong> vaga(s) ofertadas.`;
                storyText += ` Isso gerou um déficit de <strong>${Math.abs(saldo)}</strong> vaga(s).`;
                if (saldoAjustado === 0) { storyText += ` Felizmente, este déficit foi coberto por candidatos excedentes de cotas mais gerais (acima na hierarquia da cascata).`; }
                else { storyText += ` Esse déficit foi então "empurrado" para a próxima cota na hierarquia, para que ela tentasse cobri-lo.`; }
            }
            return (<div key={cota} className={`story-panel ${statusClass}`}> <div className="story-panel-header"><Icon className="story-panel-icon" /> <h6 className="story-panel-title">{COTA_NAMES[cota] || cota}</h6> </div> <div className="story-panel-body"> <p className="story-title">{title}</p> <p className="story-text" dangerouslySetInnerHTML={{ __html: storyText }}></p> </div> </div>);
        });
        slides.push(...quotaSlides);

        // --- Slide Final: Explicação Detalhada da Cascata ---
        const hasDeficits = summaryData.some(d => d.saldo < 0);
        if (hasDeficits) {
            slides.push(<DynamicCascadeExplanation key="dynamic-cascade" summaryData={summaryData} />);
        }

        return slides;
    }, [balance, vacanciesInfo]);

    const handleToggle = () => { setIsOpen(!isOpen); setCurrentSlide(0); };
    const goToNextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slidesContent.length - 1));
    const goToPreviousSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    if (slidesContent.length === 0) return null;

    return (
        <div className="story-container">
            <div className="story-container-header" onClick={handleToggle}>
                <h4 className="story-main-title">Entendendo os dados...</h4>
                <button className="story-toggle-button">{isOpen ? 'Ocultar Explicação' : 'Mostrar Explicação'}{isOpen ? <ChevronUp /> : <ChevronDown />}</button>
            </div>
            {isOpen && (
                <div className="story-body">
                    <div className="info-container-wrapper">
                        <div className="info-hover-container">
                            <InfoCircleFill className="info-icon" />
                            <div className="hover-image-popup">
                                <img src={infoImage} alt="Fluxograma do processo de chamada" />
                                <figcaption className="image-caption">Prioridade para o preenchimento das vagas</figcaption>
                            </div>
                        </div>
                    </div>
                    <div className="slide-content" key={currentSlide}>{slidesContent[currentSlide]}</div>
                    <div className="story-navigation">
                        <button onClick={goToPreviousSlide} disabled={currentSlide === 0} className="btn-app btn-app-secondary">Anterior</button>
                        <span className="slide-counter">{currentSlide + 1} / {slidesContent.length}</span>
                        <button onClick={goToNextSlide} disabled={currentSlide === slidesContent.length - 1} className="btn-app btn-app-primary">Próximo</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallStory;