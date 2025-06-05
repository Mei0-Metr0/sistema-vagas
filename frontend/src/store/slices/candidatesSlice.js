import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  filteredData: [],
  sortConfig: { key: 'Nota Final', direction: 'desc' },
  filterCotaCandidato: 'todas',
  filterVagaSelecionada: 'todas',
  nonApprovedCpfs: []
};

export const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCandidates: (state, action) => {
      state.data = action.payload;
      state.filteredData = applyFiltersAndSorting(
        action.payload, 
        state.filterCotaCandidato,
        state.filterVagaSelecionada,
        state.sortConfig
      );
    },
    sortCandidates: (state, action) => {
      state.sortConfig = action.payload;
      state.filteredData = applyFiltersAndSorting(
        state.data,
        state.filterCotaCandidato,
        state.filterVagaSelecionada,
        action.payload
      );
    },
    filterCandidatesByCota: (state, action) => {
      state.filterCotaCandidato = action.payload;
      state.filteredData = applyFiltersAndSorting(
        state.data,
        action.payload,
        state.filterVagaSelecionada,
        state.sortConfig
      );
    },
    filterCandidatesByVagaSelecionada: (state, action) => {
      state.filterVagaSelecionada = action.payload;
      state.filteredData = applyFiltersAndSorting(
        state.data,
        state.filterCotaCandidato,
        action.payload, 
        state.sortConfig
      );
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

function applyFiltersAndSorting(data, filterCotaCandidato, filterVagaSelecionada, sortConfig) {
  let filtered = [...data];

  // Aplicar filtro por Cota do Candidato
  if (filterCotaCandidato !== 'todas') {
    filtered = filtered.filter(candidate => candidate['Cota do candidato'] === filterCotaCandidato);
  }

  // Aplicar filtro por Vaga Selecionada
  if (filterVagaSelecionada !== 'todas') {
    filtered = filtered.filter(candidate => candidate['Vaga Selecionada'] === filterVagaSelecionada);
  }
  
  // Aplicar ordenação
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
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada,
  addNonApprovedCpf,
  removeNonApprovedCpf,
  clearNonApprovedCpfs
} = candidatesSlice.actions;

export default candidatesSlice.reducer;