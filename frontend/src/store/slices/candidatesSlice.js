import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  masterList: [],
  data: [],
  filteredData: [],
  sortConfig: { key: 'Nota Final', direction: 'desc' },
  filterCotaCandidato: 'todas',
  filterVagaSelecionada: 'todas',
  filterCampus: 'TODOS',
  filterCurso: 'TODOS',
  filterTurno: 'TODOS',
  availableCampi: [],
  availableCursos: [],
  availableTurno: [],
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

      // Extrai opções únicas de Campus e Curso dos dados carregados
      const allCampi = [...new Set(action.payload.map(c => c['Campus']).filter(Boolean))].sort();
      const allCursos = [...new Set(action.payload.map(c => c['Curso']).filter(Boolean))].sort();
      const allTurnos = [...new Set(action.payload.map(c => c['Turno']).filter(Boolean))].sort();
      state.availableCampi = ['TODOS', ...allCampi];
      state.availableCursos = ['TODOS', ...allCursos];
      state.availableTurno = ['TODOS', ...allTurnos];

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
    // Novas actions para os filtros de Campus e Curso
    filterCandidatesByCampus: (state, action) => {
      state.filterCampus = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state);
    },
    filterCandidatesByCurso: (state, action) => {
      state.filterCurso = action.payload;
      state.filteredData = applyFiltersAndSorting(state.data, state);
    },
    filterCandidatesByTurno: (state, action) => {
      state.filterTurno= action.payload;
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
    filterCampus, 
    filterCurso,
    filterTurno,
    sortConfig 
  } = filters;

  // Aplicar filtros
  if (filterCotaCandidato !== 'todas') {
    filtered = filtered.filter(candidate => candidate['Cota do candidato'] === filterCotaCandidato);
  }
  if (filterVagaSelecionada !== 'todas') {
    filtered = filtered.filter(candidate => candidate['Vaga Selecionada'] === filterVagaSelecionada);
  }
  if (filterCampus !== 'TODOS') {
    filtered = filtered.filter(candidate => candidate['Campus'] === filterCampus);
  }
  if (filterCurso !== 'TODOS') {
    filtered = filtered.filter(candidate => candidate['Curso'] === filterCurso);
  }
  if (filterTurno !== 'TODOS') {
    filtered = filtered.filter(candidate => candidate['Turno'] === filterTurno);
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
  filterCandidatesByCampus,
  filterCandidatesByCurso,
  filterCandidatesByTurno,
  addNonApprovedCpf,
  removeNonApprovedCpf,
  clearNonApprovedCpfs,
  resetCandidates
} = candidatesSlice.actions;

export default candidatesSlice.reducer;