import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { statistiquesApi } from '../../api/endpoints'
import { Card, CardHeader, Spinner } from '../../components/ui'

const COLORS = { en_attente: '#b7791f', acceptee: '#1e7a4c', refusee: '#b3261e' }
const LABELS = { en_attente: 'En attente', acceptee: 'Acceptées', refusee: 'Refusées' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(undefined)

  useEffect(() => {
    statistiquesApi.dashboard().then(({ data }) => setStats(data))
  }, [])

  if (stats === undefined) return <div className="flex justify-center py-16"><Spinner /></div>

  const statutData = Object.entries(stats.par_statut || {}).map(([key, value]) => ({
    name: LABELS[key] || key, value, key,
  }))
  const encadreurData = (stats.par_encadreur || []).map((e) => ({
    name: e.encadreur_effectif__user__username, total: e.total,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Pilotage</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Tableau de bord</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total demandes" value={stats.total_demandes} />
        <MetricCard label="Taux d'acceptation" value={`${stats.taux_acceptation}%`} accent="success" />
        <MetricCard label="Taux de refus" value={`${stats.taux_refus}%`} accent="danger" />
        <MetricCard label="Entreprises partenaires" value={stats.total_entreprises_partenaires} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Répartition des demandes par statut" />
          <div className="px-5 pb-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {statutData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key] || '#5b6472'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Charge par encadreur" />
          <div className="px-5 pb-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={encadreurData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#c08a28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Répartition par filière" />
        <div className="px-5 pb-5">
          <ul className="divide-y divide-line">
            {(stats.par_filiere || []).map((f) => (
              <li key={f.etudiant__filiere || 'na'} className="py-2.5 flex justify-between text-sm">
                <span className="text-ink">{f.etudiant__filiere || 'Non renseignée'}</span>
                <span className="font-medium text-ink">{f.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, accent }) {
  const colorClass = accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-ink'
  return (
    <Card className="p-5">
      <p className="text-xs text-slate mb-1">{label}</p>
      <p className={`font-display text-3xl font-semibold ${colorClass}`}>{value}</p>
    </Card>
  )
}
