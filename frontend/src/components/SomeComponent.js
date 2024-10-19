import { api } from '../api/api';

const SomeComponent = () => {
  const handleGetRecommendations = async () => {
    try {
      const recommendations = await api.getRecommendations();
      // Handle the recommendations
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  // ... rest of the component
};
