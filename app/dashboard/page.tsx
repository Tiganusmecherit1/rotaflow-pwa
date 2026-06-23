'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getUserProfile, signOut, UserProfile } from '@/lib/auth'
import BottomNav from '@/components/BottomNav'

// ─── Tipuri ───────────────────────────────────────────────────────────────────
interface Concediu { s: string; e: string }
interface Angajat {
  id: number; uuid?: string; nume: string; zileCO: number
  concedii: Concediu[]; absente: { data: string; tip: string; zile: number }[]
  este_sef: boolean; pozitie_rotatie: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseD = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
const fmtDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const getMonday = (d: Date) => { const r=new Date(d); r.setDate(d.getDate()-((d.getDay()+6)%7)); r.setHours(0,0,0,0); return r; }

const ZILE = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du']
const LUNI_RO = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']

function inCO(d: Date, m: Angajat): boolean {
  return m.concedii.some(c => { const s=parseD(c.s),e=parseD(c.e); e.setHours(23,59,59); return d>=s&&d<=e; })
}
function inAbsenta(d: Date, m: Angajat): boolean {
  const dStr = fmtDateInput(d)
  return m.absente.some(a => a.data === dStr)
}

function getTura(d: Date, angajat: Angajat, toataEchipa: Angajat[]): { type: string; label: string } {
  if (inAbsenta(d, angajat)) {
    const abs = angajat.absente.find(a => a.data === fmtDateInput(d))
    return { type: abs?.tip ?? 'AN', label: abs?.tip ?? 'AN' }
  }
  if (inCO(d, angajat)) return { type: 'CO', label: 'CO' }

  const activi = toataEchipa.filter(a => !inCO(d,a) && !inAbsenta(d,a))
  const poz = activi.findIndex(a => a.id === angajat.id)
  if (poz === -1) return { type: 'L', label: 'L' }

  const ref = new Date(2026,0,1)
  const dayIdx = Math.floor((d.getTime()-ref.getTime())/86400000)
  const n = activi.length
  const sec = ((dayIdx+poz)%n+n)%n
  if (sec===0||sec===1) return { type: 'D', label: 'Dimineață' }
  if (sec===2) return { type: 'S', label: 'Seară' }
  return { type: 'L', label: 'Liber' }
}

const SHIFT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  D:  { bg: 'bg-sky-800/60',    text: 'text-sky-100',    border: 'border-sky-400/40' },
  S:  { bg: 'bg-purple-800/60', text: 'text-purple-100', border: 'border-purple-400/40' },
  L:  { bg: 'bg-white/[0.04]',  text: 'text-zinc-500',   border: 'border-white/[0.06]' },
  CO: { bg: 'bg-rose-800/50',   text: 'text-rose-100',   border: 'border-rose-400/30' },
  CM: { bg: 'bg-orange-800/50', text: 'text-orange-100', border: 'border-orange-400/30' },
  AN: { bg: 'bg-red-800/50',    text: 'text-red-100',    border: 'border-red-400/30' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [angajat, setAngajat] = useState<Angajat | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const weekStart = getMonday(new Date())
  weekStart.setDate(weekStart.getDate() + weekOffset * 7)

  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); return d;
  })

  const azi = new Date(); azi.setHours(0,0,0,0)
  const astazi = days.find(d => fmtDateInput(d) === fmtDateInput(azi))

  useEffect(() => {
    async function load() {
      const p = await getUserProfile()
      if (!p) { router.replace('/login'); return; }
      setProfile(p)

      // Daca e sef, redirectam la view complet
      if (p.este_sef) { router.replace('/sef'); return; }

      // Incarcam toata echipa
      const { data } = await supabase.rpc('get_all_data').single() as any
      if (data) {
        const ec: Angajat[] = (data.angajati || []).map((a: any) => ({
          id: a.id, uuid: a.uuid, nume: a.nume, zileCO: a.zile_co,
          este_sef: a.este_sef, pozitie_rotatie: a.pozitie_rotatie,
          concedii: a.concedii || [], absente: a.absente || []
        }))
        setEchipa(ec)
        const self = ec.find(a => a.uuid === p.uuid)
        if (self) setAngajat(self)
      }
      setLoading(false)
    }
    load()
  }, [router])

  // Fetch via API route (mai simplu decat RPC)
  useEffect(() => {
    if (!profile || profile.este_sef) return
    fetch('/api/data')
      .then(r => r.json())
      .then(data => {
        const ec: Angajat[] = (data.angajati || []).map((a: any) => ({
          id: a.id, uuid: a.uuid, nume: a.nume, zileCO: a.zile_co,
          este_sef: a.este_sef, pozitie_rotatie: a.pozitie_rotatie,
          concedii: data.concedii?.filter((c: any) => c.angajat_id === a.id).map((c: any) => ({s: c.start, e: c.end})) || [],
          absente: data.absente?.filter((ab: any) => ab.angajat_id === a.id) || []
        }))
        setEchipa(ec)
        const self = ec.find(a => a.uuid === profile.uuid)
        if (self) setAngajat(self)
        setLoading(false)
      })
  }, [profile])

  if (loading) return (
    <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#60cdff]/30 border-t-[#60cdff] rounded-full animate-spin"/>
    </div>
  )

  if (!angajat) return null

  const turaAzi = astazi ? getTura(astazi, angajat, echipa) : null
  const colorsAzi = turaAzi ? (SHIFT_COLORS[turaAzi.type] ?? SHIFT_COLORS.L) : SHIFT_COLORS.L

  const lunaLabel = `${LUNI_RO[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-sm">Bună,</p>
            <h1 className="text-2xl font-black text-white">{angajat.nume.split(' ')[0]} 👋</h1>
          </div>
          <button onClick={async () => { await signOut(); router.replace('/login'); }}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tura de azi */}
      {turaAzi && (
        <div className="px-5 mb-6">
          <div className={`rounded-2xl p-5 border ${colorsAzi.bg} ${colorsAzi.border}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">Tura de azi</p>
            <p className={`text-4xl font-black ${colorsAzi.text}`}>{turaAzi.label}</p>
            <p className="text-white/40 text-sm mt-1 capitalize">{astazi?.toLocaleDateString('ro-RO', {weekday:'long', day:'numeric', month:'long'})}</p>
          </div>
        </div>
      )}

      {/* Saptamana */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider">Săptămâna</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(o=>o-1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-zinc-400 capitalize min-w-[100px] text-center">{lunaLabel}</span>
            <button onClick={() => setWeekOffset(o=>o+1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const t = getTura(d, angajat, echipa)
            const colors = SHIFT_COLORS[t.type] ?? SHIFT_COLORS.L
            const isToday = fmtDateInput(d) === fmtDateInput(azi)
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            return (
              <div key={i} className={`flex flex-col items-center gap-1.5 ${isWeekend ? 'opacity-70' : ''}`}>
                <span className={`text-[10px] font-semibold ${isToday ? 'text-[#60cdff]' : 'text-zinc-600'}`}>
                  {ZILE[i]}
                </span>
                <span className={`text-[11px] font-bold ${isToday ? 'text-white' : 'text-zinc-500'}`}>
                  {d.getDate()}
                </span>
                <div className={`w-full aspect-square rounded-xl border flex items-center justify-center text-[12px] font-black ${colors.bg} ${colors.text} ${colors.border} ${isToday ? 'ring-2 ring-[#60cdff]/40' : ''}`}>
                  {t.type === 'D' ? '☀' : t.type === 'S' ? '🌙' : t.type === 'CO' ? '🏖' : t.type === 'CM' ? '🏥' : '○'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex gap-4 mt-4 justify-center">
          {[['D','☀ Dimineață'],['S','🌙 Seară'],['CO','🏖 Concediu']].map(([t,l])=>(
            <div key={t} className="flex items-center gap-1.5 text-[11px] text-zinc-500">{l}</div>
          ))}
        </div>

        {/* CO ramas */}
        <div className="mt-6 bg-[#2c2c2e] border border-white/[0.07] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Zile CO rămase</p>
            <p className="text-3xl font-black text-white mt-0.5">{angajat.zileCO}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-2xl">
            🌴
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
