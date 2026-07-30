import { useEffect, useState } from 'react'
import { demandesApi } from '../../api/endpoints'
import { Card, Spinner, EmptyState } from '../../components/ui'
import ChatPanel from '../../components/ChatPanel'
import { MessageSquare } from 'lucide-react'

export default function MessageriePage() {
  const [demande, setDemande] = useState(undefined)

  useEffect(() => {
    demandesApi.list().then(({ data }) => {
      const results = data.results ?? data
      setDemande(results[0] || null)
    })
  }, [])

  if (demande === undefined) return <div className="flex justify-center py-16"><Spinner /></div>

  if (!demande || !demande.encadreur_effectif) {
    return (
      <Card>
        <EmptyState
          icon={MessageSquare}
          title="Messagerie indisponible"
          description="La messagerie s'active dès qu'un encadreur a été officiellement validé pour votre dossier."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Suivi</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Messagerie</h1>
      </div>
      <Card>
        <ChatPanel
          demandeId={demande.id}
          destinataireId={demande.encadreur_effectif_user}
          destinataireLabel={demande.encadreur_effectif_nom || 'Encadreur'}
        />
      </Card>
    </div>
  )
}
