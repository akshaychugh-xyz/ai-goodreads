import axios from 'axios';

const API_URL = '/api';

export const fetchRecommendations = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/recommendations`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const fetchShelfCounts = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/shelf-counts?_=${Date.now()}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const verifyGoodreadsCSV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    console.log('Token being sent:', token);

    const response = await fetch('/api/verify-csv', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to verify CSV: ${await response.text()}`);
    }

    return response.json();
};

export const replaceDataFolder = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/replace-data', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
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
};

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token } = response.data;
        localStorage.setItem('token', token);
        return token;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error;
    }
};
