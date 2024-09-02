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