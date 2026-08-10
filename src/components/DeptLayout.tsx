import { NavLink, Outlet } from 'react-router-dom'

interface DeptLayoutProps {
  title: string
  deptClass: string
  links: { to: string; label: string; end?: boolean }[]
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
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
