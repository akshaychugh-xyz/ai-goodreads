import axios from 'axios';

const API_URL = '/api';

export const fetchRecommendations = async () => {
    const response = await axios.get(`${API_URL}/recommendations`);
    return response.data;
};

export const fetchShelfCounts = async () => {
    const response = await axios.get(`${API_URL}/shelf-counts`);
    return response.data;
};

export const verifyGoodreadsCSV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Sending request to:', '/api/verify-csv');
    const response = await fetch('/api/verify-csv', {
        method: 'POST',
        body: formData,
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Raw response:', text);

    if (!response.ok) {
        throw new Error(`Failed to verify CSV: ${text}`);
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Invalid response from server');
    }
};

export const replaceDataFolder = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/replace-data', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to replace data folder');
    }

    return response.json();
};