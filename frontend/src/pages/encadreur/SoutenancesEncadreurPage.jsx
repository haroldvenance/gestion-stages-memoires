import { useEffect, useState } from 'react'
import { soutenancesApi } from '../../api/endpoints'
import { Card, StatusStamp, EmptyState } from '../../components/ui'
import { GraduationCap } from 'lucide-react'

export default function SoutenancesEncadreurPage() {
  const [soutenances, setSoutenances] = useState([])

  useEffect(() => {
    soutenancesApi.list().then(({ data }) => setSoutenances(data.results ?? data))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Planning</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Mes soutenances</h1>
      </div>

      <Card>
        {soutenances.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Aucune soutenance planifiée" />
        ) : (
          <ul className="divide-y divide-line px-5">
            {soutenances.map((s) => (
              <li key={s.id} className="py-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink">{s.demande_etudiant_nom || `Dossier #${s.demande}`}</p>
                  <p className="text-slate text-xs mt-0.5">
                    {new Date(s.date_proposee).toLocaleDateString('fr-FR')} à {s.heure_debut} — Salle {s.salle}
                  </p>
                </div>
                <StatusStamp status={s.statut} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
