export const api = {
  async request({ endpoint, method = 'GET', data = null, isFormData = false }) {
    const url = `/api/v1${endpoint}`; // O proxy do Vite cuidará do redirecionamento
    const options = {
      method,
      headers: {}
    };

    console.info("API Request:", {
      url,
      method,
      data,
      isFormData
    });

    if (data) {
      if (isFormData) {
        options.body = data;
        // Para FormData, o navegador define o Content-Type automaticamente,
        // incluindo o 'boundary' necessário. Não o defina manualmente.
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(responseData.message || 'Request failed');
    }

    const responseData = await response.json();

    return responseData;
  }
};