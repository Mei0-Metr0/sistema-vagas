import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  distribution: {
    AC: 22,
    LI_EP: 6,
    LI_PCD: 1,
    LI_Q: 0,
    LI_PPI: 4,
    LB_EP: 5,
    LB_PCD: 1,
    LB_Q: 1,
    LB_PPI: 4
  },
  confirmed: false
};

export const vacanciesSlice = createSlice({
  name: 'vacancies',
  initialState,
  reducers: {
    setDistribution: (state, action) => {
      state.distribution = action.payload;
    },
    confirmDistribution: (state) => {
      state.confirmed = true;
    },
    resetVacancies: () => initialState
  }
});

export const { setDistribution, confirmDistribution, resetVacancies } = vacanciesSlice.actions;

export default vacanciesSlice.reducer;