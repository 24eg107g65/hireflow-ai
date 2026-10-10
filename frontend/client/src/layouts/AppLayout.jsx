import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BriefcaseBusiness, CalendarDays, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Settings, Sparkles, UserRound, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { NAV_ITEMS } from '../constants/applications'
import { ConfirmDialog } from '../components/ui'

const iconMap = { LayoutDashboard, BriefcaseBusiness, CalendarDays, FileText, Sparkles }
const titles = { '/': 'Overview', '/applications': 'Applications', '/calendar': 'Calendar', '/resumes': 'Resume manager', '/assistant': 'AI assistant', '/profile': 'My profile', '/settings': 'Settings' }

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark">p</span>{!compact && <span>pathway<span className="brand-dot">.</span></span>}</div>
}

function SidebarContent({ onNavigate, onLogout }) {
  const { user } = useAuth()
  const initials = (user?.fullName || user?.name || user?.email || 'S').split(/[\s@]/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return <><div className="sidebar-brand"><Brand /></div><div className="workspace-label">WORKSPACE</div><nav className="sidebar-nav" aria-label="Main navigation">{NAV_ITEMS.map(({ label, to, icon }) => { const Icon = iconMap[icon]; return <NavLink onClick={onNavigate} end={to === '/'} to={to} key={to} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.9} /><span>{label}</span>{to === '/assistant' && <span className="nav-new">AI</span>}</NavLink> })}</nav><div className="sidebar-bottom"><div className="workspace-label">ACCOUNT</div><NavLink onClick={onNavigate} to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}><UserRound size={18} /><span>My profile</span></NavLink><NavLink onClick={onNavigate} to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}><Settings size={18} /><span>Settings</span></NavLink><div className="profile-chip"><div className="avatar">{initials}</div><div className="profile-chip-copy"><strong>{user?.fullName || user?.name || 'Student'}</strong><span>{user?.email || 'Your workspace'}</span></div><button aria-label="Log out" className="icon-button logout-button" title="Log out" onClick={onLogout}><LogOut size={16} /></button></div></div></>
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const title = location.pathname.startsWith('/applications/') ? 'Application details' : titles[location.pathname] || 'Workspace'
  const { user, logout } = useAuth()
  return <><div className="app-shell"><aside className="desktop-sidebar"><SidebarContent onLogout={() => setLogoutOpen(true)} /></aside>{menuOpen && <div className="mobile-sidebar-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false) }}><aside className="mobile-sidebar"><div className="mobile-sidebar-top"><Brand compact /><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button></div><SidebarContent onNavigate={() => setMenuOpen(false)} onLogout={() => setLogoutOpen(true)} /></aside></div>}<div className="main-column"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu-trigger" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><span className="breadcrumb-root">Workspace</span><span className="breadcrumb-divider">/</span><span className="breadcrumb-current">{title}</span></div><div className="topbar-right"><span className="semester-label">Fall recruiting <span className="live-dot" /></span><button className="icon-button notification-button" aria-label="Notification settings" title="Notification settings" onClick={() => navigate('/settings')}><Bell size={18} /></button><div className="topbar-user"><div className="avatar avatar-small">{(user?.fullName || user?.name || 'S').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><ChevronDown size={14} /></div></div></header><main className="main-content"><Outlet /></main><footer className="app-footer"><span>Made for your next chapter.</span><span>Pathway <span className="brand-dot">·</span> Career workspace</span></footer></div></div><ConfirmDialog open={logoutOpen} title="Log out of Pathway?" description="You’ll need to sign in again to access your applications." confirmLabel="Log out" onCancel={() => setLogoutOpen(false)} onConfirm={logout} /></>
}