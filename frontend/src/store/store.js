import { configureStore } from '@reduxjs/toolkit';
import candidatesReducer from './slices/candidatesSlice';
import callReducer from './slices/callSlice';
import vacanciesReducer from './slices/vacanciesSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    candidates: candidatesReducer,
    call: callReducer,
    vacancies: vacanciesReducer,
    ui: uiReducer
  }
});