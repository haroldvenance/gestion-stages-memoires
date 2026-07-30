import { useEffect, useState } from 'react'
import { CalendarPlus, Users, CheckCircle2, Download, Wand2 } from 'lucide-react'
import { demandesApi, soutenancesApi, encadreursApi } from '../../api/endpoints'
import {
  Card, CardHeader, Field, Input, Select, Button, StatusStamp, Alert, EmptyState, Textarea,
} from '../../components/ui'

const ROLES = [
  { value: 'president', label: 'Président' },
  { value: 'rapporteur', label: 'Rapporteur' },
  { value: 'examinateur', label: 'Examinateur' },
]

export default function AdminSoutenancesPage() {
  const [eligibles, setEligibles] = useState([])
  const [soutenances, setSoutenances] = useState([])
  const [encadreurs, setEncadreurs] = useState([])
  const [form, setForm] = useState({ demande: '', date_proposee: '', heure_debut: '', salle: '', duree_heures: 1 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [juryForm, setJuryForm] = useState({})

  const [autoForm, setAutoForm] = useState({
    dates: '', salles: '', heure_debut: '08:00', heure_fin: '17:00', duree_heures: 1,
  })
  const [autoResult, setAutoResult] = useState(null)
  const [autoError, setAutoError] = useState('')
  const [autoLoading, setAutoLoading] = useState(false)

  function load() {
    demandesApi.list().then(({ data }) => {
      const results = (data.results ?? data).filter((d) => d.eligible_soutenance)
      setEligibles(results)
    })
    soutenancesApi.list().then(({ data }) => setSoutenances(data.results ?? data))
    encadreursApi.list().then(({ data }) => setEncadreurs(data.results ?? data))
  }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await soutenancesApi.create(form)
      setSuccess('Soutenance planifiée.')
      setForm({ demande: '', date_proposee: '', heure_debut: '', salle: '', duree_heures: 1 })
      load()
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join(' ') || 'Échec de la planification.')
    }
  }

  async function handleAddJury(soutenanceId) {
    const { enseignant, role_jury } = juryForm[soutenanceId] || {}
    if (!enseignant || !role_jury) return
    try {
      await soutenancesApi.jury.create({ soutenance: soutenanceId, enseignant, role_jury })
      setJuryForm({ ...juryForm, [soutenanceId]: {} })
      load()
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join(' ') || 'Échec.')
    }
  }

  async function handleValider(id) {
    const { data } = await soutenancesApi.valider(id)
    setSuccess(
      data.convocations_envoyees
        ? `Soutenance validée. ${data.convocations_detail}`
        : `Soutenance validée, mais l'envoi des convocations a échoué : ${data.convocations_detail}`
    )
    setError(data.convocations_envoyees ? '' : error)
    load()
  }

  async function handleAutoSchedule(e) {
    e.preventDefault()
    setAutoError('')
    setAutoResult(null)
    setAutoLoading(true)
    try {
      const dates = autoForm.dates.split(',').map((d) => d.trim()).filter(Boolean)
      const salles = autoForm.salles.split(',').map((s) => s.trim()).filter(Boolean)
      if (dates.length === 0 || salles.length === 0) {
        setAutoError('Indiquez au moins une date et une salle.')
        setAutoLoading(false)
        return
      }
      const { data } = await soutenancesApi.planifierAuto({
        dates, salles,
        heure_debut: autoForm.heure_debut,
        heure_fin: autoForm.heure_fin,
        duree_heures: Number(autoForm.duree_heures),
      })
      setAutoResult(data)
      load()
    } catch (err) {
      const data = err.response?.data
      setAutoError(typeof data === 'string' ? data : Object.values(data || {}).flat().join(' ') || 'Échec de la planification automatique.')
    } finally {
      setAutoLoading(false)
    }
  }

  async function handleDownload(id) {
    const { data } = await soutenancesApi.telechargerConvocation(id)
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `convocation_${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Logistique</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Gestion des soutenances</h1>
      </div>

      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <CardHeader
          title="Planification automatique"
          eyebrow={`${eligibles.length} dossier(s) éligible(s) en attente`}
        />
        <form onSubmit={handleAutoSchedule} className="px-5 pb-5 space-y-4">
          {autoError && <Alert variant="danger">{autoError}</Alert>}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Dates disponibles" required hint="Séparées par des virgules, ex. 2026-09-01, 2026-09-02">
              <Textarea
                rows={2}
                value={autoForm.dates}
                onChange={(e) => setAutoForm({ ...autoForm, dates: e.target.value })}
                placeholder="2026-09-01, 2026-09-02"
                required
              />
            </Field>
            <Field label="Salles disponibles" required hint="Séparées par des virgules">
              <Textarea
                rows={2}
                value={autoForm.salles}
                onChange={(e) => setAutoForm({ ...autoForm, salles: e.target.value })}
                placeholder="A101, A102, B201"
                required
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Heure de début"><Input type="time" value={autoForm.heure_debut} onChange={(e) => setAutoForm({ ...autoForm, heure_debut: e.target.value })} /></Field>
            <Field label="Heure de fin"><Input type="time" value={autoForm.heure_fin} onChange={(e) => setAutoForm({ ...autoForm, heure_fin: e.target.value })} /></Field>
            <Field label="Durée par soutenance (h)"><Input type="number" min={0.5} max={4} step={0.5} value={autoForm.duree_heures} onChange={(e) => setAutoForm({ ...autoForm, duree_heures: e.target.value })} /></Field>
          </div>
          <Button type="submit" variant="gold" disabled={autoLoading}>
            <Wand2 size={16} /> {autoLoading ? 'Planification en cours…' : 'Générer le planning automatiquement'}
          </Button>

          {autoResult && (
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-md border border-success/30 bg-success-bg p-3">
                <p className="text-sm font-semibold text-success mb-2">
                  {autoResult.planifiees.length} soutenance(s) proposée(s)
                </p>
                <ul className="text-xs text-ink space-y-1">
                  {autoResult.planifiees.map((p) => (
                    <li key={p.soutenance_id}>
                      {p.etudiant} — {p.date} {p.heure} en {p.salle}
                    </li>
                  ))}
                </ul>
              </div>
              {autoResult.non_planifiees.length > 0 && (
                <div className="rounded-md border border-warning/30 bg-warning-bg p-3">
                  <p className="text-sm font-semibold text-warning mb-2">
                    {autoResult.non_planifiees.length} dossier(s) non planifié(s)
                  </p>
                  <ul className="text-xs text-ink space-y-1">
                    {autoResult.non_planifiees.map((n) => (
                      <li key={n.demande_id}>{n.etudiant} — {n.raison}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-slate">
            Les soutenances générées restent au statut « Proposée » : relisez-les ci-dessous puis
            validez individuellement pour déclencher l'envoi des convocations.
          </p>
        </form>
      </Card>

      <Card>
        <CardHeader title="Planifier une soutenance au cas par cas" />
        <form onSubmit={handleCreate} className="px-5 pb-5 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Field label="Étudiant éligible" required>
            <Select value={form.demande} onChange={(e) => setForm({ ...form, demande: e.target.value })} required>
              <option value="">Sélectionner un dossier éligible</option>
              {eligibles.map((d) => (
                <option key={d.id} value={d.id}>{d.etudiant_nom} — {d.theme.slice(0, 50)}</option>
              ))}
            </Select>
          </Field>
          <div className="grid sm:grid-cols-4 gap-4">
            <Field label="Date" required>
              <Input type="date" value={form.date_proposee} onChange={(e) => setForm({ ...form, date_proposee: e.target.value })} required />
            </Field>
            <Field label="Heure" required>
              <Input type="time" value={form.heure_debut} onChange={(e) => setForm({ ...form, heure_debut: e.target.value })} required />
            </Field>
            <Field label="Salle" required>
              <Input value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} required />
            </Field>
            <Field label="Durée (h)">
              <Input type="number" min={1} max={4} value={form.duree_heures} onChange={(e) => setForm({ ...form, duree_heures: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" variant="gold"><CalendarPlus size={16} /> Planifier</Button>
        </form>
      </Card>

      {eligibles.length === 0 && soutenances.length === 0 && (
        <Card><EmptyState title="Aucun dossier éligible" description="Les étudiants apparaîtront ici une fois validés par leur encadreur." /></Card>
      )}

      <div className="space-y-4">
        {soutenances.map((s) => (
          <Card key={s.id}>
            <CardHeader
              eyebrow={`Soutenance N° ${s.id}`}
              title={s.demande_etudiant_nom}
              action={<StatusStamp status={s.statut} />}
            />
            <div className="px-5 pb-4 grid sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-slate">Date</p><p className="font-medium text-ink">{s.date_proposee} à {s.heure_debut}</p></div>
              <div><p className="text-slate">Salle</p><p className="font-medium text-ink">{s.salle}</p></div>
              <div><p className="text-slate">Encadreur</p><p className="font-medium text-ink">{s.demande_encadreur_nom || '—'}</p></div>
            </div>

            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-slate uppercase mb-2 flex items-center gap-1.5"><Users size={13} /> Jury</p>
              {s.jury.length === 0 ? (
                <p className="text-sm text-slate mb-2">Aucun membre affecté.</p>
              ) : (
                <ul className="flex flex-wrap gap-2 mb-3">
                  {s.jury.map((j) => (
                    <li key={j.id} className="text-xs bg-parchment-dark rounded-full px-3 py-1">
                      {j.enseignant_nom} — {j.role_jury_display}
                    </li>
                  ))}
                </ul>
              )}
              {s.statut !== 'validee' && (
                <div className="flex gap-2 flex-wrap">
                  <Select
                    className="w-48"
                    value={juryForm[s.id]?.enseignant || ''}
                    onChange={(e) => setJuryForm({ ...juryForm, [s.id]: { ...juryForm[s.id], enseignant: e.target.value } })}
                  >
                    <option value="">Enseignant</option>
                    {encadreurs.map((enc) => (
                      <option key={enc.id} value={enc.id}>{enc.nom || enc.username}</option>
                    ))}
                  </Select>
                  <Select
                    className="w-40"
                    value={juryForm[s.id]?.role_jury || ''}
                    onChange={(e) => setJuryForm({ ...juryForm, [s.id]: { ...juryForm[s.id], role_jury: e.target.value } })}
                  >
                    <option value="">Rôle</option>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                  <Button variant="outline" onClick={() => handleAddJury(s.id)}>Ajouter</Button>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2">
              {s.statut !== 'validee' ? (
                <Button variant="gold" onClick={() => handleValider(s.id)}>
                  <CheckCircle2 size={15} /> Valider et envoyer les convocations
                </Button>
              ) : (
                <Button variant="outline" onClick={() => handleDownload(s.id)}>
                  <Download size={15} /> Convocation PDF
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
