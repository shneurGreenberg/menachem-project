import { todayISO } from './dates'

const NOTIFY_SETTING = 'notifyDueToday'

export async function requestNotifyPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function notifyDueToday(count: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (count <= 0) return
  const key = `menachem-notify-${todayISO()}`
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
  try {
    new Notification('ניהול אישי', {
      body: `${count} לביצוע היום`,
      lang: 'he',
      dir: 'rtl',
    })
  } catch {
    /* ignore */
  }
}

export { NOTIFY_SETTING }
