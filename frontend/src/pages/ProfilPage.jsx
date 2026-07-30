import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/endpoints'
import { Card, CardHeader, Field, Input, Button, Alert } from '../components/ui'

export default function ProfilPage() {
  const { user, refreshMe } = useAuth()
  const profil = user.profil_etudiant || user.profil_encadreur || {}

  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    telephone: profil.telephone || '',
    adresse: profil.adresse || '',
  })
  const [savingProfil, setSavingProfil] = useState(false)
  const [profilMsg, setProfilMsg] = useState(null)

  const [pwd, setPwd] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '' })
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  async function handleProfilSubmit(e) {
    e.preventDefault()
    setSavingProfil(true)
    setProfilMsg(null)
    try {
      await authApi.updateMe(form)
      await refreshMe()
      setProfilMsg({ type: 'success', text: 'Profil mis à jour avec succès.' })
    } catch {
      setProfilMsg({ type: 'danger', text: 'Une erreur est survenue lors de la mise à jour.' })
    } finally {
      setSavingProfil(false)
    }
  }

  async function handlePwdSubmit(e) {
    e.preventDefault()
    setSavingPwd(true)
    setPwdMsg(null)
    try {
      await authApi.changePassword(pwd)
      setPwd({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '' })
      setPwdMsg({ type: 'success', text: 'Mot de passe mis à jour.' })
    } catch (err) {
      setPwdMsg({
        type: 'danger',
        text: err.response?.data?.detail || 'Le mot de passe actuel est incorrect.',
      })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Mon compte</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Mon profil</h1>
      </div>

      <Card>
        <CardHeader title="Coordonnées" />
        <form onSubmit={handleProfilSubmit} className="px-5 pb-5 space-y-4">
          {profilMsg && <Alert variant={profilMsg.type}>{profilMsg.text}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom">
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Nom">
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
          </div>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone">
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </Field>
            <Field label="Adresse">
              <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" disabled={savingProfil}>
            {savingProfil ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Changer le mot de passe" />
        <form onSubmit={handlePwdSubmit} className="px-5 pb-5 space-y-4">
          {pwdMsg && <Alert variant={pwdMsg.type}>{pwdMsg.text}</Alert>}
          <Field label="Mot de passe actuel" required>
            <Input
              type="password"
              value={pwd.ancien_mot_de_passe}
              onChange={(e) => setPwd({ ...pwd, ancien_mot_de_passe: e.target.value })}
              required
            />
          </Field>
          <Field label="Nouveau mot de passe" required hint="10 caractères minimum">
            <Input
              type="password"
              value={pwd.nouveau_mot_de_passe}
              onChange={(e) => setPwd({ ...pwd, nouveau_mot_de_passe: e.target.value })}
              required
              minLength={10}
            />
          </Field>
          <Button type="submit" variant="outline" disabled={savingPwd}>
            {savingPwd ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
