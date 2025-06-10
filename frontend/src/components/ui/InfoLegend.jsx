import '../../styles/components/infoLegend.css';

const InfoLegend = () => {
    return (
        <div className="legend-container mt-1">
            <div className="legend-section">
                <div className="legend-columns">
                    <div className="legend-item"><strong>NH:</strong> Não Homologado</div>
                    <div className="legend-item"><strong>AC:</strong> Ampla Concorrência</div>
                    <div className="legend-item"><strong>LI_EP:</strong> Escola Pública</div>
                    <div className="legend-item"><strong>LI_PCD:</strong> Escola Pública + Pessoa com Deficiência (PCD)</div>
                    <div className="legend-item"><strong>LI_Q:</strong> Escola Pública + Quilombola</div>
                    <div className="legend-item"><strong>LI_PPI:</strong> Escola Pública + Preto, Pardo ou Indígena</div>
                    <div className="legend-item"><strong>LB_EP:</strong> Escola Pública + Baixa Renda</div>
                    <div className="legend-item"><strong>LB_PCD:</strong> Escola Pública + Baixa Renda + Pessoa com Deficiência (PCD)</div>
                    <div className="legend-item"><strong>LB_Q:</strong> Escola Pública + Baixa Renda + Quilombola</div>
                    <div className="legend-item"><strong>LB_PPI:</strong> Escola Pública + Baixa Renda + Preto, Pardo ou Indígena</div>
                </div>
            </div>
        </div>
    );
};

export default InfoLegend;