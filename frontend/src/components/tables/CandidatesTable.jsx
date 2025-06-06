import { useSelector, useDispatch } from 'react-redux';
import {
  sortCandidates,
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada,
  filterCandidatesByCampus,
  filterCandidatesByCurso,
} from '../../store/slices/candidatesSlice';
import SortableTableHeader from './SortableTableHeader';
import SearchableDropdown from '../ui/SearchableDropdown';
import '../../styles/components/candidatesTable.css';

const CandidatesTable = () => {
  const {
    filteredData,
    sortConfig,
    filterCotaCandidato,
    filterVagaSelecionada,
    filterCampus,
    filterCurso,
    availableCampi,
    availableCursos
  } = useSelector(state => state.candidates);

  const dispatch = useDispatch();

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      direction = key === 'Nota Final' ? 'desc' : 'asc';
    }
    dispatch(sortCandidates({ key, direction }));
  };

  const handleFilterCotaChange = (e) => {
    dispatch(filterCandidatesByCota(e.target.value));
  };

  const handleFilterVagaSelecionadaChange = (e) => {
    dispatch(filterCandidatesByVagaSelecionada(e.target.value));
  };
  
  const handleCampusChange = (campus) => {
    dispatch(filterCandidatesByCampus(campus));
  };

  const handleCursoChange = (curso) => {
    dispatch(filterCandidatesByCurso(curso));
  };

  const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="candidatos-container mt-4">

      {/* LINHA 1: Filtros de Curso e Campus */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h5 className="mb-0 me-3">Candidatos chamados</h5>
        
        <div style={{ minWidth: '400px' }}>
          <label className="form-label d-none">FILTRAR POR CURSO:</label>
          <SearchableDropdown
            options={availableCursos}
            value={filterCurso}
            onChange={handleCursoChange}
            placeholder="Pesquisar por curso..."
          />
        </div>

        <div style={{ minWidth: '400px' }}>
          <label className="form-label d-none">FILTRAR POR CAMPUS:</label>
          <SearchableDropdown
            options={availableCampi}
            value={filterCampus}
            onChange={handleCampusChange}
            placeholder="Pesquisar por campus..."
          />
        </div>
      </div>

      {/* LINHA 2: Filtros restantes (Campus, Cota, Vaga) */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label">FILTRAR POR COTA:</label>
          <select
            className="form-select"
            value={filterCotaCandidato}
            onChange={handleFilterCotaChange}
          >
            <option value="todas">Todas as Cotas</option>
            <option value="AC">AC</option>
            <option value="LI_EP">LI_EP</option>
            <option value="LI_PCD">LI_PCD</option>
            <option value="LI_Q">LI_Q</option>
            <option value="LI_PPI">LI_PPI</option>
            <option value="LB_EP">LB_EP</option>
            <option value="LB_PCD">LB_PCD</option>
            <option value="LB_Q">LB_Q</option>
            <option value="LB_PPI">LB_PPI</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">FILTRAR POR VAGA:</label>
          <select
            className="form-select"
            value={filterVagaSelecionada}
            onChange={handleFilterVagaSelecionadaChange}
          >
            <option value="todas">Todas as Vagas</option>
            <option value="AC">AC</option>
            <option value="LI_EP">LI_EP</option>
            <option value="LI_PCD">LI_PCD</option>
            <option value="LI_Q">LI_Q</option>
            <option value="LI_PPI">LI_PPI</option>
            <option value="LB_EP">LB_EP</option>
            <option value="LB_PCD">LB_PCD</option>
            <option value="LB_Q">LB_Q</option>
            <option value="LB_PPI">LB_PPI</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sortable">
          <thead>
            <tr>
              {headers.map(header => (
                <SortableTableHeader 
                  key={header}
                  column={header}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((candidate, index) => (
              <tr key={candidate.ID || index}>
                {headers.map(header => (
                  <td key={`${candidate.ID || index}-${header}`}>{candidate[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesTable;