import { useCallback, useState } from 'react'

export function useSaveFeedback() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const runSave = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await fn()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השמירה נכשלה')
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, saved, error, runSave }
}
