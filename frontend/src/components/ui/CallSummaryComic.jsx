import { useSelector } from 'react-redux';
import '../../styles/components/callSummaryComic.css';
import { ChatRightQuote, ArrowRight, CheckCircleFill, ExclamationTriangleFill, HourglassSplit } from 'react-bootstrap-icons';

// Mapeamento para nomes completos das cotas
const COTA_NAMES = {
  AC: 'Ampla Concorrência (AC)',
  LI_EP: 'Escola Pública (LI_EP)',
  LI_PCD: 'Escola Pública + PCD (LI_PCD)',
  LI_Q: 'Escola Pública + Quilombola (LI_Q)',
  LI_PPI: 'Escola Pública + PPI (LI_PPI)',
  LB_EP: 'Baixa Renda (LB_EP)',
  LB_PCD: 'Baixa Renda + PCD (LB_PCD)',
  LB_Q: 'Baixa Renda + Quilombola (LB_Q)',
  LB_PPI: 'Baixa Renda + PPI (LB_PPI)',
};

const CallSummaryComic = () => {
  const { balance, vacanciesInfo } = useSelector(state => state.call);

  // Combina os dados de 'balance' e 'vacanciesInfo' em um único array para facilitar o uso
  const summaryData = balance.map(b => {
    const vacancyInfo = vacanciesInfo.find(v => v.Cota === b.Cota) || {};
    return {
      cota: b.Cota,
      saldo: b.Saldo,
      saldoAjustado: b['Saldo Ajustado'],
      vagasSelecionadas: vacancyInfo['Vagas Selecionadas'] || 0,
      tamanhoLista: vacancyInfo['Tamanho da Lista'] || 0,
    };
  });

  const generatePanelStory = (data) => {
    const { cota, saldo, saldoAjustado, vagasSelecionadas, tamanhoLista } = data;

    let story = '';
    let Icon = ChatRightQuote;

    if (vagasSelecionadas === 0 && tamanhoLista === 0) {
      story = `Para esta cota, não havia vagas ofertadas ou candidatos na lista de espera nesta chamada.`;
      Icon = HourglassSplit;
    } else if (saldo >= 0) {
      story = `Havia ${tamanhoLista} candidatos na lista para ${vagasSelecionadas} vaga(s). Conseguimos preencher tudo e ainda tivemos um saldo positivo de ${saldo} candidato(s).`;
      Icon = CheckCircleFill;
      if (saldoAjustado < saldo) {
        const diferenca = saldo - saldoAjustado;
        story += ` Deste saldo, ${diferenca} candidato(s) foram remanejados para cobrir déficits em cotas mais específicas. Saldo final ajustado: ${saldoAjustado}.`;
      } else {
        story += ` Este saldo positivo foi mantido, pois não precisou cobrir outras cotas.`;
      }
    } else { // saldo < 0
      story = `Tínhamos ${vagasSelecionadas} vaga(s) para preencher, mas a lista de ${tamanhoLista} candidato(s) não foi suficiente, resultando em um déficit de ${Math.abs(saldo)} vaga(s).`;
      Icon = ExclamationTriangleFill;
      if (saldoAjustado === 0) {
        story += ` Este déficit foi completamente coberto por candidatos excedentes de cotas mais abrangentes, zerando o saldo.`;
      }
    }

    return (
      <div className="comic-panel">
        <div className="panel-header">
          <Icon className="panel-icon" />
          <h5 className="panel-title">{COTA_NAMES[cota] || cota}</h5>
        </div>
        <p className="panel-text">{story}</p>
        <div className="panel-data">
          <span>Vagas: <strong>{vagasSelecionadas}</strong></span>
          <ArrowRight />
          <span>Lista: <strong>{tamanhoLista}</strong></span>
          <ArrowRight />
          <span>Saldo: <strong>{saldo}</strong></span>
          <ArrowRight />
          <span>Ajustado: <strong>{saldoAjustado}</strong></span>
        </div>
      </div>
    );
  };

  if (!summaryData || summaryData.length === 0) {
    return null;
  }

  return (
    <div className="comic-container mt-4 mb-4">
       <h4 className="mb-3 text-center border-bottom pb-2">Entendendo os Resultados da Chamada</h4>
      <div className="panels-wrapper">
        {summaryData.map(data => (
          <div key={data.cota}>
            {generatePanelStory(data)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallSummaryComic;