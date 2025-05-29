import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  filteredData: [],
  sortConfig: { key: 'Nota Final', direction: 'desc' },
  filter: 'todas',
  nonApprovedCpfs: []
};

export const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCandidates: (state, action) => {
      state.data = action.payload;
      state.filteredData = applyFiltersAndSorting(action.payload, state.filter, state.sortConfig);
    },
    sortCandidates: (state, action) => {
      state.sortConfig = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state.filter, action.payload);
    },
    filterCandidates: (state, action) => {
      state.filter = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, action.payload, state.sortConfig);
    },
    addNonApprovedCpf: (state, action) => {
      state.nonApprovedCpfs = [...state.nonApprovedCpfs, action.payload];
    },
    removeNonApprovedCpf: (state, action) => {
      state.nonApprovedCpfs = state.nonApprovedCpfs.filter(cpf => cpf !== action.payload);
    },
    clearNonApprovedCpfs: (state) => {
      state.nonApprovedCpfs = [];
    }
  }
});

// Helper function
function applyFiltersAndSorting(data, filter, sortConfig) {
  let filtered = filter === 'todas' 
    ? [...data] 
    : data.filter(candidate => candidate['Cota do candidato'] === filter);
  
  return [...filtered].sort((a, b) => {
    let valueA = a[sortConfig.key];
    let valueB = b[sortConfig.key];
    
    if (sortConfig.key === 'Nota Final') {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }
    
    if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
    if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
    return 0;
  });
}

export const { 
  setCandidates, 
  sortCandidates, 
  filterCandidates,
  addNonApprovedCpf,
  removeNonApprovedCpf,
  clearNonApprovedCpfs
} = candidatesSlice.actions;

export default candidatesSlice.reducer;