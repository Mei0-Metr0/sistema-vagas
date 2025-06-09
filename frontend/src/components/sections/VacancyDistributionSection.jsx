import { useState } from 'react';
import CotaDistributionForm from '../forms/CotaDistributionForm';
import { useApi } from '../../hooks/useApi';

import '../../styles/components/vacancyDistributionSection.css';

const VacancyDistributionSection = () => {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const { request } = useApi();

  const handleConfirm = async (cotas) => {
    setLoading(true);
    setStatus({ message: '', type: '' });

    try {
      const data = await request({
        endpoint: '/chamadas/definir-vagas',
        method: 'POST',
        data: cotas,
        isFormData: false
      });

      if (data.status === 'success') {
        setStatus({ message: 'Distribuição confirmada!', type: 'success' });
      }
    } catch (err) {
      setStatus({ message: err.message || 'Erro ao confirmar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card mb-4 vacancy-distribution-section">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2 className="mb-0">2. DISTRIBUIÇÃO DAS COTAS</h2>
        <button
          className="btn-app btn-app-primary"
          onClick={() => document.getElementById('confirmar-vagas').click()}
          disabled={loading}
        >
          {loading ? 'Confirmando...' : 'Confirmar distribuição'}
        </button>
      </div>
      <div className="card-body">
        <CotaDistributionForm
          onConfirm={handleConfirm}
          status={status}
          loading={loading}
        />
      </div>
    </section>
  );
};

export default VacancyDistributionSection;