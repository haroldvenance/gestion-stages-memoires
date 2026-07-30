import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, Building2 } from 'lucide-react'
import { entreprisesApi } from '../../api/endpoints'
import { Card, CardHeader, Button, Modal, Field, Input, Textarea, EmptyState } from '../../components/ui'

const EMPTY = { nom: '', ville: '', secteur_activite: '', nom_contact: '', email_contact: '', telephone_contact: '', adresse: '', notes: '' }

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)

  function load() {
    entreprisesApi.list().then(({ data }) => setEntreprises(data.results ?? data))
  }
  useEffect(load, [])

  function openCreate() {
    setForm(EMPTY)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(ent) {
    setForm(ent)
    setEditingId(ent.id)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (editingId) {
      await entreprisesApi.update(editingId, form)
    } else {
      await entreprisesApi.create(form)
    }
    setModalOpen(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette entreprise ?')) return
    await entreprisesApi.remove(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Partenariats</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Entreprises partenaires</h1>
        </div>
        <Button variant="gold" onClick={openCreate}><Plus size={16} /> Ajouter</Button>
      </div>

      <Card>
        {entreprises.length === 0 ? (
          <EmptyState icon={Building2} title="Aucune entreprise enregistrée" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Ville</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Stagiaires</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entreprises.map((ent) => (
                  <tr key={ent.id}>
                    <td className="px-5 py-3 font-medium text-ink">{ent.nom}</td>
                    <td className="px-5 py-3 text-slate">{ent.ville}</td>
                    <td className="px-5 py-3 text-slate">{ent.email_contact || '—'}</td>
                    <td className="px-5 py-3 text-ink">{ent.nombre_stagiaires}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(ent)} className="text-academic hover:text-gold"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(ent.id)} className="text-danger hover:opacity-70"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier l'entreprise" : 'Ajouter une entreprise'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" onClick={handleSave}>Enregistrer</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-3">
          <Field label="Nom" required>
            <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville"><Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></Field>
            <Field label="Secteur"><Input value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact"><Input value={form.nom_contact} onChange={(e) => setForm({ ...form, nom_contact: e.target.value })} /></Field>
            <Field label="E-mail"><Input type="email" value={form.email_contact} onChange={(e) => setForm({ ...form, email_contact: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  )
}
