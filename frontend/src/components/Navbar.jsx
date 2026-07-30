import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaUserCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    if (user?.role === 'etudiant') return <FaUserGraduate className="text-primary" />;
    if (user?.role === 'encadreur') return <FaChalkboardTeacher className="text-accent" />;
    if (user?.role === 'admin') return <FaUserCog className="text-danger" />;
    return null;
  };

  const getRoleDisplay = () => {
    if (user?.role === 'etudiant') return 'Étudiant';
    if (user?.role === 'encadreur') return 'Encadreur';
    if (user?.role === 'admin') return 'Admin';
    return '';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <FaUserGraduate className="text-2xl" />
            <span>Gestion Stages</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <span className="flex items-center gap-2 text-sm font-medium text-secondary">
                  {getRoleIcon()}
                  <span className="capitalize">{user.username}</span>
                  <span className="text-xs text-gray-400">({getRoleDisplay()})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-secondary hover:text-danger transition-colors"
                >
                  <FaSignOutAlt />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-primary hover:underline">
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-700 hover:text-primary"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                {getRoleIcon()}
                <span className="capitalize">{user.username}</span>
                <span className="text-xs text-gray-400">({getRoleDisplay()})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-secondary hover:text-danger transition-colors"
              >
                <FaSignOutAlt />
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="block text-sm text-primary hover:underline">
              Connexion
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;