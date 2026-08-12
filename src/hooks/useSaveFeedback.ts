import { useCallback, useState } from 'react'

export function useSaveFeedback() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const runSave = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true)
    setSaved(false)
    try {
      await fn()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, saved, runSave }
}
