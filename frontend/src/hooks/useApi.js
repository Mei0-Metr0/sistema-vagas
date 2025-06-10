import { useState } from 'react';
import { api } from '../utils/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.request(endpoint, method, data);
      return response;
    } catch (err) {
      setError(err.message || 'Ocorreu um erro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};