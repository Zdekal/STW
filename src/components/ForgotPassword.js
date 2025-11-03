import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      setLoading(true);
      await resetPassword(email);
      setMessage('Zkontrolujte svou e-mailovou schránku pro další instrukce.');
    } catch (err) {
      setError('Nepodařilo se obnovit heslo. Zkontrolujte zadaný e-mail.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Obnova hesla</h2>
        
        {error && <p className="p-3 my-2 text-sm text-red-700 bg-red-100 rounded-lg">{error}</p>}
        {message && <p className="p-3 my-2 text-sm text-green-700 bg-green-100 rounded-lg">{message}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 sr-only">Email</label>
            <input
              id="email"
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Zadejte váš e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            disabled={loading} 
            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400" 
            type="submit"
          >
            {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovu'}
          </button>
        </form>
        
        <div className="text-sm text-center text-gray-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Zpět na přihlášení
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
