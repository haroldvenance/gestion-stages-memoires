import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../api/endpoints', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn().mockRejectedValue(new Error('not authenticated')),
    changePassword: vi.fn(),
    updateMe: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('affiche le formulaire de connexion', async () => {
    renderLogin()
    expect(await screen.findByText('Connexion')).toBeInTheDocument()
    expect(screen.getByLabelText(/Identifiant/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()
  })

  it('affiche le nom de la plateforme', async () => {
    renderLogin()
    expect(
      await screen.findByText(/Plateforme de gestion des stages et mémoires académiques/i)
    ).toBeInTheDocument()
  })
})
