import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setWorkflowStep } from '../../store/slices/uiSlice';
import { useApi } from '../../hooks/useApi';
import Card from '../ui/Card';
import Alert from '../alerts/Alert';
import SearchableDropdown from '../ui/SearchableDropdown';

const FilterSection = () => {
  const dispatch = useDispatch();
  const { request, loading, error: apiError } = useApi();
  const [status, setStatus] = useState({ message: '', type: '' });

  const masterList = useSelector(state => state.candidates.masterList);
  
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');

  const filterOptions = useMemo(() => {
    const campi = [...new Set(masterList.map(c => c.campus))].sort();
    
    const cursos = selectedCampus 
      ? [...new Set(masterList.filter(c => c.campus === selectedCampus).map(c => c.curso))].sort()
      : [];
      
    const turnos = selectedCurso
      ? [...new Set(masterList.filter(c => c.campus === selectedCampus && c.curso === selectedCurso).map(c => c.turno))].sort()
      : [];

    return { campi, cursos, turnos };
  }, [masterList, selectedCampus, selectedCurso]);

  const handleSelectCampus = (campus) => {
    setSelectedCampus(campus);
    setSelectedCurso('');
    setSelectedTurno('');
  };

  const handleSelectCurso = (curso) => {
    setSelectedCurso(curso);
    setSelectedTurno('');
  };

  const handleApplyFilter = async () => {
    setStatus({ message: '', type: '' });
    try {
        const response = await request({
            endpoint: '/chamadas/filtro',
            method: 'POST',
            data: {
                campus: selectedCampus,
                curso: selectedCurso,
                turno: selectedTurno,
            }
        });

        if (response.status === 'success') {
            setStatus({ message: response.message, type: 'success' });
            dispatch(setWorkflowStep('filter-applied'));
        }
    } catch (err) {
        setStatus({ message: err.message, type: 'error' });
    }
  };

  const isButtonDisabled = !selectedCampus || !selectedCurso || !selectedTurno || loading;

  return (
    <Card title="2. Filtrar Candidatos por Vaga">
      <p>Selecione o campus, curso e turno para filtrar a lista de candidatos. As etapas seguintes usarão apenas os candidatos filtrados.</p>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Campus</label>
          <SearchableDropdown options={filterOptions.campi} value={selectedCampus} onChange={handleSelectCampus} placeholder="Selecione o Campus..." />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Curso</label>
          <SearchableDropdown options={filterOptions.cursos} value={selectedCurso} onChange={handleSelectCurso} placeholder="Selecione o Curso..." disabled={!selectedCampus} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Turno</label>
          <SearchableDropdown options={filterOptions.turnos} value={selectedTurno} onChange={setSelectedTurno} placeholder="Selecione o Turno..." disabled={!selectedCurso} />
        </div>
      </div>
      <button className="btn-app btn-app-primary" onClick={handleApplyFilter} disabled={isButtonDisabled}>
        {loading ? 'Aplicando Filtro...' : 'Aplicar Filtro e Continuar'}
      </button>

      {apiError && <Alert message={apiError} type="error" />}
      {status.message && <Alert message={status.message} type={status.type} />}
    </Card>
  );
};

export default FilterSection;