import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  getRecommendations: async () => {
    const response = await fetch(`${API_URL}/recommendations`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return response.json();
  },

  importBooks: async (formData) => {
    const response = await fetch(`${API_URL}/import-books`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Login failed');
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Registration failed');
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getProtectedData: async () => {
    const response = await fetch(`${API_URL}/protected-route`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return response.json();
  },

  getShelfCounts: async () => {
    try {
      const response = await fetch(`${API_URL}/shelf-counts`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch shelf counts');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching shelf counts:', error);
      throw error;
    }
  },

  // Merged functions from the second file
  fetchRecommendations: async () => {
    const response = await axiosInstance.get('/recommendations', {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  fetchShelfCounts: async () => {
    const response = await axiosInstance.get(`/shelf-counts?_=${Date.now()}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  verifyGoodreadsCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/verify-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Failed to verify CSV: ${await response.text()}`);
    }
    return response.json();
  },

  replaceDataFolder: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/replace-data', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      });
      const text = await response.text();
      console.log('Raw server response:', text);
      if (!response.ok) {
        throw new Error(`Failed to replace data folder: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error) {
      console.error('Error replacing data folder:', error);
      throw error;
    }
  },

  // Note: This login function uses axios, which is different from the existing one.
  // You may want to choose one implementation or the other.
  loginWithAxios: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Use this API_URL for all your API calls





