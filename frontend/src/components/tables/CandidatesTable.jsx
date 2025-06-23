import { useSelector, useDispatch } from 'react-redux';
import {
  sortCandidates,
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada,
  addNonApprovedCpf,
  removeNonApprovedCpf
} from '../../store/slices/candidatesSlice';

import SortableTableHeader from './SortableTableHeader';
import '../../styles/components/candidatesTable.css';
import { Download } from 'react-bootstrap-icons';

const formatOrdinalFeminine = (n) => {
  if (n === null || n === undefined || isNaN(parseInt(n))) return '';
  return `${n}ª`;
};

const formatOrdinalMasculine = (n) => {
  if (n === null || n === undefined || isNaN(parseInt(n))) return '';
  return `${n}º`;
};

const CandidatesTable = () => {
  const {
    data,
    filteredData,
    sortConfig,
    filterCotaCandidato,
    filterVagaSelecionada,
    nonApprovedCpfs
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

  const handleCheckboxChange = (cpf, isChecked) => {
    if (isChecked) {
      dispatch(addNonApprovedCpf(cpf));
    } else {
      dispatch(removeNonApprovedCpf(cpf));
    }
  };

  const handleFilterCotaChange = (e) => {
    dispatch(filterCandidatesByCota(e.target.value));
  };

  const handleFilterVagaSelecionadaChange = (e) => {
    dispatch(filterCandidatesByVagaSelecionada(e.target.value));
  };

  const handleDownloadAll = () => {
    const url = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/chamadas/relatorio-geral-curso`;
    window.location.href = url;
  };


  let headers = [];
  const classificationHeaders = [
    'Class_AC', 'Class_LI_EP', 'Class_LI_PCD', 'Class_LI_Q', 'Class_LI_PPI',
    'Class_LB_EP', 'Class_LB_PCD', 'Class_LB_Q', 'Class_LB_PPI'
  ];

  if (data.length > 0) {
    const allKeys = Object.keys(data[0]);
    const baseHeaders = allKeys.filter(header =>
      !classificationHeaders.includes(header) && header !== 'NH'
    );
    headers = ['NH', 'ID', ...baseHeaders.filter(h => h !== 'ID'), ...classificationHeaders];
  }

  const formatCellData = (candidate, header) => {
    const value = candidate[header];
    if (value === undefined || value === null) return '';

    // if (header === 'Opção' || header === 'Chamada') {
    //   return formatOrdinalFeminine(value) + (header === 'Opção' ? ' opção' : ' chamada');
    // }

    if (header.startsWith('Class_')) {
      return formatOrdinalMasculine(value);
    }
    return String(value);
  };


  return (
    <div className="candidatos-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <h5 className="mb-0">CANDIDATOS CHAMADOS</h5>
        {data.length > 0 && (
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center">
              <label htmlFor="filter-cota" className="form-label me-2 small mb-0 text-nowrap">COTA DO CANDIDATO:</label>
              <select id="filter-cota" className="form-select form-select-sm" value={filterCotaCandidato} onChange={handleFilterCotaChange}>
                <option value="todas">Todas</option>
                <option value="AC">AC</option><option value="LI_EP">LI_EP</option><option value="LI_PCD">LI_PCD</option><option value="LI_Q">LI_Q</option><option value="LI_PPI">LI_PPI</option>
                <option value="LB_EP">LB_EP</option><option value="LB_PCD">LB_PCD</option><option value="LB_Q">LB_Q</option><option value="LB_PPI">LB_PPI</option>
              </select>
            </div>
            <div className="d-flex align-items-center">
              <label htmlFor="filter-vaga" className="form-label me-2 small mb-0 text-nowrap">VAGA SELECIONADA:</label>
              <select id="filter-vaga" className="form-select form-select-sm" value={filterVagaSelecionada} onChange={handleFilterVagaSelecionadaChange}>
                <option value="todas">Todas</option>
                <option value="AC">AC</option><option value="LI_EP">LI_EP</option><option value="LI_PCD">LI_PCD</option><option value="LI_Q">LI_Q</option><option value="LI_PPI">LI_PPI</option>
                <option value="LB_EP">LB_EP</option><option value="LB_PCD">LB_PCD</option><option value="LB_Q">LB_Q</option><option value="LB_PPI">LB_PPI</option>
              </select>
            </div>
            <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-2" onClick={handleDownloadAll} title="Baixar CSV com todos os candidatos do curso filtrado">
              <Download />
              DOWNLOAD GERAL
            </button>
          </div>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sortable">
          <thead>
            {headers.length > 0 && (
              <tr>
                {headers.map(header => (
                  (header === 'NH' || header === 'ID') ? (
                    <th key={header}>{header}</th>
                  ) : (
                    <SortableTableHeader key={header} column={header} sortConfig={sortConfig} onSort={handleSort} />
                  )
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((candidate, index) => (
                <tr key={candidate.ID || index}>
                  <td><input type="checkbox" className="form-check-input" checked={nonApprovedCpfs.includes(candidate.CPF)} onChange={(e) => handleCheckboxChange(candidate.CPF, e.target.checked)} /></td>
                  <td>{index + 1}</td>
                  {headers.filter(h => h !== 'NH' && h !== 'ID').map(header => (
                    <td key={`${candidate.ID || index}-${header}`}>{formatCellData(candidate, header)}</td>
                  ))}
                </tr>
              ))
            ) : (
              data.length > 0 && (
                <tr>
                  <td colSpan={headers.length} className="text-center">
                    Nenhum candidato encontrado para os filtros selecionados.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesTable;