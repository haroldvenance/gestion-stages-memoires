import { useEffect, useState } from 'react'
import { demandesApi, encadreursApi } from '../../api/endpoints'
import {
  Card, CardHeader, Field, Input, Textarea, Select, Button, Alert, StatusStamp, Spinner,
} from '../../components/ui'

export default function DemandePage() {
  const [demande, setDemande] = useState(undefined)
  const [encadreurs, setEncadreurs] = useState([])
  const [form, setForm] = useState({
    theme: '', encadreur_souhaite: '', entreprise: '', entreprise_ville: '',
    maitre_stage_nom: '', maitre_stage_email: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    Promise.all([demandesApi.list(), encadreursApi.list()]).then(([d, e]) => {
      const results = d.data.results ?? d.data
      const current = results[0] || null
      setDemande(current)
      setEncadreurs(e.data.results ?? e.data)
      if (current) {
        setForm({
          theme: current.theme || '',
          encadreur_souhaite: current.encadreur_souhaite || '',
          entreprise: current.entreprise || '',
          entreprise_ville: current.entreprise_ville || '',
          maitre_stage_nom: current.maitre_stage_nom || '',
          maitre_stage_email: current.maitre_stage_email || '',
        })
      }
    })
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      if (demande) {
        await demandesApi.update(demande.id, form)
      } else {
        await demandesApi.create(form)
      }
      setSuccess('Votre demande a été enregistrée avec succès.')
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = typeof data === 'string' ? data
        : data?.detail || Object.values(data || {}).flat().join(' ') || "Une erreur est survenue."
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (demande === undefined) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  const modifiable = !demande || demande.modifiable

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">
            Demande de stage / mémoire
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {demande ? 'Ma demande' : 'Soumettre ma demande'}
          </h1>
        </div>
        {demande && <StatusStamp status={demande.statut} />}
      </div>

      {!modifiable && (
        <Alert variant="info">
          Votre dossier a été validé : l'encadreur est verrouillé et le formulaire ne peut plus être modifié.
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Field label="Thème / sujet proposé" required>
            <Textarea
              rows={3}
              disabled={!modifiable}
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              required
            />
          </Field>

          <Field label="Encadreur souhaité" required hint="Les encadreurs saturés sont indisponibles.">
            <Select
              disabled={!modifiable}
              value={form.encadreur_souhaite}
              onChange={(e) => setForm({ ...form, encadreur_souhaite: e.target.value })}
              required
            >
              <option value="">Sélectionner un encadreur</option>
              {encadreurs.map((enc) => (
                <option key={enc.id} value={enc.id} disabled={enc.est_sature}>
                  {enc.nom || enc.username} — {enc.departement}
                  {enc.est_sature ? ' (Saturé)' : ` (${enc.nombre_etudiants_acceptes}/${enc.quota_max})`}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Entreprise / structure d'accueil" required>
              <Input
                disabled={!modifiable}
                value={form.entreprise}
                onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                required
              />
            </Field>
            <Field label="Ville">
              <Input
                disabled={!modifiable}
                value={form.entreprise_ville}
                onChange={(e) => setForm({ ...form, entreprise_ville: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom du maître de stage">
              <Input
                disabled={!modifiable}
                value={form.maitre_stage_nom}
                onChange={(e) => setForm({ ...form, maitre_stage_nom: e.target.value })}
              />
            </Field>
            <Field label="E-mail du maître de stage">
              <Input
                type="email"
                disabled={!modifiable}
                value={form.maitre_stage_email}
                onChange={(e) => setForm({ ...form, maitre_stage_email: e.target.value })}
              />
            </Field>
          </div>

          {modifiable && (
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? 'Envoi…' : demande ? 'Mettre à jour ma demande' : 'Soumettre ma demande'}
            </Button>
          )}
        </form>
      </Card>
    </div>
  )
}
