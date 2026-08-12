import { Loader2, Save } from 'lucide-react'
import { Icon, ICON_SIZE_SM } from './icons'

export type SaveBarVariant = 'shlichut' | 'chinuch' | 'bayit' | 'default'

interface SaveBarProps {
  dirty: boolean
  saving?: boolean
  saved?: boolean
  onSave: () => void
  variant?: SaveBarVariant
  context?: string
}

export function SaveBar({
  dirty,
  saving = false,
  saved = false,
  onSave,
  variant = 'default',
  context,
}: SaveBarProps) {
  // Important: keep the bar visible while saving even if `dirty` becomes false
  // as part of the save callback.
  if (!dirty && !saved && !saving) return null

  const msg = saving
    ? `שומר…${context ? ` · ${context}` : ''}`
    : saved
      ? `נשמר בהצלחה${context ? ` · ${context}` : ''}`
      : `יש שינויים שלא נשמרו${context ? ` · ${context}` : ''}`

  return (
    <div className="save-bar" role="status" aria-live="polite">
      <span className={`save-bar-msg ${saved ? 'saved' : ''}`}>
        {msg}
      </span>
      <button
        type="button"
        className={`btn ${variant === 'default' ? '' : variant}`}
        onClick={onSave}
        disabled={saving || saved}
        aria-label={context ? `שמור · ${context}` : 'שמור'}
      >
        {saving ? (
          <>
            <Icon icon={Loader2} size={ICON_SIZE_SM} className="spin" />
            שומר…
          </>
        ) : (
          <>
            <Icon icon={Save} size={ICON_SIZE_SM} />
            שמור
          </>
        )}
      </button>
    </div>
  )
}
