import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RequireAuth } from './routes/RequireAuth'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'
import ProfilPage from './pages/ProfilPage'

import EtudiantDashboard from './pages/etudiant/EtudiantDashboard'
import DemandePage from './pages/etudiant/DemandePage'
import DocumentsPage from './pages/etudiant/DocumentsPage'
import MessageriePage from './pages/etudiant/MessageriePage'
import SoutenancePage from './pages/etudiant/SoutenancePage'

import EncadreurDashboard from './pages/encadreur/EncadreurDashboard'
import DemandesEncadreurPage from './pages/encadreur/DemandesEncadreurPage'
import EtudiantsPage from './pages/encadreur/EtudiantsPage'
import MessagerieEncadreurPage from './pages/encadreur/MessagerieEncadreurPage'
import SoutenancesEncadreurPage from './pages/encadreur/SoutenancesEncadreurPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDemandesPage from './pages/admin/AdminDemandesPage'
import QuotasPage from './pages/admin/QuotasPage'
import AdminSoutenancesPage from './pages/admin/AdminSoutenancesPage'
import EntreprisesPage from './pages/admin/EntreprisesPage'
import UtilisateursPage from './pages/admin/UtilisateursPage'
import StatistiquesPage from './pages/admin/StatistiquesPage'
import AuditPage from './pages/admin/AuditPage'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/connexion" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/etudiant"
            element={
              <RequireAuth role="etudiant">
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<EtudiantDashboard />} />
            <Route path="demande" element={<DemandePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="messagerie" element={<MessageriePage />} />
            <Route path="soutenance" element={<SoutenancePage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>

          <Route
            path="/encadreur"
            element={
              <RequireAuth role="encadreur">
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<EncadreurDashboard />} />
            <Route path="demandes" element={<DemandesEncadreurPage />} />
            <Route path="etudiants" element={<EtudiantsPage />} />
            <Route path="messagerie" element={<MessagerieEncadreurPage />} />
            <Route path="soutenances" element={<SoutenancesEncadreurPage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="demandes" element={<AdminDemandesPage />} />
            <Route path="quotas" element={<QuotasPage />} />
            <Route path="soutenances" element={<AdminSoutenancesPage />} />
            <Route path="entreprises" element={<EntreprisesPage />} />
            <Route path="utilisateurs" element={<UtilisateursPage />} />
            <Route path="statistiques" element={<StatistiquesPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
