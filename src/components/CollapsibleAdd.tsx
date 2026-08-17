import { Plus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Icon, ICON_SIZE_SM } from './icons'

interface CollapsibleAddProps {
  title: string
  buttonLabel: string
  buttonClass?: string
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CollapsibleAdd({
  title,
  buttonLabel,
  buttonClass = 'secondary',
  children,
  open,
  onOpenChange,
}: CollapsibleAddProps) {
  const [internal, setInternal] = useState(false)
  const isOpen = open ?? internal

  function setOpen(next: boolean) {
    onOpenChange?.(next)
    if (open === undefined) setInternal(next)
  }

  if (!isOpen) {
    return (
      <div className="actions">
        <button
          type="button"
          className={`btn ${buttonClass}`}
          onClick={() => setOpen(true)}
        >
          <Icon icon={Plus} size={ICON_SIZE_SM} />
          {buttonLabel}
        </button>
      </div>
    )
  }

  return (
    <section className="panel">
      <div className="actions" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, flex: 1 }}>{title}</h2>
        <button
          type="button"
          className="btn small ghost"
          onClick={() => setOpen(false)}
        >
          <Icon icon={X} size={ICON_SIZE_SM} />
          סגירה
        </button>
      </div>
      {children}
    </section>
  )
}
