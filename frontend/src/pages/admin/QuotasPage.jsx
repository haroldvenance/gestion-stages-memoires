import { useEffect, useState } from 'react'
import { statistiquesApi, encadreursApi } from '../../api/endpoints'
import { Card, ProgressRing, Input, Button } from '../../components/ui'

export default function QuotasPage() {
  const [quotas, setQuotas] = useState([])
  const [edits, setEdits] = useState({})

  function load() {
    statistiquesApi.quotas().then(({ data }) => setQuotas(data))
  }
  useEffect(load, [])

  async function handleSave(id) {
    const value = edits[id]
    if (!value) return
    await encadreursApi.updateQuota(id, Number(value))
    setEdits({ ...edits, [id]: undefined })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Régulation</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Quotas des encadreurs</h1>
        <p className="text-sm text-slate mt-1">
          Charge en temps réel et ajustement des quotas maximaux par enseignant.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotas.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={q.acceptes}
                max={q.quota_max}
                colorClass={q.sature ? 'text-danger' : 'text-gold'}
              />
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{q.nom}</p>
                <p className="text-xs text-slate">{q.departement}</p>
                {q.sature && <p className="text-xs text-danger font-medium mt-0.5">Saturé</p>}
                {q.en_attente > 0 && (
                  <p className="text-xs text-warning mt-0.5">{q.en_attente} en attente</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                type="number"
                min={0}
                placeholder={`Quota (${q.quota_max})`}
                value={edits[q.id] ?? ''}
                onChange={(e) => setEdits({ ...edits, [q.id]: e.target.value })}
              />
              <Button variant="outline" onClick={() => handleSave(q.id)}>Modifier</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
