import { FileSpreadsheet, FileText, FileType } from 'lucide-react'
import { statistiquesApi } from '../../api/endpoints'
import { Card, CardHeader, Button } from '../../components/ui'

export default function StatistiquesPage() {
  async function handleExport(format) {
    const { data } = await statistiquesApi.exportDemandes(format)
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `demandes.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">Pilotage</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Statistiques et exports</h1>
        <p className="text-sm text-slate mt-1">
          Le tableau de bord synthétique se trouve sur la page d'accueil. Exportez ici les
          listes complètes pour vos rapports.
        </p>
      </div>

      <Card>
        <CardHeader title="Export des demandes" />
        <div className="px-5 pb-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <FileType size={16} /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            <FileSpreadsheet size={16} /> Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText size={16} /> Export PDF
          </Button>
        </div>
      </Card>
    </div>
  )
}
