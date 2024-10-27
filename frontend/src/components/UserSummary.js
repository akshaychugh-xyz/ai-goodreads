import React, { useState } from 'react';
import { api } from '../api/api';

const UserSummary = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getUserSummary();
      setSummary(response.summary);
    } catch (err) {
      setError('Failed to fetch summary. Please try again.');
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={fetchSummary}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? 'Generating...' : 'Generate Sassy Summary'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {summary && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-xl font-bold mb-2">Your Sassy Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default UserSummary;