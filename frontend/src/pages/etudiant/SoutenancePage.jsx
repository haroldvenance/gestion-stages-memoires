import { useEffect, useState } from 'react'
import { GraduationCap, Download } from 'lucide-react'
import { soutenancesApi } from '../../api/endpoints'
import { Card, CardHeader, StatusStamp, Spinner, EmptyState, Button } from '../../components/ui'

export default function SoutenancePage() {
  const [soutenance, setSoutenance] = useState(undefined)

  useEffect(() => {
    soutenancesApi.list().then(({ data }) => {
      const results = data.results ?? data
      setSoutenance(results[0] || null)
    })
  }, [])

  async function handleDownload() {
    const { data } = await soutenancesApi.telechargerConvocation(soutenance.id)
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `convocation_${soutenance.id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (soutenance === undefined) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Fin de parcours</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Ma soutenance</h1>
      </div>

      {!soutenance ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Aucune soutenance planifiée"
            description="Votre soutenance apparaîtra ici une fois planifiée par l'administration, après validation de votre dossier par votre encadreur."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader
            eyebrow={`Soutenance N° ${soutenance.id}`}
            title={new Date(soutenance.date_proposee).toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
            action={<StatusStamp status={soutenance.statut} />}
          />
          <div className="px-5 pb-5 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate">Heure</p>
              <p className="font-medium text-ink">{soutenance.heure_debut}</p>
            </div>
            <div>
              <p className="text-slate">Salle</p>
              <p className="font-medium text-ink">{soutenance.salle}</p>
            </div>
            <div>
              <p className="text-slate">Durée</p>
              <p className="font-medium text-ink">{soutenance.duree_heures} h</p>
            </div>
          </div>
          {soutenance.statut === 'validee' && (
            <div className="px-5 pb-5">
              <Button variant="outline" onClick={handleDownload}>
                <Download size={16} /> Télécharger ma convocation
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
