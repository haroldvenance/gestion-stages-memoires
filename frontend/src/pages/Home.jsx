import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FaFileAlt, FaUserCheck, FaChartLine } from 'react-icons/fa';

const Home = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Bienvenue sur la plateforme</h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto">
          Gérez vos stages et mémoires académiques en toute simplicité.
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link to="/login">
            <Button>Se connecter</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">S'inscrire</Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card title="Étudiants" subtitle="Déposez vos demandes et suivez vos soutenances">
          <p className="text-secondary">Soumettez vos thèmes, téléversez vos documents, échangez avec votre encadreur.</p>
          <div className="mt-4">
            <FaFileAlt className="text-primary text-3xl" />
          </div>
        </Card>
        <Card title="Encadreurs" subtitle="Validez et suivez vos étudiants">
          <p className="text-secondary">Acceptez ou refusez les demandes, proposez des créneaux de soutenance.</p>
          <div className="mt-4">
            <FaUserCheck className="text-accent text-3xl" />
          </div>
        </Card>
        <Card title="Administration" subtitle="Vision globale et pilotage">
          <p className="text-secondary">Gérez les utilisateurs, validez les soutenances, générez des rapports.</p>
          <div className="mt-4">
            <FaChartLine className="text-danger text-3xl" />
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Home;