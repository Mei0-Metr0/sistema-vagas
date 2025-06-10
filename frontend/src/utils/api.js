export const api = {
  async request({ endpoint, method = 'GET', data = null, isFormData = false }) {
    const url = `/api/v1${endpoint}`; // O proxy do Vite cuidará do redirecionamento
    const options = {
      method,
      headers: {}
    };

    if (data) {
      if (isFormData) {
        options.body = data;
        // Para FormData, o navegador define o Content-Type automaticamente.
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    let responseData;

    try {
      responseData = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error(response.statusText || `Request failed with status ${response.status}`);
      }
    }

    if (!response.ok) {
      const errorMessage = responseData && responseData.detail
        ? responseData.detail
        : (responseData && responseData.message
          ? responseData.message
          : `Request failed with status ${response.status}. No specific error message provided.`);
      throw new Error(errorMessage);
    }

    return responseData;
  }
};  