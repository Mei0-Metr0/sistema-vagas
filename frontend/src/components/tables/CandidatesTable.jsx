import { useSelector, useDispatch } from 'react-redux';
import { sortCandidates, filterCandidates } from '../../store/slices/candidatesSlice';
import SortableTableHeader from './SortableTableHeader';

const CandidatesTable = () => {
  const { filteredData, sortConfig, filter } = useSelector(state => state.candidates);
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

  const handleFilterChange = (e) => {
    dispatch(filterCandidates(e.target.value));
  };

  if (filteredData.length === 0) {
    return <div className="text-center my-4">Nenhum candidato encontrado</div>;
  }

  const headers = Object.keys(filteredData[0]);

  return (
    <div className="candidatos-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Candidatos chamados</h5>
        <div className="filter-options">
          <label className="me-2">FILTRO POR CATEGORIA:</label>
          <select 
            id="filter-cota" 
            className="form-select form-select-sm d-inline-block w-auto"
            value={filter}
            onChange={handleFilterChange}
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
              <tr key={index}>
                {headers.map(header => (
                  <td key={`${index}-${header}`}>{candidate[header]}</td>
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