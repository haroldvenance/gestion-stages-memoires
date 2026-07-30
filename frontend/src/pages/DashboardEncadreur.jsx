import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';

const DashboardEncadreur = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord encadreur</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Demandes reçues">
          <p className="text-secondary">Aucune demande en attente.</p>
        </Card>
        <Card title="Mes étudiants">
          <p className="text-secondary">Aucun étudiant assigné.</p>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardEncadreur;