import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { demandesApi } from '../../api/endpoints'
import { Card, StatusStamp, Button, Modal, Textarea, Alert, EmptyState } from '../../components/ui'

export default function DemandesEncadreurPage() {
  const [demandes, setDemandes] = useState([])
  const [refusCible, setRefusCible] = useState(null)
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    demandesApi.list().then(({ data }) => setDemandes(data.results ?? data))
  }
  useEffect(load, [])

  async function handleAccepter(demande) {
    setBusyId(demande.id)
    setError('')
    try {
      await demandesApi.accepter(demande.id)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible d'accepter cette demande.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRefuser(e) {
    e.preventDefault()
    setBusyId(refusCible.id)
    setError('')
    try {
      await demandesApi.refuser(refusCible.id, commentaire)
      setRefusCible(null)
      setCommentaire('')
      load()
    } catch (err) {
      setError(err.response?.data?.commentaire?.[0] || 'Un commentaire justificatif est requis.')
    } finally {
      setBusyId(null)
    }
  }

  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const traitees = demandes.filter((d) => d.statut !== 'en_attente')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Encadrement</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Demandes reçues</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-display font-semibold text-ink">En attente de décision</h3>
        </div>
        {enAttente.length === 0 ? (
          <EmptyState title="Aucune demande en attente" description="Vous êtes à jour." />
        ) : (
          <ul className="divide-y divide-line px-5 pb-5">
            {enAttente.map((d) => (
              <li key={d.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink text-sm">{d.etudiant_nom}</p>
                  <p className="text-sm text-slate mt-0.5">{d.theme}</p>
                  <p className="text-xs text-slate mt-1">Structure d'accueil : {d.entreprise}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" onClick={() => setRefusCible(d)} disabled={busyId === d.id}>
                    <XCircle size={15} /> Refuser
                  </Button>
                  <Button variant="gold" onClick={() => handleAccepter(d)} disabled={busyId === d.id}>
                    <CheckCircle2 size={15} /> Accepter
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-display font-semibold text-ink">Historique</h3>
        </div>
        {traitees.length === 0 ? (
          <p className="text-sm text-slate px-5 pb-5">Aucun dossier traité pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-line px-5 pb-5">
            {traitees.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-ink">{d.etudiant_nom}</span>
                  <span className="text-slate"> — {d.theme.slice(0, 50)}</span>
                </div>
                <StatusStamp status={d.statut} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!refusCible}
        onClose={() => setRefusCible(null)}
        title="Justifier le refus"
        footer={
          <>
            <Button variant="outline" onClick={() => setRefusCible(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleRefuser} disabled={busyId === refusCible?.id}>
              Confirmer le refus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate mb-3">
          Un commentaire justificatif est obligatoire et sera visible par l'étudiant.
        </p>
        <Textarea
          rows={4}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Expliquez le motif du refus…"
          required
        />
      </Modal>
    </div>
  )
}
