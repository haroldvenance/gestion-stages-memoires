import { useEffect, useState } from 'react'
import { auditApi } from '../../api/endpoints'
import { Card, EmptyState } from '../../components/ui'
import { ShieldAlert } from 'lucide-react'
import clsx from 'clsx'

export default function AuditPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    auditApi.list().then(({ data }) => setLogs(data.results ?? data))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Sécurité</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Journal d'audit</h1>
        <p className="text-sm text-slate mt-1">
          Traçabilité des actions sensibles et des accès refusés sur la plateforme.
        </p>
      </div>

      <Card>
        {logs.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Aucun évènement enregistré" />
        ) : (
          <ul className="divide-y divide-line px-5">
            {logs.map((log) => (
              <li key={log.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="text-ink">
                    <span className="font-medium">{log.utilisateur_nom || 'Anonyme'}</span>{' '}
                    <span className="text-slate">{log.action}</span>
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    {new Date(log.horodatage).toLocaleString('fr-FR')} · {log.adresse_ip}
                  </p>
                </div>
                <span
                  className={clsx(
                    'text-xs font-semibold uppercase px-2 py-0.5 rounded-full shrink-0',
                    log.niveau === 'security' ? 'bg-danger-bg text-danger' : 'bg-info-bg text-info'
                  )}
                >
                  {log.statut_code}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
