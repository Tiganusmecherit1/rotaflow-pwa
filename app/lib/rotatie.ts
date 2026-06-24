const REF = new Date(2026, 0, 1)

export interface Concediu { s: string; e: string }
export interface Absenta { data: string; tip: string; zile: number }
export interface Angajat {
  id: number
  uuid: string
  nume: string
  zile_co: number
  este_sef: boolean
  pozitie_rotatie: number
  concedii: Concediu[]
  absente: Absenta[]
}

export function parseD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fmtDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function getMonday(d: Date): Date {
  const r = new Date(d)
  r.setDate(d.getDate() - ((d.getDay()+6)%7))
  r.setHours(0,0,0,0)
  return r
}

export function inCO(d: Date, m: Angajat): boolean {
  return m.concedii.some(c => {
    const s = parseD(c.s), e = parseD(c.e)
    e.setHours(23,59,59)
    return d >= s && d <= e
  })
}

export function inAbsenta(d: Date, m: Angajat): boolean {
  return m.absente.some(a => a.data === fmtDateInput(d))
}

export function getTura(d: Date, angajat: Angajat, toataEchipa: Angajat[]): string {
  if (inAbsenta(d, angajat)) return angajat.absente.find(a => a.data === fmtDateInput(d))?.tip ?? 'AN'
  if (inCO(d, angajat)) return 'CO'
  const activi = toataEchipa.filter(a => !inCO(d,a) && !inAbsenta(d,a))
  const poz = activi.findIndex(a => a.id === angajat.id)
  if (poz === -1) return 'L'
  const dayIdx = Math.floor((d.getTime() - REF.getTime()) / 86400000)
  const n = activi.length
  const sec = ((dayIdx + poz) % n + n) % n
  if (sec === 0 || sec === 1) return 'D'
  if (sec === 2) return 'S'
  return 'L'
}

export const TURA_INFO: Record<string, {
  label: string; emoji: string
  bg: string; text: string; border: string
  bgCard: string; textCard: string; borderCard: string
}> = {
  D: {
    label: 'Dimineață', emoji: '☀️',
    bg: 'bg-sky-800/70', text: 'text-sky-100', border: 'border-sky-400/50',
    bgCard: 'bg-sky-950/40', textCard: 'text-sky-300', borderCard: 'border-sky-500/30',
  },
  S: {
    label: 'Seară', emoji: '🌙',
    bg: 'bg-purple-800/70', text: 'text-purple-100', border: 'border-purple-400/50',
    bgCard: 'bg-purple-950/40', textCard: 'text-purple-300', borderCard: 'border-purple-500/30',
  },
  L: {
    label: 'Liber', emoji: '○',
    bg: 'bg-white/[0.05]', text: 'text-zinc-500', border: 'border-white/[0.06]',
    bgCard: 'bg-white/[0.03]', textCard: 'text-zinc-600', borderCard: 'border-white/[0.05]',
  },
  CO: {
    label: 'Concediu', emoji: '🏖️',
    bg: 'bg-rose-800/60', text: 'text-rose-100', border: 'border-rose-400/40',
    bgCard: 'bg-rose-950/40', textCard: 'text-rose-300', borderCard: 'border-rose-500/25',
  },
  CM: {
    label: 'Med.', emoji: '🏥',
    bg: 'bg-orange-800/60', text: 'text-orange-100', border: 'border-orange-400/40',
    bgCard: 'bg-orange-950/40', textCard: 'text-orange-300', borderCard: 'border-orange-500/30',
  },
  AN: {
    label: 'Absent', emoji: '⛔',
    bg: 'bg-red-800/60', text: 'text-red-100', border: 'border-red-400/40',
    bgCard: 'bg-red-950/40', textCard: 'text-red-300', borderCard: 'border-red-500/30',
  },
}
