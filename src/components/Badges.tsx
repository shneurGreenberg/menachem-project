import type { Priority } from '../types'
import { priorityLabel } from '../utils/dates'

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${priority}`}>{priorityLabel(priority)}</span>
}

export function StatusBadge({ status }: { status: 'open' | 'done' }) {
  return (
    <span className={`badge ${status}`}>
      {status === 'open' ? 'פתוח' : 'בוצע'}
    </span>
  )
}
