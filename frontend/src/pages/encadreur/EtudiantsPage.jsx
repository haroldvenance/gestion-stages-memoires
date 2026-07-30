import { useEffect, useState } from 'react'
import { Download, CheckCircle2 } from 'lucide-react'
import { demandesApi, documentsApi } from '../../api/endpoints'
import { Card, CardHeader, Button, Textarea, Alert, EmptyState, StatusStamp } from '../../components/ui'
import { Users } from 'lucide-react'

export default function EtudiantsPage() {
  const [demandes, setDemandes] = useState([])
  const [selected, setSelected] = useState(null)
  const [documents, setDocuments] = useState([])
  const [commentaires, setCommentaires] = useState({})
  const [message, setMessage] = useState(null)

  function loadDemandes() {
    demandesApi.list().then(({ data }) => {
      const results = (data.results ?? data).filter((d) => d.statut === 'acceptee')
      setDemandes(results)
    })
  }
  useEffect(loadDemandes, [])

  function openStudent(d) {
    setSelected(d)
    setMessage(null)
    documentsApi.list({ demande: d.id }).then(({ data }) => setDocuments(data.results ?? data))
  }

  async function handleAnnoter(docId) {
    const commentaire = commentaires[docId]
    if (!commentaire) return
    await documentsApi.annoter(docId, commentaire)
    setCommentaires({ ...commentaires, [docId]: '' })
    openStudent(selected)
  }

  async function handleQuitus() {
    try {
      await demandesApi.validerFinale(selected.id)
      setMessage({ type: 'success', text: "Le dossier est désormais éligible à la soutenance." })
      loadDemandes()
      const { data } = await demandesApi.get(selected.id)
      setSelected(data)
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.detail || 'Une erreur est survenue.' })
    }
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <Card className="h-fit">
        <CardHeader title="Étudiants encadrés" />
        {demandes.length === 0 ? (
          <EmptyState icon={Users} title="Aucun étudiant" description="Acceptez des demandes pour les voir apparaître ici." />
        ) : (
          <ul className="px-3 pb-3">
            {demandes.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => openStudent(d)}
                  className={`w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors ${
                    selected?.id === d.id ? 'bg-parchment-dark' : 'hover:bg-parchment-dark'
                  }`}
                >
                  <p className="font-medium text-ink">{d.etudiant_nom}</p>
                  <p className="text-xs text-slate truncate">{d.theme}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="space-y-4">
        {!selected ? (
          <Card>
            <EmptyState title="Sélectionnez un étudiant" description="Choisissez un dossier dans la liste pour consulter ses documents." />
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader
                eyebrow={`Dossier N° ${selected.id}`}
                title={selected.etudiant_nom}
                action={
                  selected.eligible_soutenance ? (
                    <StatusStamp status="eligible" label="Éligible soutenance" />
                  ) : (
                    <Button variant="gold" onClick={handleQuitus}>
                      <CheckCircle2 size={15} /> Valider pour soutenance
                    </Button>
                  )
                }
              />
              <div className="px-5 pb-5">
                {message && <Alert variant={message.type}>{message.text}</Alert>}
                <p className="text-sm text-slate mt-2">{selected.theme}</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Documents déposés" />
              <div className="px-5 pb-5">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate py-4">Aucun document déposé.</p>
                ) : (
                  <ul className="space-y-4">
                    {documents.map((doc) => (
                      <li key={doc.id} className="border border-line rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">
                            V{doc.version} — {doc.type_doc}
                          </p>
                          <a href={doc.fichier} target="_blank" rel="noreferrer" className="text-academic hover:text-gold">
                            <Download size={16} />
                          </a>
                        </div>
                        {doc.commentaire_encadreur && (
                          <p className="text-xs mt-2 bg-info-bg text-info rounded px-2 py-1.5">
                            {doc.commentaire_encadreur}
                          </p>
                        )}
                        {!selected.eligible_soutenance && (
                          <div className="mt-2 flex gap-2">
                            <Textarea
                              rows={1}
                              placeholder="Ajouter un commentaire…"
                              value={commentaires[doc.id] || ''}
                              onChange={(e) => setCommentaires({ ...commentaires, [doc.id]: e.target.value })}
                            />
                            <Button variant="outline" onClick={() => handleAnnoter(doc.id)}>Envoyer</Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
