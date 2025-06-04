import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import { 
  addNonApprovedCpf, 
  removeNonApprovedCpf, 
  clearNonApprovedCpfs 
} from '../../store/slices/candidatesSlice';
import Alert from '../alerts/Alert';
import Card from '../ui/Card';
import VacanciesTable from '../tables/VacanciesTable';

import '../../styles/components/forms.css'; 

const NonApprovedSection = () => {
  const { request, loading, error } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [showAvailableVacancies, setShowAvailableVacancies] = useState(false);
  const [availableVacancies, setAvailableVacancies] = useState([]);
  const [nextCallNumber, setNextCallNumber] = useState(2);
  
  const { nonApprovedCpfs, data: candidates } = useSelector(state => state.candidates);
  const dispatch = useDispatch();

  const allCpfs = useMemo(() => candidates.map(c => c.CPF) || [], [candidates]);

  const handleSearch = useCallback((term) => {
    if (term.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filtered = allCpfs.filter(cpf => 
      cpf.toLowerCase().includes(term.toLowerCase()) && 
      !nonApprovedCpfs.includes(cpf)
    );

    setSearchResults(filtered);
    setShowResults(filtered.length > 0);
  }, [allCpfs, nonApprovedCpfs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300); 

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCpf = (cpf) => {
    dispatch(addNonApprovedCpf(cpf));
    setSearchTerm('');
    setShowResults(false);
  };

  const handleRemoveCpf = (cpf) => {
    dispatch(removeNonApprovedCpf(cpf));
  };

  const handleMarkNonApproved = async () => {
    if (nonApprovedCpfs.length === 0) {
      setStatus({ message: 'Selecione pelo menos um CPF', type: 'error' });
      return;
    }

    try {
      const data = await request({
        endpoint: '/chamadas/marcar-nao-homologados',
        method: 'POST',
        data: nonApprovedCpfs,
        isFormData: false,
      });
      
      if (data.status === 'success') {
        setStatus({ 
          message: 'Candidatos marcados como não homologados!', 
          type: 'success' 
        });
        setAvailableVacancies(data.vagas_disponiveis);
        setNextCallNumber(data.proxima_chamada);
        setShowAvailableVacancies(true);
        dispatch(clearNonApprovedCpfs());
      }
    } catch (err) {
      setStatus({ message: err.message || 'Erro ao marcar candidatos', type: 'error' });
    }
  };

  const handleSkipApproval = async () => {
    try {
      const data = await request({
        endpoint: '/chamadas/marcar-nao-homologados',
        method: 'POST',
        data: [],
        isFormData: false,
      });
      
      if (data.status === 'success') {
        setStatus({ 
          message: 'Processamento concluído sem candidatos não homologados!', 
          type: 'success' 
        });
        setAvailableVacancies(data.vagas_disponiveis);
        setNextCallNumber(data.proxima_chamada);
        setShowAvailableVacancies(true);
      }
    } catch (err) {
      setStatus({ message: err.message || 'Erro ao processar', type: 'error' });
    }
  };

  return (
    <Card 
      title="4. Informar candidatos não homologados" 
      className="mb-4" 
      style={{ display: 'none' }}
    >
      <div className="mb-3">
        <label htmlFor="cpf-search" className="form-label">
          Selecione os CPFs dos candidatos não homologados
        </label>
        <div className="search-tags-container">
          <input 
            type="text" 
            id="cpf-search" 
            className="form-control" 
            placeholder="Digite para buscar CPFs..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => searchTerm.length >= 3 && setShowResults(true)}
          />
          
          {showResults && (
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map(cpf => (
                  <div 
                    key={cpf} 
                    className="result-item"
                    onClick={() => handleAddCpf(cpf)}
                  >
                    {cpf}
                  </div>
                ))
              ) : (
                <div className="result-item">Nenhum CPF encontrado</div>
              )}
            </div>
          )}
          
          <div className="selected-tags">
            {nonApprovedCpfs.map(cpf => (
              <div key={cpf} className="tag">
                {cpf}
                <span 
                  className="remove-tag"
                  onClick={() => handleRemoveCpf(cpf)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between mt-3">
        <button 
          id="marcar-nao-homologados" 
          className="btn btn-primary"
          onClick={handleMarkNonApproved}
          disabled={loading}
        >
          {loading ? 'Processando...' : 'Marcar candidatos não homologados'}
        </button>
        <button 
          id="pular-homologacao" 
          className="btn btn-secondary"
          onClick={handleSkipApproval}
          disabled={loading}
        >
          Não há candidatos para homologação
        </button>
      </div>
      
      {error && <Alert message={error} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}
      
      {showAvailableVacancies && (
        <div id="vagas-disponiveis" className="mt-4">
          <h5>Novas vagas disponíveis</h5>
          <VacanciesTable 
            data={availableVacancies}
            headers={['Cota', 'Vagas Originais', 'Vagas Disponíveis']}
          />
          <div className="alert alert-info mt-4">
            Pronto para gerar a <span id="proxima-chamada-num">{nextCallNumber}</span>ª chamada!
          </div>
        </div>
      )}
    </Card>
  );
};

export default NonApprovedSection;