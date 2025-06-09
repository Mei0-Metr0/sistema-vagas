import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  masterList: [],
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
    setMasterList: (state, action) => {
      state.masterList = action.payload;
    },
    setCandidates: (state, action) => {
      state.data = action.payload;

      // Aplica os filtros (agora incluindo os novos)
      state.filteredData = applyFiltersAndSorting(
        action.payload,
        state
      );
    },
    sortCandidates: (state, action) => {
      state.sortConfig = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state);
    },
    filterCandidatesByCota: (state, action) => {
      state.filterCotaCandidato = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state);
    },
    filterCandidatesByVagaSelecionada: (state, action) => {
      state.filterVagaSelecionada = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state);
    },
    addNonApprovedCpf: (state, action) => {
      state.nonApprovedCpfs = [...state.nonApprovedCpfs, action.payload];
    },
    removeNonApprovedCpf: (state, action) => {
      state.nonApprovedCpfs = state.nonApprovedCpfs.filter(cpf => cpf !== action.payload);
    },
    clearNonApprovedCpfs: (state) => {
      state.nonApprovedCpfs = [];
    },
    resetCandidates: () => initialState
  }
});

function applyFiltersAndSorting(data, filters) {
  let filtered = [...data];
  const { 
    filterCotaCandidato, 
    filterVagaSelecionada,
    sortConfig 
  } = filters;

  // Aplicar filtros
  if (filterCotaCandidato !== 'todas') {
    filtered = filtered.filter(candidate => candidate['Cota do candidato'] === filterCotaCandidato);
  }
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
  setMasterList,
  setCandidates,
  sortCandidates,
  filterCandidatesByCota,
  filterCandidatesByVagaSelecionada,
  addNonApprovedCpf,
  removeNonApprovedCpf,
  clearNonApprovedCpfs,
  resetCandidates
} = candidatesSlice.actions;

export default candidatesSlice.reducer;