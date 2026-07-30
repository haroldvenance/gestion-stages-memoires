import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, StatusStamp, Field, Input, Alert } from '../components/ui'

describe('Button', () => {
  it('affiche le texte fourni', () => {
    render(<Button>Valider</Button>)
    expect(screen.getByText('Valider')).toBeInTheDocument()
  })

  it('déclenche onClick', () => {
    let clicked = false
    render(<Button onClick={() => (clicked = true)}>Cliquer</Button>)
    fireEvent.click(screen.getByText('Cliquer'))
    expect(clicked).toBe(true)
  })

  it('est désactivé quand disabled=true', () => {
    render(<Button disabled>Envoyer</Button>)
    expect(screen.getByText('Envoyer')).toBeDisabled()
  })
})

describe('StatusStamp', () => {
  it('affiche le libellé correspondant au statut', () => {
    render(<StatusStamp status="acceptee" />)
    expect(screen.getByText('Acceptée')).toBeInTheDocument()
  })

  it('affiche un statut inconnu tel quel', () => {
    render(<StatusStamp status="inconnu" />)
    expect(screen.getByText('inconnu')).toBeInTheDocument()
  })
})

describe('Field', () => {
  it('affiche le label et l’astérisque si requis', () => {
    render(
      <Field label="Thème" required>
        <Input />
      </Field>
    )
    expect(screen.getByText('Thème')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('affiche un message d’erreur', () => {
    render(
      <Field label="E-mail" error="Adresse invalide">
        <Input />
      </Field>
    )
    expect(screen.getByText('Adresse invalide')).toBeInTheDocument()
  })
})

describe('Alert', () => {
  it('affiche le contenu', () => {
    render(<Alert variant="danger">Erreur critique</Alert>)
    expect(screen.getByText('Erreur critique')).toBeInTheDocument()
  })
})
