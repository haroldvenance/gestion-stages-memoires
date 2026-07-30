import React, { useState, useEffect, useContext } from 'react';
import { getMessages, sendMessage } from '../services/messages';
import AuthContext from '../context/AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';

const Messagerie = ({ demandeId }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(demandeId);
      setMessages(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [demandeId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      // À adapter selon votre logique de destinataire (à améliorer)
      const destinataireId = user.role === 'etudiant' ? 2 : 1;
      await sendMessage({
        demande: demandeId,
        destinataire: destinataireId,
        contenu: newMessage,
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      alert('Erreur lors de l\'envoi du message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center text-secondary">Chargement des messages...</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-medium">Conversation</h3>
      </div>
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-secondary text-center">Aucun message pour cette demande.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.expediteur_nom === user.username ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2/3 rounded-lg px-4 py-2 shadow-sm ${
                msg.expediteur_nom === user.username ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm"><strong>{msg.expediteur_nom}</strong></p>
                <p>{msg.contenu}</p>
                <p className="text-xs mt-1 opacity-70">{new Date(msg.date_envoi).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Votre message..."
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? 'Envoi...' : 'Envoyer'}
        </Button>
      </form>
    </div>
  );
};

export default Messagerie;