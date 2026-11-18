/**
 * Short French relative time for a pin/comment timestamp ("il y a 12 min",
 * "hier"). Falls back to a plain clock time past a week, since "il y a 9
 * jours" is less useful than just reading the date at that point — though
 * in practice almost everything shown here is well inside the 24h window
 * these reports stay visible for.
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)
  if (diffSeconds < 45) return "à l'instant"

  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `il y a ${diffHours} h`

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffCalendarDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000))
  if (diffCalendarDays === 1) return 'hier'
  if (diffCalendarDays < 7) return `il y a ${diffCalendarDays} jours`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
