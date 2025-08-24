import { axiosClient } from "./Api/axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const Navigate = useNavigate();

  useEffect(() => {
    if (window.localStorage.getItem('ACCESS_TOKEN') === "allowed") {
      Navigate("/table");
    }
  }, [Navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    const value = { email, password };

    try {
      await axiosClient.get('/sanctum/csrf-cookie');
      await axiosClient.post('/login', value);
      const response = await axiosClient.get('/api/user');

      if (response.status === 200) {
        alert('Accès autorisé');
        window.localStorage.setItem("ADMIN_INFO",JSON.stringify(response.data))
        window.localStorage.setItem('ACCESS_TOKEN', 'allowed');
      }

      console.log(response.data);

      if (response.data.role === "admin") {
        alert('Vous êtes administrateur');
        Navigate('/table');
      } else {
        alert('Utilisateur standard connecté');
      }

    } catch (error) {
      console.error('Échec de la connexion:', error.response?.data || error.message);
      setError("⚠️ Identifiants incorrects : mot de pass ou email est incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-sky-800">Connectez-vous à votre compte</h2>

        {/* Message d'erreur */}
        {error && (
          <div className="text-center text-red-700 bg-red-100 border border-red-400 px-4 py-2 rounded-md my-4">
            {error}
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-gray-600">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white py-2 px-4 rounded-md shadow"
          >
            Se connecter
          </button>
        </form>

        <div className="text-sm text-center text-gray-600 mt-4">
          Vous n'avez pas de compte ?{' '}
          <Link to="/register" className="text-sky-600 hover:underline font-medium">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}