import { useEffect, useRef, useState } from 'react'
import { KeyRound, UserX, UserCheck, Upload, Plus } from 'lucide-react'
import { utilisateursApi } from '../../api/endpoints'
import { Card, CardHeader, Button, Modal, Field, Input, Select, Alert } from '../../components/ui'

const ROLE_LABELS = { etudiant: 'Étudiant', encadreur: 'Encadreur', admin: 'Administration' }

export default function UtilisateursPage() {
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', role: 'etudiant' })
  const [tempPassword, setTempPassword] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileInput = useRef(null)

  function load() {
    utilisateursApi.list().then(({ data }) => setUsers(data.results ?? data))
  }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    const { data } = await utilisateursApi.create(form)
    setModalOpen(false)
    setForm({ username: '', email: '', first_name: '', last_name: '', role: 'etudiant' })
    load()
  }

  async function handleReset(id) {
    const { data } = await utilisateursApi.reset(id)
    setTempPassword(data.mot_de_passe_temporaire)
  }

  async function handleToggle(user) {
    if (user.is_active) await utilisateursApi.desactiver(user.id)
    else await utilisateursApi.activer(user.id)
    load()
  }

  async function handleImport(e) {
    e.preventDefault()
    const fichier = fileInput.current?.files?.[0]
    if (!fichier) return
    const formData = new FormData()
    formData.append('fichier', fichier)
    const { data } = await utilisateursApi.importCsv(formData)
    setImportResult(data)
    fileInput.current.value = ''
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Administrateur système</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Gestion des comptes</h1>
        </div>
        <Button variant="gold" onClick={() => setModalOpen(true)}><Plus size={16} /> Nouveau compte</Button>
      </div>

      {tempPassword && (
        <Alert variant="success">
          Mot de passe temporaire généré : <strong>{tempPassword}</strong> — communiquez-le de façon sécurisée.
        </Alert>
      )}

      <Card>
        <CardHeader title="Import massif d'étudiants (CSV)" />
        <form onSubmit={handleImport} className="px-5 pb-5 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs text-slate mb-1.5">Colonnes attendues : matricule, nom, prenom, email, filiere, niveau</p>
            <input ref={fileInput} type="file" accept=".csv" className="text-sm" />
          </div>
          <Button type="submit" variant="outline"><Upload size={15} /> Importer</Button>
        </form>
        {importResult && (
          <div className="px-5 pb-5 text-sm text-slate">
            <p>{importResult.crees.length} compte(s) créé(s), {importResult.ignores_deja_existants.length} déjà existant(s), {importResult.erreurs.length} erreur(s).</p>
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{u.username}</p>
                    <p className="text-xs text-slate">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-ink">{ROLE_LABELS[u.role] || u.role}</td>
                  <td className="px-5 py-3">
                    <span className={u.is_active ? 'text-success' : 'text-danger'}>
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => handleReset(u.id)} className="text-academic hover:text-gold" title="Réinitialiser le mot de passe">
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => handleToggle(u)} className="text-slate hover:text-ink" title={u.is_active ? 'Désactiver' : 'Activer'}>
                      {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Créer un compte"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="gold" onClick={handleCreate}>Créer</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Identifiant" required>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom"><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Nom"><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          </div>
          <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Rôle" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="etudiant">Étudiant</option>
              <option value="encadreur">Encadreur</option>
              <option value="admin">Administration</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
