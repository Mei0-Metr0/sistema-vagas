import { useSelector, useDispatch } from 'react-redux';
import { sortCandidates, filterCandidatesByCota, filterCandidatesByVagaSelecionada } from '../../store/slices/candidatesSlice';
import SortableTableHeader from './SortableTableHeader';

import '../../styles/components/candidatesTable.css';

const CandidatesTable = () => {
  const { filteredData, sortConfig, filterCotaCandidato, filterVagaSelecionada } = useSelector(state => state.candidates);
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

  const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="candidatos-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h5 className="mb-0 me-3">Candidatos chamados</h5>
        <div className="filter-options d-flex flex-wrap">
          <div className="me-3 mb-2 mb-md-0"> 
            <label htmlFor="filter-cota-candidato" className="me-2 form-label">FILTRO POR COTA DO CANDIDATO:</label>
            <select 
              id="filter-cota-candidato"
              className="form-select form-select-sm d-inline-block w-auto"
              value={filterCotaCandidato}
              onChange={handleFilterCotaChange}
            >
              <option value="todas">Todas</option>
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

          <div>
            <label htmlFor="filter-vaga-selecionada" className="me-2 form-label">FILTRO POR VAGA SELECIONADA:</label>
            <select 
              id="filter-vaga-selecionada"
              className="form-select form-select-sm d-inline-block w-auto"
              value={filterVagaSelecionada}
              onChange={handleFilterVagaSelecionadaChange}
            >
              <option value="todas">Todas</option>
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