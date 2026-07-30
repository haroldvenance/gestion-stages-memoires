import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import {
  getDemandes,
} from '../services/demandes';
import {
  getSoutenances,
  createSoutenance,
  getJury,
  addJuryMember,
  removeJuryMember,
  genererPV,
  getPropositions,
} from '../services/soutenances';
import { getStatsGlobal } from '../services/stats';
import {
  FaUsers,
  FaFileAlt,
  FaCalendarCheck,
  FaUserPlus,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({});
  const [demandes, setDemandes] = useState([]);
  const [soutenances, setSoutenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSoutenanceForm, setShowSoutenanceForm] = useState(false);
  const [selectedPropositionId, setSelectedPropositionId] = useState('');
  const [propositions, setPropositions] = useState([]);
  const [showJuryModal, setShowJuryModal] = useState(null); // soutenanceId
  const [juryMembers, setJuryMembers] = useState([]);
  const [newJuryMember, setNewJuryMember] = useState({ enseignant_id: '', role_jury: 'rapporteur' });
  const [loadingJury, setLoadingJury] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, demandesRes, soutenancesRes] = await Promise.all([
          getStatsGlobal(),
          getDemandes(),
          getSoutenances(),
        ]);
        setStats(statsRes.data);
        setDemandes(demandesRes.data.results || demandesRes.data);
        setSoutenances(soutenancesRes.data.results || soutenancesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Charger les propositions pour le formulaire
  useEffect(() => {
    const fetchPropositions = async () => {
      try {
        const res = await getPropositions();
        setPropositions(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (showSoutenanceForm) {
      fetchPropositions();
    }
  }, [showSoutenanceForm]);

  // Charger le jury quand le modal est ouvert
  useEffect(() => {
    if (showJuryModal !== null) {
      const fetchJury = async () => {
        setLoadingJury(true);
        try {
          const res = await getJury(showJuryModal);
          setJuryMembers(res.data.results || res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingJury(false);
        }
      };
      fetchJury();
    }
  }, [showJuryModal]);

  const handleValiderSoutenance = async (e) => {
    e.preventDefault();
    try {
      await createSoutenance({ proposition_id: parseInt(selectedPropositionId) });
      setShowSoutenanceForm(false);
      setSelectedPropositionId('');
      const res = await getSoutenances();
      setSoutenances(res.data.results || res.data);
    } catch (err) {
      alert('Erreur lors de la validation');
    }
  };

  const handleGenererPV = async (id) => {
    try {
      await genererPV(id);
      alert('PV généré avec succès');
      const res = await getSoutenances();
      setSoutenances(res.data.results || res.data);
    } catch (err) {
      alert('Erreur lors de la génération du PV');
    }
  };

  const handleAddJuryMember = async (e) => {
    e.preventDefault();
    if (!newJuryMember.enseignant_id || !newJuryMember.role_jury) return;
    try {
      await addJuryMember(showJuryModal, newJuryMember);
      setNewJuryMember({ enseignant_id: '', role_jury: 'rapporteur' });
      const res = await getJury(showJuryModal);
      setJuryMembers(res.data.results || res.data);
    } catch (err) {
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveJuryMember = async (id) => {
    if (!window.confirm('Retirer ce membre du jury ?')) return;
    try {
      await removeJuryMember(id);
      const res = await getJury(showJuryModal);
      setJuryMembers(res.data.results || res.data);
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const columnsDemandes = [
    { label: 'Étudiant', key: 'etudiant_nom' },
    { label: 'Thème', key: 'theme' },
    { label: 'Encadreur', key: 'encadreur_souhaite_nom' },
    { label: 'Statut', key: 'statut' },
  ];

  const columnsSoutenances = [
    { label: 'Demande', key: 'demande_theme' },
    { label: 'Date', key: 'date_proposee' },
    { label: 'Salle', key: 'salle' },
    { label: 'Statut', key: 'statut' },
    { label: 'PV', key: 'pv_url' },
  ];

  const actionsSoutenances = (row) => (
    <div className="flex gap-2 justify-end flex-wrap">
      <Button
        size="sm"
        variant="primary"
        onClick={() => setShowJuryModal(row.id)}
        icon={FaUsers}
      >
        Jury
      </Button>
      {!row.pv_url ? (
        <Button size="sm" variant="success" onClick={() => handleGenererPV(row.id)}>
          Générer PV
        </Button>
      ) : (
        <a
          href={row.pv_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm underline"
        >
          Télécharger PV
        </a>
      )}
    </div>
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord administrateur</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="Utilisateurs" value={stats.total_users || 0} icon={FaUsers} color="primary" />
        <StatCard title="Demandes" value={stats.total_demandes || 0} icon={FaFileAlt} color="green" />
        <StatCard title="Soutenances" value={stats.total_soutenances || 0} icon={FaCalendarCheck} color="purple" />
        <StatCard title="En attente" value={stats.demandes_en_attente || 0} icon={FaUserPlus} color="yellow" />
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowSoutenanceForm(!showSoutenanceForm)} icon={FaPlus}>
          Valider une soutenance
        </Button>
      </div>

      {showSoutenanceForm && (
        <Card className="mb-6">
          <form onSubmit={handleValiderSoutenance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary">Proposition de créneau</label>
              <select
                value={selectedPropositionId}
                onChange={(e) => setSelectedPropositionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              >
                <option value="">Sélectionnez une proposition</option>
                {propositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.demande_id} – {p.date_proposee} à {p.heure_debut} – Salle {p.salle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <Button type="submit">Valider</Button>
              <Button variant="ghost" onClick={() => setShowSoutenanceForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Demandes récentes">
          <DataTable columns={columnsDemandes} data={demandes.slice(0, 5)} />
        </Card>
        <Card title="Soutenances">
          <DataTable columns={columnsSoutenances} data={soutenances} actions={actionsSoutenances} />
        </Card>
      </div>

      {/* Modal Jury */}
      {showJuryModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gestion du jury</h3>
              <Button variant="ghost" onClick={() => setShowJuryModal(null)}>✕</Button>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Membres actuels</h4>
              {loadingJury ? (
                <p>Chargement...</p>
              ) : juryMembers.length === 0 ? (
                <p className="text-secondary">Aucun membre</p>
              ) : (
                <ul className="divide-y">
                  {juryMembers.map((m) => (
                    <li key={m.id} className="flex justify-between py-2">
                      <span>{m.enseignant_nom} ({m.role_jury})</span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveJuryMember(m.id)}
                        icon={FaTrash}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleAddJuryMember} className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="ID enseignant"
                  value={newJuryMember.enseignant_id}
                  onChange={(e) => setNewJuryMember({ ...newJuryMember, enseignant_id: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <select
                  value={newJuryMember.role_jury}
                  onChange={(e) => setNewJuryMember({ ...newJuryMember, role_jury: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="president">Président</option>
                  <option value="rapporteur">Rapporteur</option>
                  <option value="examinateur">Examinateur</option>
                </select>
                <Button type="submit" icon={FaUsers}>Ajouter</Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default DashboardAdmin;