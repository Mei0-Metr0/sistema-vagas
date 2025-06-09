import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';

const COTA_ORDER = [
  'AC', 'LI_EP', 'LI_PCD', 'LI_Q', 'LI_PPI', 
  'LB_EP', 'LB_PCD', 'LB_Q', 'LB_PPI'
];

const CotaDistributionForm = ({ onConfirm, status, loading }) => {
  
  const [cotas, setCotas] = useState({
    AC: 22,
    LI_EP: 6,
    LI_PCD: 1,
    LI_Q: 0,
    LI_PPI: 4,
    LB_EP: 5,
    LB_PCD: 1,
    LB_Q: 1,
    LB_PPI: 4
  });

  const [pastedString, setPastedString] = useState('');

  const { error } = useApi();
  const totalVagas = Object.values(cotas).reduce((sum, value) => sum + (parseInt(value) || 0), 0);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCotas(prev => ({
      ...prev,
      [id]: value
    }));
    setPastedString(''); 
  };

  // Manipula campo de texto
  const handlePastedStringChange = (e) => {
    const inputString = e.target.value;
    setPastedString(inputString);

    const numbers = inputString.trim().split(/\s+/);
    
    const newCotas = { ...cotas };

    COTA_ORDER.forEach((cotaKey, index) => {
      if (numbers[index] !== undefined) {
        const value = parseInt(numbers[index], 10);
        newCotas[cotaKey] = isNaN(value) ? cotas[cotaKey] : value;
      }
    });

    setCotas(newCotas);
  };

  const handleConfirm = async () => {
    // Converte todos os valores para números
    const numericCotas = Object.entries(cotas).reduce((acc, [key, value]) => {
        acc[key] = parseInt(value, 10) || 0;
        return acc;
    }, {});
    await onConfirm(numericCotas);
  };

  return (
    <>

      <div className="mb-4">
        <label htmlFor="fast-paste-input" className="form-label fw-bold">
          Colagem Rápida de Vagas
        </label>
        <input
          type="text"
          id="fast-paste-input"
          className="form-control"
          placeholder="Cole os 9 valores aqui, separados por espaço (ex: 22 6 1 0...)"
          value={pastedString}
          onChange={handlePastedStringChange}
        />
        <div className="form-text">
          Ordem esperada: AC, LI_EP, LI_PCD, LI_Q, LI_PPI, LB_EP, LB_PCD, LB_Q, LB_PPI
        </div>
      </div>
      <div className="row">

        <div className="col-md-4">
          <div className="mb-3">
            <label htmlFor="AC" className="form-label">AC (Ampla Concorrência)</label>
            <input
              type="number"
              className="form-control"
              id="AC"
              min="0"
              value={cotas.AC}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LI_EP" className="form-label">LI_EP (Escola Pública)</label>
            <input
              type="number"
              className="form-control"
              id="LI_EP"
              min="0"
              value={cotas.LI_EP}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LI_PCD" className="form-label">LI_PCD (Escola Pública + PCD)</label>
            <input
              type="number"
              className="form-control"
              id="LI_PCD"
              min="0"
              value={cotas.LI_PCD}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="mb-3">
            <label htmlFor="LI_Q" className="form-label">LI_Q (Escola Pública + Quilombola)</label>
            <input
              type="number"
              className="form-control"
              id="LI_Q"
              min="0"
              value={cotas.LI_Q}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LI_PPI" className="form-label">LI_PPI (Escola Pública + (Preto, Pardo ou Indigena))</label>
            <input
              type="number"
              className="form-control"
              id="LI_PPI"
              min="0"
              value={cotas.LI_PPI}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LB_EP" className="form-label">LB_EP (Baixa Renda)</label>
            <input
              type="number"
              className="form-control"
              id="LB_EP"
              min="0"
              value={cotas.LB_EP}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="mb-3">
            <label htmlFor="LB_PCD" className="form-label">LB_PCD (Baixa Renda + PCD)</label>
            <input
              type="number"
              className="form-control"
              id="LB_PCD"
              min="0"
              value={cotas.LB_PCD}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LB_Q" className="form-label">LB_Q (Baixa Renda + Quilombola)</label>
            <input
              type="number"
              className="form-control"
              id="LB_Q"
              min="0"
              value={cotas.LB_Q}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="LB_PPI" className="form-label">LB_PPI (Baixa Renda + (Preto, Pardo ou Indigena))</label>
            <input
              type="number"
              className="form-control"
              id="LB_PPI"
              min="0"
              value={cotas.LB_PPI}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      <div className="alert-1 alert-info-1">
        TOTAL DE VAGAS: <span id="total-vagas-display">{totalVagas}</span>
      </div>

      {error && <Alert message={error} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}

      <button
        id="confirmar-vagas"
        style={{ display: 'none' }}
        onClick={handleConfirm}
        disabled={loading}
      >
      </button>
    </>
  );
};

export default CotaDistributionForm;