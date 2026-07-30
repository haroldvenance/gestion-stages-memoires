import { useEffect, useState } from 'react'
import { demandesApi } from '../../api/endpoints'
import { Card, CardHeader, EmptyState } from '../../components/ui'
import ChatPanel from '../../components/ChatPanel'
import { MessageSquare } from 'lucide-react'

export default function MessagerieEncadreurPage() {
  const [demandes, setDemandes] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    demandesApi.list().then(({ data }) => {
      const results = (data.results ?? data).filter((d) => d.statut === 'acceptee')
      setDemandes(results)
      setSelected(results[0] || null)
    })
  }, [])

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <Card className="h-fit">
        <CardHeader title="Mes étudiants" />
        {demandes.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Aucune conversation" description="Acceptez des demandes pour échanger avec vos étudiants." />
        ) : (
          <ul className="px-3 pb-3">
            {demandes.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelected(d)}
                  className={`w-full text-left rounded-md px-3 py-2.5 text-sm ${
                    selected?.id === d.id ? 'bg-parchment-dark' : 'hover:bg-parchment-dark'
                  }`}
                >
                  {d.etudiant_nom}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        {selected ? (
          <ChatPanel
            demandeId={selected.id}
            destinataireId={selected.etudiant_user}
            destinataireLabel={selected.etudiant_nom}
          />
        ) : (
          <EmptyState title="Sélectionnez une conversation" />
        )}
      </Card>
    </div>
  )
}
