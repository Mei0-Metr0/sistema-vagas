import { useSelector, useDispatch } from 'react-redux';
import {
  sortCandidates,
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada
} from '../../store/slices/candidatesSlice';

import SortableTableHeader from './SortableTableHeader';
import '../../styles/components/candidatesTable.css';

const CandidatesTable = () => {
  const {
    filteredData,
    sortConfig,
    filterCotaCandidato,
    filterVagaSelecionada
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

  const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="candidatos-container mt-4">
      {/* ======================= INÍCIO DA ALTERAÇÃO DE LAYOUT ======================= */}
      {/* Usamos Flexbox para alinhar o título à esquerda e os filtros à direita */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Título à esquerda */}
        <h5 className="mb-0">CANDIDATOS CHAMADOS</h5>

        {/* Container para os filtros à direita */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <label htmlFor="filter-cota" className="form-label me-2 small mb-0 text-nowrap">COTA DO CANDIDATO:</label>
            <select
              id="filter-cota"
              className="form-select form-select-sm"
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

          {/* 2. Repetido o mesmo padrão para o segundo filtro */}
          <div className="d-flex align-items-center">
            <label htmlFor="filter-vaga" className="form-label me-2 small mb-0 text-nowrap">VAGA SELECIONADA:</label>
            <select
              id="filter-vaga"
              className="form-select form-select-sm"
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
      {/* ======================== FIM DA ALTERAÇÃO DE LAYOUT ========================= */}

      {/* REMOVIDAS: As linhas antigas de filtros */}

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