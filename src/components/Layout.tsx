import { useLiveQuery } from 'dexie-react-hooks'
import {
  GraduationCap,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { db } from '../db'
import { applyTheme } from '../theme'
import { Icon, ICON_SIZE_SM } from './icons'
import { SyncBadge } from './SyncBadge'

const links: {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  className?: string
}[] = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard, end: true },
  { to: '/shlichut', label: 'שליחות', icon: HeartHandshake, className: 'dept-shlichut' },
  { to: '/chinuch', label: 'חינוך', icon: GraduationCap, className: 'dept-chinuch' },
  { to: '/bayit', label: 'בית', icon: Home, className: 'dept-bayit' },
  { to: '/settings', label: 'הגדרות', icon: Settings },
]

export function Layout() {
  const themeRow = useLiveQuery(
    () => db.settings.where('key').equals('theme').first(),
    [],
  )

  useEffect(() => {
    const value = themeRow?.value
    if (value === 'dark' || value === 'light') applyTheme(value)
  }, [themeRow])

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          ניהול <span>אישי</span>
        </div>
        <SyncBadge />
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                [l.className, isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
            >
              <Icon icon={l.icon} size={ICON_SIZE_SM} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
