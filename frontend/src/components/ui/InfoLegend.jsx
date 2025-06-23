import '../../styles/components/infoLegend.css';

const InfoLegend = () => {
    return (
        <div className="legend-container mt-3">
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

                    <div className="legend-item"><strong>Class_AC:</strong> Classificação na Cota AC</div>
                    <div className="legend-item"><strong>Class_LI_EP:</strong> Classificação na Cota LI_EP</div>
                    <div className="legend-item"><strong>Class_LI_PCD:</strong> Classificação na Cota LI_PCD</div>
                    <div className="legend-item"><strong>Class_LI_Q:</strong> Classificação na Cota LI_Q</div>
                    <div className="legend-item"><strong>Class_LI_PPI:</strong> Classificação na Cota LI_PPI</div>
                    <div className="legend-item"><strong>Class_LB_EP:</strong> Classificação na Cota LB_EP</div>
                    <div className="legend-item"><strong>Class_LB_PCD:</strong> Classificação na Cota LB_PCD</div>
                    <div className="legend-item"><strong>Class_LB_Q:</strong> Classificação na Cota LB_Q</div>
                    <div className="legend-item"><strong>Class_LB_PPI:</strong> Classificação na Cota LB_PPI</div>
                </div>
            </div>
        </div>
    );
};

export default InfoLegend;