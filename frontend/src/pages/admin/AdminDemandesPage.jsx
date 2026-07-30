import { useEffect, useState } from 'react'
import { Download, Repeat } from 'lucide-react'
import { demandesApi, encadreursApi, statistiquesApi } from '../../api/endpoints'
import { Card, StatusStamp, Button, Modal, Select, Textarea, Alert } from '../../components/ui'

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([])
  const [encadreurs, setEncadreurs] = useState([])
  const [filtreStatut, setFiltreStatut] = useState('')
  const [cible, setCible] = useState(null)
  const [nouvelEncadreur, setNouvelEncadreur] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState('')

  function load() {
    demandesApi.list().then(({ data }) => setDemandes(data.results ?? data))
    encadreursApi.list().then(({ data }) => setEncadreurs(data.results ?? data))
  }
  useEffect(load, [])

  async function handleReaffecter(e) {
    e.preventDefault()
    setError('')
    try {
      await demandesApi.reaffecter(cible.id, nouvelEncadreur, commentaire)
      setCible(null)
      setNouvelEncadreur('')
      setCommentaire('')
      load()
    } catch (err) {
      setError(err.response?.data?.encadreur_id?.[0] || "Échec de la réaffectation.")
    }
  }

  async function handleExport(format) {
    const { data } = await statistiquesApi.exportDemandes(format)
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `demandes.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filtrees = filtreStatut ? demandes.filter((d) => d.statut === filtreStatut) : demandes

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Supervision</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Toutes les demandes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}><Download size={15} /> CSV</Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}><Download size={15} /> Excel</Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}><Download size={15} /> PDF</Button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="w-48">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="acceptee">Acceptées</option>
          <option value="refusee">Refusées</option>
        </Select>
        <p className="text-sm text-slate">{filtrees.length} dossier(s)</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Étudiant</th>
                <th className="px-5 py-3">Thème</th>
                <th className="px-5 py-3">Encadreur</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtrees.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 font-medium text-ink">{d.etudiant_nom}</td>
                  <td className="px-5 py-3 text-slate max-w-xs truncate">{d.theme}</td>
                  <td className="px-5 py-3 text-ink">
                    {d.encadreur_effectif_nom || d.encadreur_souhaite_nom || '—'}
                    {d.reaffectee_par_admin && (
                      <span className="ml-1.5 text-xs text-gold">(réaffecté)</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusStamp status={d.statut} /></td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" onClick={() => setCible(d)}>
                      <Repeat size={15} /> Réaffecter
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!cible}
        onClose={() => setCible(null)}
        title="Réaffecter d'office"
        footer={
          <>
            <Button variant="outline" onClick={() => setCible(null)}>Annuler</Button>
            <Button variant="gold" onClick={handleReaffecter} disabled={!nouvelEncadreur}>
              Confirmer la réaffectation
            </Button>
          </>
        }
      >
        {error && <div className="mb-3"><Alert variant="danger">{error}</Alert></div>}
        <p className="text-sm text-slate mb-3">
          Choisissez un encadreur disponible pour équilibrer la charge de la faculté.
        </p>
        <Select value={nouvelEncadreur} onChange={(e) => setNouvelEncadreur(e.target.value)} className="mb-3">
          <option value="">Sélectionner un encadreur</option>
          {encadreurs.map((enc) => (
            <option key={enc.id} value={enc.id} disabled={enc.est_sature}>
              {enc.nom || enc.username} ({enc.nombre_etudiants_acceptes}/{enc.quota_max})
              {enc.est_sature ? ' — Saturé' : ''}
            </option>
          ))}
        </Select>
        <Textarea
          rows={3}
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </Modal>
    </div>
  )
}
