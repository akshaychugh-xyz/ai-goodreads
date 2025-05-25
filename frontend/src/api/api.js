import axios from 'axios';

export const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL, // Keep '/api' in the baseURL
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const isDemoMode = config.isDemoMode || config.params?.isDemoMode;
    if (isDemoMode) {
      config.params = { ...config.params, isDemoMode: true };
      return config;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const getAuthHeader = (isDemoMode = false) => {
  if (isDemoMode) return {};
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  getRecommendations: async (isDemoMode = false) => {
    try {
      console.log('Making recommendations API request');
      const response = await axiosInstance.get('/recommendations', {
        params: { isDemoMode }
      });
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  importBooks: async (formData) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/import-books`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Error in importBooks:', error);
        throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
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
    return handleResponse(response);
  },

  getShelfCounts: async (isDemoMode = false) => {
    try {
      const response = await fetch(`${API_URL}/shelf-counts${isDemoMode ? '?isDemoMode=true' : ''}`, {
        headers: getAuthHeader(isDemoMode),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching shelf counts:', error);
      throw error;
    }
  },

  // Merged functions from the second file
  fetchRecommendations: async (isDemoMode = false) => {
    const response = await axiosInstance.get('/recommendations', {
      headers: getAuthHeader(isDemoMode),
      isDemoMode
    });
    return response.data;
  },

  fetchShelfCounts: async (isDemoMode = false) => {
    console.log('Making API call to fetch shelf counts...');
    const response = await axiosInstance.get(`/shelf-counts${isDemoMode ? '?isDemoMode=true' : ''}`, {
      headers: getAuthHeader()
    });
    console.log('API response for shelf counts:', response.data);
    return response.data;
  },

  verifyGoodreadsCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/verify-csv`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Remove 'Content-Type' header to let the browser set it automatically with the correct boundary
            },
            body: formData,
        });
        
        return handleResponse(response);
    } catch (error) {
        console.error('Error in verifyGoodreadsCSV:', error);
        throw error;
    }
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

  testBooks: async () => {
    const response = await axiosInstance.get('/test-books', {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  testDbConnection: async () => {
    try {
      const response = await axiosInstance.get('/test-db');
      return response.data;
    } catch (error) {
      console.error('Error testing database connection:', error);
      throw error;
    }
  },

  getUserBooks: async () => {
    try {
      const response = await axiosInstance.get('/user-books');
      return response.data;
    } catch (error) {
      console.error('Error fetching user books:', error);
      throw error;
    }
  },

  checkDatabase: async () => {
    try {
      const response = await axiosInstance.get('/check-db');
      return response.data;
    } catch (error) {
      console.error('Error checking database:', error);
      throw error;
    }
  },

  checkSchema: async () => {
    try {
      const response = await axiosInstance.get('/check-schema');
      return response.data;
    } catch (error) {
      console.error('Error checking schema:', error);
      throw error;
    }
  },

  checkConnection: async () => {
    try {
      const response = await axiosInstance.get('/check-connection');
      return response.data;
    } catch (error) {
      console.error('Error checking database connection:', error);
      throw error;
    }
  },

  getUserSummary: async () => {
    const response = await axiosInstance.get('/user-summary');
    return response.data;
  },

  getLibraryStats: async (isDemoMode = false) => {
    try {
      console.log('Making library stats API call with demo mode:', isDemoMode);
      const response = await axiosInstance.get('/library-stats', {
        params: { isDemoMode }
      });
      console.log('Library stats API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching library stats:', error);
      throw error;
    }
  },

  generateUserSummary: async (isDemoMode = false) => {
    try {
      const response = await fetch(`${API_URL}/generate-summary${isDemoMode ? '?isDemoMode=true' : ''}`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(isDemoMode),
          'Content-Type': 'application/json'
        }
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  },

  checkImportedBooks: async (isDemoMode = false) => {
    if (isDemoMode) {
      return true;
    }
    
    try {
      const response = await axiosInstance.get('/check-imported-books', {
        params: { isDemoMode }
      });
      return response.data.hasBooks;
    } catch (error) {
      console.error('Error checking imported books:', error);
      return false;
    }
  },
};

// Use this API_URL for all your API calls






