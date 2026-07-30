import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Messagerie from '../components/Messagerie';
import DocumentList from '../components/DocumentList';
import { getDemande, accepterDemande, refuserDemande } from '../services/demandes';
import AuthContext from '../context/AuthContext';

const DemandeDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' ou 'documents'

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await getDemande(id);
        setDemande(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDemande();
  }, [id]);

  const handleAccepter = async () => {
    try {
      await accepterDemande(id);
      const res = await getDemande(id);
      setDemande(res.data);
    } catch (err) {
      alert('Erreur lors de l\'acceptation');
    }
  };

  const handleRefuser = async () => {
    const commentaire = prompt('Motif du refus :');
    if (commentaire === null) return;
    try {
      await refuserDemande(id, commentaire);
      const res = await getDemande(id);
      setDemande(res.data);
    } catch (err) {
      alert('Erreur lors du refus');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!demande) {
    return (
      <Layout>
        <p className="text-center text-secondary">Demande introuvable.</p>
      </Layout>
    );
  }

  const isProprietaire = user?.role === 'etudiant' && demande.etudiant_nom === user.username;
  const isEncadreur = user?.role === 'encadreur' && demande.encadreur_souhaite_nom === user.username;
  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/dashboard" className="text-primary hover:underline">
          ← Retour au tableau de bord
        </Link>
      </div>

      <Card title={`Demande #${demande.id}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Thème :</span> {demande.theme}</p>
            <p><span className="font-medium">Étudiant :</span> {demande.etudiant_nom}</p>
            <p><span className="font-medium">Encadreur souhaité :</span> {demande.encadreur_souhaite_nom}</p>
            {demande.encadreur_effectif_nom && (
              <p><span className="font-medium">Encadreur effectif :</span> {demande.encadreur_effectif_nom}</p>
            )}
            <p><span className="font-medium">Statut :</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                demande.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                demande.statut === 'acceptee' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {demande.statut}
              </span>
            </p>
            <p><span className="font-medium">Entreprise :</span> {demande.entreprise || 'Non spécifiée'}</p>
            <p><span className="font-medium">Date de soumission :</span> {new Date(demande.date_soumission).toLocaleDateString()}</p>
            {demande.commentaire_encadreur && (
              <p><span className="font-medium">Commentaire de l'encadreur :</span> {demande.commentaire_encadreur}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-start">
            {(isEncadreur && demande.statut === 'en_attente') && (
              <div className="flex gap-2">
                <Button variant="success" onClick={handleAccepter}>Accepter</Button>
                <Button variant="danger" onClick={handleRefuser}>Refuser</Button>
              </div>
            )}
            {(isProprietaire && demande.statut === 'en_attente') && (
              <Button variant="danger">Annuler la demande</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <div className="flex gap-4 mt-6 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'messages' ? 'border-b-2 border-primary text-primary' : 'text-secondary hover:text-gray-800'}`}
          onClick={() => setActiveTab('messages')}
        >
          Messagerie
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'documents' ? 'border-b-2 border-primary text-primary' : 'text-secondary hover:text-gray-800'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'messages' ? (
          <Messagerie demandeId={parseInt(id)} />
        ) : (
          <DocumentList demandeId={parseInt(id)} />
        )}
      </div>
    </Layout>
  );
};

export default DemandeDetail;