import { useSelector, useDispatch } from 'react-redux';
import {
  sortCandidates,
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada,
  filterCandidatesByCampus,
  filterCandidatesByCurso,
  filterCandidatesByTurno
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
    filterTurno,
    availableCampi,
    availableCursos,
    availableTurno
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

  const handleTurnoChange = (turno) => {
    dispatch(filterCandidatesByTurno(turno));
  };

  const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="candidatos-container mt-4">

      {/* LINHA 1: TÍTULO */}
      <div className="mb-4">
        <h5 className="mb-2 me-3 border-bottom pb-4">CANDIDATOS CHAMADOS</h5>
      </div>

      {/* LINHA 2: Filtros de Curso e Campus */}
      <div className="row g-3 mb-0">
        <div className='col-md-6'>
          <label className="form-label">FILTRAR POR CURSO:</label>
          <SearchableDropdown
            options={availableCursos}
            value={filterCurso}
            onChange={handleCursoChange}
            placeholder="PESQUISAR POR CURSO..."
          />
        </div>

        <div className='col-md-6'>
          <label className="form-label">FILTRAR POR CAMPUS:</label>
          <SearchableDropdown
            options={availableCampi}
            value={filterCampus}
            onChange={handleCampusChange}
            placeholder="PESQUISAR POR CAMPUS..."
          />
        </div>
      </div>

      {/* LINHA 3: Filtros de Turno, Cota e Vaga */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label">FILTRAR POR TURNO:</label>
          <SearchableDropdown
            options={availableTurno}
            value={filterTurno}
            onChange={handleTurnoChange}
            placeholder="PESQUISAR POR TURNO..."
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">FILTRAR POR COTA:</label>
          <select
            className="form-select"
            value={filterCotaCandidato}
            onChange={handleFilterCotaChange}
          >
            <option value="todas">TODAS AS COTAS</option>
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
            <option value="todas">TODAS AS VAGAS</option>
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