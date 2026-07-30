import { useEffect, useRef, useState } from 'react'
import { Upload, FileText, Download } from 'lucide-react'
import { demandesApi, documentsApi } from '../../api/endpoints'
import { Card, CardHeader, Button, Select, Alert, Spinner, EmptyState } from '../../components/ui'

const TYPE_LABELS = {
  brouillon: 'Brouillon', final: 'Version finale', rapport_stage: 'Rapport de stage', autre: 'Autre',
}

export default function DocumentsPage() {
  const [demande, setDemande] = useState(undefined)
  const [documents, setDocuments] = useState([])
  const [typeDoc, setTypeDoc] = useState('brouillon')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)

  function load() {
    demandesApi.list().then(({ data }) => {
      const results = data.results ?? data
      setDemande(results[0] || null)
    })
    documentsApi.list().then(({ data }) => setDocuments(data.results ?? data))
  }

  useEffect(load, [])

  async function handleUpload(e) {
    e.preventDefault()
    setError('')
    const fichier = fileInput.current?.files?.[0]
    if (!fichier || !demande) return

    const formData = new FormData()
    formData.append('demande', demande.id)
    formData.append('fichier', fichier)
    formData.append('type_doc', typeDoc)

    setUploading(true)
    try {
      await documentsApi.upload(formData)
      fileInput.current.value = ''
      load()
    } catch (err) {
      const data = err.response?.data
      setError(
        typeof data === 'string' ? data : Object.values(data || {}).flat().join(' ') || 'Échec du dépôt.'
      )
    } finally {
      setUploading(false)
    }
  }

  if (demande === undefined) return <div className="flex justify-center py-16"><Spinner /></div>

  if (!demande) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Aucun dossier actif"
          description="Vous devez d'abord soumettre une demande avant de déposer des documents."
        />
      </Card>
    )
  }

  const verrouille = demande.eligible_soutenance
  const peutDeposer = demande.statut === 'acceptee' && !verrouille

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Suivi du mémoire</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Mes documents</h1>
      </div>

      {!peutDeposer && !verrouille && (
        <Alert variant="warning">
          Le dépôt de documents sera possible une fois votre demande acceptée par un encadreur.
        </Alert>
      )}
      {verrouille && (
        <Alert variant="success">
          Votre encadreur a validé votre dossier pour la soutenance : le dépôt est désormais verrouillé.
        </Alert>
      )}

      {peutDeposer && (
        <Card>
          <CardHeader title="Déposer un nouveau document" />
          <form onSubmit={handleUpload} className="px-5 pb-5 space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Fichier (PDF, DOC, DOCX — 15 Mo max)</label>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-parchment-dark file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-line"
                />
              </div>
              <Select value={typeDoc} onChange={(e) => setTypeDoc(e.target.value)} className="sm:w-48">
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="gold" disabled={uploading}>
              <Upload size={16} /> {uploading ? 'Envoi…' : 'Déposer le document'}
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Historique des versions" />
        <div className="px-5 pb-5">
          {documents.length === 0 ? (
            <p className="text-sm text-slate py-6 text-center">Aucun document déposé pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {documents.map((doc) => (
                <li key={doc.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      V{doc.version} — {TYPE_LABELS[doc.type_doc] || doc.type_doc}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      Déposé le {new Date(doc.date_depot).toLocaleString('fr-FR')}
                    </p>
                    {doc.commentaire_encadreur && (
                      <p className="text-xs mt-2 bg-info-bg text-info rounded px-2 py-1.5 inline-block">
                        Commentaire encadreur : {doc.commentaire_encadreur}
                      </p>
                    )}
                  </div>
                  <a
                    href={doc.fichier}
                    target="_blank"
                    rel="noreferrer"
                    className="text-academic hover:text-gold shrink-0"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}
