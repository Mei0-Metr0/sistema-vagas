import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workflowStep: 'initial', 
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setWorkflowStep: (state, action) => {
      state.workflowStep = action.payload;
    },
    resetUi: () => initialState,
  },
});

export const { setWorkflowStep, resetUi } = uiSlice.actions;

export default uiSlice.reducer;