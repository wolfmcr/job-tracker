const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount: number) {
  return currency.format(amount)
}

export function formatHours(hours: number) {
  return `${Number(hours.toFixed(2))} hr${hours === 1 ? '' : 's'}`
}

// Local date as YYYY-MM-DD (what <input type="date"> uses)
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// YYYY-MM-DD as a local-midnight Date
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso: string) {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// Trims bullets and drops empty ones (BulletListInput keeps a blank line for typing)
export function cleanBullets(bullets: string[]) {
  return bullets.map(b => b.trim()).filter(Boolean)
}

// "Due today", "Due tomorrow", "Overdue · Mon, Oct 20", else "Due Fri, Oct 24"; tone drives the colour
export function describeDueDate(iso: string) {
  const days = Math.round((parseISODate(iso).getTime() - parseISODate(todayISO()).getTime()) / 86_400_000)
  if (days < 0) return { label: `Overdue · ${formatDate(iso)}`, tone: 'overdue' as const }
  if (days === 0) return { label: 'Due today', tone: 'today' as const }
  if (days === 1) return { label: 'Due tomorrow', tone: 'upcoming' as const }
  return { label: `Due ${formatDate(iso)}`, tone: 'upcoming' as const }
}

// US phone numbers as (503) 555-1234, formatting progressively while typing.
// Anything that isn't a 10-digit (or 1 + 10-digit) number is left as typed.
export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (raw.trim().startsWith('+') && !raw.trim().startsWith('+1')) return raw
  if (national.length > 10) return raw
  if (national.length === 0) return ''
  if (national.length <= 3) return `(${national}`
  if (national.length <= 6) return `(${national.slice(0, 3)}) ${national.slice(3)}`
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
}
