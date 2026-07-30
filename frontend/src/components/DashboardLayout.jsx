import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FolderOpen, MessageSquare, GraduationCap,
  Users, Building2, BarChart3, ShieldCheck, LogOut, UserCircle, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import Seal from './ui/Seal'

const NAV_BY_ROLE = {
  etudiant: [
    { to: '/etudiant', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/etudiant/demande', label: 'Ma demande', icon: FileText },
    { to: '/etudiant/documents', label: 'Mes documents', icon: FolderOpen },
    { to: '/etudiant/messagerie', label: 'Messagerie', icon: MessageSquare },
    { to: '/etudiant/soutenance', label: 'Soutenance', icon: GraduationCap },
  ],
  encadreur: [
    { to: '/encadreur', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/encadreur/demandes', label: 'Demandes reçues', icon: FileText },
    { to: '/encadreur/etudiants', label: 'Mes étudiants', icon: Users },
    { to: '/encadreur/messagerie', label: 'Messagerie', icon: MessageSquare },
    { to: '/encadreur/soutenances', label: 'Soutenances', icon: GraduationCap },
  ],
  admin: [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/demandes', label: 'Demandes', icon: FileText },
    { to: '/admin/quotas', label: 'Quotas encadreurs', icon: Users },
    { to: '/admin/soutenances', label: 'Soutenances', icon: GraduationCap },
    { to: '/admin/entreprises', label: 'Entreprises', icon: Building2 },
    { to: '/admin/utilisateurs', label: 'Comptes', icon: ShieldCheck },
    { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
    { to: '/admin/audit', label: "Journal d'audit", icon: ShieldCheck },
  ],
}

const ROLE_LABEL = { etudiant: 'Étudiant', encadreur: 'Encadreur', admin: 'Administration' }

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = NAV_BY_ROLE[user.role] || []

  function handleLogout() {
    logout()
    navigate('/connexion')
  }

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col bg-ink text-parchment/90 shrink-0">
        <SidebarContent items={items} user={user} onLogout={handleLogout} />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-ink text-parchment/90 flex flex-col">
            <SidebarContent items={items} user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-line bg-paper px-4 lg:px-8 py-3">
          <button className="lg:hidden text-ink" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs text-slate">Faculté des Sciences — Université de Douala</p>
            <p className="font-display font-semibold text-ink text-sm">
              Plateforme de gestion des stages et mémoires
            </p>
          </div>
          <NavLink
            to={`/${user.role}/profil`}
            className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-parchment-dark"
          >
            <UserCircle size={18} className="text-academic" />
            <span className="hidden sm:inline">{user.first_name || user.username}</span>
          </NavLink>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ items, user, onLogout, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <Seal size={40} className="text-gold" />
        <div>
          <p className="font-display font-semibold text-sm leading-tight text-parchment">
            Gestion des Stages
          </p>
          <p className="text-xs text-parchment/50">{ROLE_LABEL[user.role]}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold text-white'
                  : 'text-parchment/75 hover:bg-white/5 hover:text-parchment'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-parchment/75 hover:bg-white/5 hover:text-parchment"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
      </div>
    </>
  )
}
