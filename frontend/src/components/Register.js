import React, { useState } from 'react';
import { api } from '../api/api';

const Register = ({ onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.register({ email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
        onRegister();
      } else {
        throw new Error('Registration failed - no token received');
      }
    } catch (error) {
      console.error('Registration failed:', error.message);
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
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
        Register
      </button>

      {error && (
        <div className="p-3 bg-burgundy/20 rounded-lg">
          <p className="text-sm font-serif text-burgundy text-center">{error}</p>
        </div>
      )}
    </form>
  );
};

export default Register;
