import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Field, Input, Alert } from '../components/ui'
import Seal from '../components/ui/Seal'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      const from = location.state?.from || `/${user.role}`
      navigate(from, { replace: true })
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.')
      } else {
        setError('Identifiant ou mot de passe incorrect.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau institutionnel */}
      <div className="hidden lg:flex w-1/2 bg-ink text-parchment flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 opacity-[0.06]">
          <Seal size={480} />
        </div>
        <div className="relative">
          <p className="text-xs tracking-[0.25em] text-gold uppercase mb-2">Université de Douala</p>
          <p className="text-xs text-parchment/60">Faculté des Sciences — MIA 468</p>
        </div>
        <div className="relative max-w-md">
          <Seal size={56} className="text-gold mb-6" />
          <h1 className="font-display text-3xl font-semibold leading-tight mb-4">
            Plateforme de gestion des stages et mémoires académiques
          </h1>
          <p className="text-parchment/70 text-sm leading-relaxed">
            Du dépôt de la demande de thème à la soutenance : un espace unique pour
            les étudiants, les encadreurs et l'administration de la faculté.
          </p>
        </div>
        <p className="relative text-xs text-parchment/40">Groupe 1 — Année académique 2025/2026</p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-parchment">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Seal size={40} className="text-gold" />
            <p className="font-display font-semibold text-ink">Gestion des Stages</p>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink mb-1">Connexion</h2>
          <p className="text-sm text-slate mb-6">
            Accédez à votre espace étudiant, encadreur ou administration.
          </p>

          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Identifiant" required hint="Matricule (étudiant) ou nom d'utilisateur">
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex. 25S07416"
                required
              />
            </Field>
            <Field label="Mot de passe" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-8 text-xs text-slate">
            Vos identifiants vous ont été communiqués par l'administration de la faculté.
            En cas d'oubli, contactez l'administrateur système.
          </p>
        </div>
      </div>
    </div>
  )
}
