export const api = {
  async request(endpoint, method = 'GET', data = null, isFormData = false) {
    const url = `/api${endpoint}`;
    const options = {
      method,
      headers: {}
    };

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Request failed');
    }

    return responseData;
  }
};