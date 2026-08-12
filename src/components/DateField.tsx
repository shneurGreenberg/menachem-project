import { Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDate, todayISO } from '../utils/dates'
import {
  currentHebrewParts,
  formatHebrewDate,
  getDaysInHebrewMonth,
  getHebrewMonthOptions,
  getHebrewYearOptions,
  hDatePartsToIso,
  isoToHDateParts,
} from '../utils/hebrewDate'
import { Icon, ICON_SIZE_SM } from './icons'

export type DateCalendarMode = 'greg' | 'hebrew'

interface DateFieldProps {
  label: string
  value: string
  onChange: (iso: string) => void
  required?: boolean
}

export function DateField({ label, value, onChange, required }: DateFieldProps) {
  const [mode, setMode] = useState<DateCalendarMode>('greg')
  const defaults = currentHebrewParts()
  const [hYear, setHYear] = useState(defaults.year)
  const [hMonth, setHMonth] = useState(defaults.month)
  const [hDay, setHDay] = useState(defaults.day)

  useEffect(() => {
    if (!value) return
    const parts = isoToHDateParts(value)
    setHYear(parts.year)
    setHMonth(parts.month)
    setHDay(parts.day)
  }, [value])

  function updateHebrew(year: number, month: number, day: number) {
    const maxDay = getDaysInHebrewMonth(month, year)
    const safeDay = Math.min(Math.max(1, day), maxDay)
    setHYear(year)
    setHMonth(month)
    setHDay(safeDay)
    onChange(hDatePartsToIso(year, month, safeDay))
  }

  const monthOptions = getHebrewMonthOptions(hYear)
  const yearOptions = getHebrewYearOptions()
  const maxDay = getDaysInHebrewMonth(hMonth, hYear)
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1)

  return (
    <div className="field date-field">
      <div className="date-field-header">
        <label>{label}</label>
        <div className="date-field-tools">
          <div className="date-mode-toggle" role="group" aria-label="סוג לוח שנה">
            <button
              type="button"
              className={mode === 'greg' ? 'is-active' : ''}
              onClick={() => setMode('greg')}
              aria-pressed={mode === 'greg'}
            >
              לועזי
            </button>
            <button
              type="button"
              className={mode === 'hebrew' ? 'is-active' : ''}
              onClick={() => setMode('hebrew')}
              aria-pressed={mode === 'hebrew'}
            >
              עברי
            </button>
          </div>
          <button
            type="button"
            className="date-today-btn"
            onClick={() => onChange(todayISO())}
          >
            היום
          </button>
        </div>
      </div>

      {mode === 'greg' ? (
        <input
          className="date-greg-input"
          type="date"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="hebrew-date-row">
          <select
            aria-label="יום"
            required={required}
            value={value ? hDay : ''}
            onChange={(e) => {
              const day = Number(e.target.value)
              if (!day) return
              updateHebrew(hYear, hMonth, day)
            }}
          >
            {!value && <option value="">יום</option>}
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            aria-label="חודש"
            required={required}
            value={value ? hMonth : ''}
            onChange={(e) => {
              const month = Number(e.target.value)
              if (!month) return
              updateHebrew(hYear, month, hDay || 1)
            }}
          >
            {!value && <option value="">חודש</option>}
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            aria-label="שנה"
            required={required}
            value={value ? hYear : ''}
            onChange={(e) => {
              const year = Number(e.target.value)
              if (!year) return
              updateHebrew(year, hMonth || 1, hDay || 1)
            }}
          >
            {!value && <option value="">שנה</option>}
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="date-field-hint">
        <Icon icon={Calendar} size={ICON_SIZE_SM} />
        <span>לועזי {formatDate(value)}</span>
        <span className="date-hint-sep">·</span>
        <span>עברי {formatHebrewDate(value)}</span>
      </div>
    </div>
  )
}
