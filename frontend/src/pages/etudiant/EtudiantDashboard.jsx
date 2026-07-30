import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, FolderOpen, MessageSquare, GraduationCap, ArrowRight } from 'lucide-react'
import { demandesApi } from '../../api/endpoints'
import { Card, CardHeader, StatusStamp, Spinner, EmptyState, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function EtudiantDashboard() {
  const { user } = useAuth()
  const [demande, setDemande] = useState(undefined)

  useEffect(() => {
    demandesApi.list().then(({ data }) => {
      const results = data.results ?? data
      setDemande(results[0] || null)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">
          Espace étudiant
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Bonjour {user.first_name || user.username}
        </h1>
        <p className="text-sm text-slate mt-1">
          Suivez ici l'avancement de votre dossier de stage et mémoire.
        </p>
      </div>

      {demande === undefined && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {demande === null && (
        <Card>
          <EmptyState
            icon={FileText}
            title="Aucune demande en cours"
            description="Soumettez votre thème de stage/mémoire pour démarrer le processus d'encadrement."
            action={
              <Link to="/etudiant/demande">
                <Button variant="gold">Soumettre ma demande</Button>
              </Link>
            }
          />
        </Card>
      )}

      {demande && (
        <>
          <Card>
            <CardHeader
              eyebrow={`Dossier N° ${demande.id}`}
              title={demande.theme}
              action={<StatusStamp status={demande.statut} />}
            />
            <div className="px-5 pb-5 grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate">Encadreur souhaité</p>
                <p className="font-medium text-ink">{demande.encadreur_souhaite_nom || '—'}</p>
              </div>
              <div>
                <p className="text-slate">Entreprise / structure</p>
                <p className="font-medium text-ink">{demande.entreprise || '—'}</p>
              </div>
              <div>
                <p className="text-slate">Éligibilité soutenance</p>
                <p className="font-medium text-ink">{demande.eligible_soutenance ? 'Oui' : 'Pas encore'}</p>
              </div>
            </div>
            {demande.statut === 'refusee' && demande.commentaire_encadreur && (
              <div className="mx-5 mb-5 rounded-md bg-danger-bg text-danger text-sm px-4 py-3">
                <strong>Motif du refus :</strong> {demande.commentaire_encadreur}
              </div>
            )}
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <QuickLink to="/etudiant/documents" icon={FolderOpen} label="Mes documents" />
            <QuickLink to="/etudiant/messagerie" icon={MessageSquare} label="Messagerie" />
            <QuickLink to="/etudiant/soutenance" icon={GraduationCap} label="Soutenance" />
          </div>
        </>
      )}
    </div>
  )
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to}>
      <Card className="p-4 flex items-center justify-between hover:border-gold transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-academic/10 text-academic flex items-center justify-center">
            <Icon size={18} />
          </div>
          <span className="text-sm font-medium text-ink">{label}</span>
        </div>
        <ArrowRight size={16} className="text-slate" />
      </Card>
    </Link>
  )
}
