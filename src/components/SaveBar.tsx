import { Loader2, Save } from 'lucide-react'
import { Icon, ICON_SIZE_SM } from './icons'

export type SaveBarVariant = 'shlichut' | 'chinuch' | 'bayit' | 'default'

interface SaveBarProps {
  dirty: boolean
  saving?: boolean
  saved?: boolean
  onSave: () => void
  variant?: SaveBarVariant
}

export function SaveBar({
  dirty,
  saving = false,
  saved = false,
  onSave,
  variant = 'default',
}: SaveBarProps) {
  if (!dirty && !saved) return null

  return (
    <div className="save-bar" role="status" aria-live="polite">
      <span className={`save-bar-msg ${saved ? 'saved' : ''}`}>
        {saved ? 'נשמר בהצלחה' : 'יש שינויים שלא נשמרו'}
      </span>
      <button
        type="button"
        className={`btn ${variant === 'default' ? '' : variant}`}
        onClick={onSave}
        disabled={saving || saved}
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
