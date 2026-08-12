import { getSetting, setSetting } from './db'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'menachem-theme'
export const THEME_SETTING_KEY = 'theme'
export const THEME_EVENT = 'menachem-theme-changed'

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }))
}

export async function persistTheme(theme: Theme) {
  applyTheme(theme)
  await setSetting(THEME_SETTING_KEY, theme)
}

export async function bootThemeFromDb() {
  const value = await getSetting(THEME_SETTING_KEY, getStoredTheme())
  if (value === 'dark' || value === 'light') applyTheme(value)
}

applyTheme(getStoredTheme())
