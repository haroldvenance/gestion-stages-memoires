import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, ArrowRight } from 'lucide-react'
import { demandesApi, encadreursApi } from '../../api/endpoints'
import { Card, CardHeader, ProgressRing } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function EncadreurDashboard() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [quota, setQuota] = useState(null)

  useEffect(() => {
    demandesApi.list().then(({ data }) => setDemandes(data.results ?? data))
    encadreursApi.list().then(({ data }) => {
      const list = data.results ?? data
      const mine = list.find((e) => e.username === user.username)
      setQuota(mine || null)
    })
  }, [user.username])

  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const acceptees = demandes.filter((d) => d.statut === 'acceptee')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Espace encadreur</p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Bonjour {user.first_name || user.username}
        </h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <ProgressRing value={quota?.nombre_etudiants_acceptes ?? 0} max={quota?.quota_max ?? 0} />
          <div>
            <p className="text-xs text-slate">Charge d'encadrement</p>
            <p className="font-display font-semibold text-ink">
              {quota?.est_sature ? 'Quota atteint' : 'Places disponibles'}
            </p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate mb-1">Demandes en attente</p>
          <p className="font-display text-3xl font-semibold text-ink">{enAttente.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate mb-1">Étudiants encadrés</p>
          <p className="font-display text-3xl font-semibold text-ink">{acceptees.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Demandes récentes en attente"
          action={
            <Link to="/encadreur/demandes" className="text-sm text-academic hover:text-gold flex items-center gap-1">
              Tout voir <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="px-5 pb-5">
          {enAttente.length === 0 ? (
            <p className="text-sm text-slate py-4">Aucune demande en attente pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {enAttente.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-slate" />
                    <span className="text-ink font-medium">{d.etudiant_nom}</span>
                    <span className="text-slate">— {d.theme.slice(0, 60)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}
