import React, { useState } from 'react';
import { api } from '../api/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.login({ email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
        onLogin();
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Login failed:', error.message);
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            required
            className="w-full px-4 py-3 bg-cream/30 border border-wood/10 rounded-lg font-serif text-wood placeholder:text-wood/50 focus:outline-none focus:ring-2 focus:ring-leather/20"
          />
        </div>
        <div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            required
            className="w-full px-4 py-3 bg-cream/30 border border-wood/10 rounded-lg font-serif text-wood placeholder:text-wood/50 focus:outline-none focus:ring-2 focus:ring-leather/20"
          />
        </div>
      </div>

      <button 
        type="submit"
        className="w-full px-6 py-3 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
      >
        Login
      </button>

      {error && (
        <div className="p-3 bg-burgundy/20 rounded-lg">
          <p className="text-sm font-serif text-burgundy text-center">{error}</p>
        </div>
      )}
    </form>
  );
};

export default Login;
