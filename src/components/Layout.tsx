import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'דשבורד', end: true },
  { to: '/shlichut', label: 'שליחות', className: 'dept-shlichut' },
  { to: '/chinuch', label: 'חינוך', className: 'dept-chinuch' },
  { to: '/bayit', label: 'בית', className: 'dept-bayit' },
  { to: '/settings', label: 'הגדרות' },
]

export function Layout() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          ניהול <span>אישי</span>
        </div>
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
