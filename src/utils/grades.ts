import type { Grade } from '../types'

export function gradePercent(g: Grade): number {
  if (!g.maxScore) return 0
  return (g.score / g.maxScore) * 100
}

export function averagePercent(grades: Grade[]): number | null {
  if (!grades.length) return null
  const sum = grades.reduce((s, g) => s + gradePercent(g), 0)
  return sum / grades.length
}

export function formatAvg(n: number | null): string {
  if (n == null) return 'אין ציונים'
  return `ממוצע ${Math.round(n)}`
}
