import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-secondary">
        © {new Date().getFullYear()} – Plateforme de Gestion des Stages et Mémoires
      </footer>
    </div>
  );
};

export default Layout;