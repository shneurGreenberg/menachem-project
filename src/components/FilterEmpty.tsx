interface FilterEmptyProps {
  sourceCount: number
  filteredCount: number
  emptyLabel: string
  onClear: () => void
}

export function FilterEmpty({
  sourceCount,
  filteredCount,
  emptyLabel,
  onClear,
}: FilterEmptyProps) {
  if (filteredCount > 0) return null
  if (sourceCount === 0) {
    return <div className="empty">{emptyLabel}</div>
  }
  return (
    <div className="empty">
      אין תוצאות לסינון הנוכחי.{' '}
      <button type="button" className="btn small secondary" onClick={onClear}>
        נקה סינון
      </button>
    </div>
  )
}

export function listCountLabel(filtered: number, total: number): string {
  if (filtered === total) return String(total)
  return `${filtered} מתוך ${total}`
}
