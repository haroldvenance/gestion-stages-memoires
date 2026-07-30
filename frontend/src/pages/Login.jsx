import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      // Redirection selon rôle
      switch (user.role) {
        case 'etudiant':
          navigate('/dashboard/etudiant');
          break;
        case 'encadreur':
          navigate('/dashboard/encadreur');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto pt-10">
        <Card title="Connexion" subtitle="Accédez à votre espace">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Votre nom d'utilisateur"
            />
            <Input
              label="Mot de passe"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-secondary">
            Pas encore de compte ? <a href="/register" className="text-primary hover:underline">Inscrivez-vous</a>
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;