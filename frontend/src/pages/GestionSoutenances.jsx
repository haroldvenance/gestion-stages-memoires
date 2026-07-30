import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import {
  getSoutenances,
  getPropositions,
  createSoutenance,
  genererPV,
  getJury,
  addJuryMember,
  removeJuryMember,
} from '../services/soutenances';

const GestionSoutenances = () => {
  const [soutenances, setSoutenances] = useState([]);
  const [propositions, setPropositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSoutenance, setSelectedSoutenance] = useState(null);
  const [jury, setJury] = useState([]);
  const [showJuryForm, setShowJuryForm] = useState(false);
  const [newJuryMember, setNewJuryMember] = useState({ enseignant_id: '', role_jury: 'rapporteur' });
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [selectedPropositionId, setSelectedPropositionId] = useState('');

  const fetchData = async () => {
    try {
      const [soutRes, propRes] = await Promise.all([
        getSoutenances(),
        getPropositions(''), // Pour récupérer toutes les propositions, on peut avoir un endpoint global si nécessaire, ici on fera une boucle
      ]);
      setSoutenances(soutRes.data.results || soutRes.data);
      // Récupération des propositions pour chaque demande
      // On va simplifier : on suppose qu'on a un endpoint /propositions/ global, ou on itère.
      // Pour l'instant, on va juste afficher les soutenances.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectSoutenance = async (soutenance) => {
    setSelectedSoutenance(soutenance);
    try {
      const res = await getJury(soutenance.id);
      setJury(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenererPV = async (id) => {
    try {
      await genererPV(id);
      alert('PV généré avec succès');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la génération du PV');
    }
  };

  const handleAddJury = async (e) => {
    e.preventDefault();
    try {
      await addJuryMember(selectedSoutenance.id, newJuryMember);
      setShowJuryForm(false);
      setNewJuryMember({ enseignant_id: '', role_jury: 'rapporteur' });
      // Rafraîchir le jury
      const res = await getJury(selectedSoutenance.id);
      setJury(res.data.results || res.data);
    } catch (err) {
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveJury = async (id) => {
    if (window.confirm('Supprimer ce membre du jury ?')) {
      try {
        await removeJuryMember(id);
        const res = await getJury(selectedSoutenance.id);
        setJury(res.data.results || res.data);
      } catch (err) {
        alert('Erreur');
      }
    }
  };

  const handleCreateSoutenance = async (e) => {
    e.preventDefault();
    try {
      await createSoutenance({ proposition_id: parseInt(selectedPropositionId) });
      setShowCreationForm(false);
      setSelectedPropositionId('');
      fetchData();
      alert('Soutenance créée avec succès');
    } catch (err) {
      alert('Erreur lors de la création');
    }
  };

  const columnsSoutenances = [
    { label: 'Demande', key: 'demande_theme' },
    { label: 'Date', key: 'date_proposee' },
    { label: 'Salle', key: 'salle' },
    { label: 'Statut', key: 'statut' },
    { label: 'PV', key: 'pv_url' },
  ];

  const actionsSoutenances = (row) => (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="primary" onClick={() => handleSelectSoutenance(row)}>Détails</Button>
      {!row.pv_url && (
        <Button size="sm" variant="success" onClick={() => handleGenererPV(row.id)}>Générer PV</Button>
      )}
      {row.pv_url && (
        <a href={row.pv_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
          Télécharger
        </a>
      )}
    </div>
  );

  const columnsJury = [
    { label: 'Enseignant', key: 'enseignant_nom' },
    { label: 'Rôle', key: 'role_jury' },
  ];

  const actionsJury = (row) => (
    <button onClick={() => handleRemoveJury(row.id)} className="text-danger hover:underline text-sm">
      Supprimer
    </button>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des soutenances</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreationForm(!showCreationForm)}>
          Créer une soutenance
        </Button>
      </div>

      {showCreationForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreateSoutenance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary">ID de la proposition de créneau</label>
              <input
                type="number"
                value={selectedPropositionId}
                onChange={(e) => setSelectedPropositionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit">Valider</Button>
              <Button variant="ghost" onClick={() => setShowCreationForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Liste des soutenances">
        <DataTable columns={columnsSoutenances} data={soutenances} actions={actionsSoutenances} />
      </Card>

      {selectedSoutenance && (
        <Card title={`Détails de la soutenance #${selectedSoutenance.id}`} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Demande :</span> {selectedSoutenance.demande_theme}</p>
              <p><span className="font-medium">Date :</span> {selectedSoutenance.date_proposee}</p>
              <p><span className="font-medium">Heure :</span> {selectedSoutenance.heure_debut}</p>
              <p><span className="font-medium">Salle :</span> {selectedSoutenance.salle}</p>
              <p><span className="font-medium">Statut :</span> {selectedSoutenance.statut}</p>
              {selectedSoutenance.mention_provisoire && (
                <p><span className="font-medium">Mention :</span> {selectedSoutenance.mention_provisoire}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleGenererPV(selectedSoutenance.id)}>
                {selectedSoutenance.pv_url ? 'Regénérer le PV' : 'Générer le PV'}
              </Button>
              {selectedSoutenance.pv_url && (
                <a href={selectedSoutenance.pv_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Télécharger le PV
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Membres du jury</h3>
              <Button size="sm" variant="primary" onClick={() => setShowJuryForm(!showJuryForm)}>
                Ajouter un membre
              </Button>
            </div>
            {showJuryForm && (
              <form onSubmit={handleAddJury} className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-secondary">ID Enseignant</label>
                  <input
                    type="number"
                    value={newJuryMember.enseignant_id}
                    onChange={(e) => setNewJuryMember({ ...newJuryMember, enseignant_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-secondary">Rôle</label>
                  <select
                    value={newJuryMember.role_jury}
                    onChange={(e) => setNewJuryMember({ ...newJuryMember, role_jury: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="president">Président</option>
                    <option value="rapporteur">Rapporteur</option>
                    <option value="examinateur">Examinateur</option>
                  </select>
                </div>
                <Button type="submit">Ajouter</Button>
                <Button variant="ghost" onClick={() => setShowJuryForm(false)}>Annuler</Button>
              </form>
            )}
            <div className="mt-4">
              <DataTable columns={columnsJury} data={jury} actions={actionsJury} />
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default GestionSoutenances;