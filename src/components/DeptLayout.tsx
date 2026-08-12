import type { LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from './icons'

interface DeptLayoutProps {
  title: string
  deptClass: string
  links: { to: string; label: string; end?: boolean; icon: LucideIcon }[]
}

export function DeptLayout({ title, deptClass, links }: DeptLayoutProps) {
  return (
    <div className={deptClass}>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <nav className="subnav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <Icon icon={l.icon} size={ICON_SIZE_SM} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
