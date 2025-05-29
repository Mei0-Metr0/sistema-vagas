import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCall: 0,
  vacanciesInfo: [],
  balance: []
};

export const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setCallData: (state, action) => {
      state.currentCall = action.payload.chamada_num;
      state.vacanciesInfo = action.payload.vagas_info;
      state.balance = action.payload.saldo_vagas;
    },
    incrementCall: (state) => {
      state.currentCall += 1;
    }
  }
});

export const { setCallData, incrementCall } = callSlice.actions;

export default callSlice.reducer;