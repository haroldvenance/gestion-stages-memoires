import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { messagesApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui'

export default function ChatPanel({ demandeId, destinataireId, destinataireLabel }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  function load() {
    if (!demandeId) return
    messagesApi.list(demandeId).then(({ data }) => {
      setMessages(data.results ?? data)
      messagesApi.marquerLus(demandeId).catch(() => {})
    })
  }

  useEffect(load, [demandeId])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!texte.trim() || !destinataireId) return
    setSending(true)
    try {
      await messagesApi.send({ demande: demandeId, destinataire: destinataireId, contenu: texte })
      setTexte('')
      load()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[520px]">
      <div className="border-b border-line px-5 py-3">
        <p className="text-xs text-slate">Conversation avec</p>
        <p className="font-medium text-ink text-sm">{destinataireLabel}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate text-center py-10">Aucun message pour l'instant.</p>
        )}
        {messages.map((m) => {
          const mine = m.expediteur === user.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-ink text-parchment' : 'bg-parchment-dark text-ink'
                }`}
              >
                <p>{m.contenu}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-parchment/50' : 'text-slate'}`}>
                  {new Date(m.date_envoi).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-line px-4 py-3 flex gap-2">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire un message…"
          disabled={!destinataireId}
          className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:border-academic focus:outline-none focus:ring-2 focus:ring-academic/20"
        />
        <Button type="submit" variant="gold" disabled={sending || !destinataireId}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}
