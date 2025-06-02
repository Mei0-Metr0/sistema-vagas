import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import Alert from '../alerts/Alert';

const CotaDistributionForm = ({ onConfirm }) => {
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

  const { request, loading, error } = useApi();
  const [status, setStatus] = useState({ message: '', type: '' });

  const totalVagas = Object.values(cotas).reduce((sum, value) => sum + (parseInt(value) || 0), 0);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCotas(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleConfirm = async () => {
    try {
      const data = await request({
        endpoint: '/chamadas/definir-vagas',
        method: 'POST',
        data: cotas,
        isFormData: false
      });
      
      if (data.status === 'success') {
        setStatus({ message: 'Distribuição de vagas confirmada!', type: 'success' });
        onConfirm && onConfirm(cotas);
      }
    } catch (err) {
      setStatus({ message: err.message || 'Erro ao confirmar vagas', type: 'error' });
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-md-4">
          <div className="mb-3">
            <label htmlFor="AC" className="form-label">AC</label>
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
            <label htmlFor="LI_EP" className="form-label">LI_EP</label>
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
            <label htmlFor="LI_PCD" className="form-label">LI_PCD</label>
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
            <label htmlFor="LI_Q" className="form-label">LI_Q</label>
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
            <label htmlFor="LI_PPI" className="form-label">LI_PPI</label>
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
            <label htmlFor="LB_EP" className="form-label">LB_EP</label>
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
            <label htmlFor="LB_PCD" className="form-label">LB_PCD</label>
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
            <label htmlFor="LB_Q" className="form-label">LB_Q</label>
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
            <label htmlFor="LB_PPI" className="form-label">LB_PPI</label>
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
      
      <div className="alert alert-info">
        Total de vagas: <span id="total-vagas">{totalVagas}</span>
      </div>
      
      {error && <Alert message={error} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}
      
      <button 
        id="confirmar-vagas" 
        className="btn btn-primary"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? 'Confirmando...' : 'Confirmar distribuição de vagas'}
      </button>
    </>
  );
};

export default CotaDistributionForm;