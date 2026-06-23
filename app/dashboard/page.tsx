'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { getTura, getMonday, fmtDateInput, TURA_INFO } from '@/lib/rotatie'

const ZILE = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']
const LUNI = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']

export default function Dashboard() {
  const { angajat, echipa, loading } = useAuth()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = (() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  })()

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const azi = new Date(); azi.setHours(0, 0, 0, 0)
  const aziStr = fmtDateInput(azi)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1e]">
      <div className="w-8 h-8 border-2 border-[#60cdff]/20 border-t-[#60cdff] rounded-full animate-spin" />
    </div>
  )

  if (!angajat) return null

  const turaAziTip = getTura(azi, angajat, echipa)
  const turaAziInfo = TURA_INFO[turaAziTip] ?? TURA_INFO.L
  const prenume = angajat.nume.split(' ').pop() ?? angajat.nume

  const lunaLabel = `${LUNI[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col pb-24">

      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-[13px]">Bună,</p>
          <h1 className="text-[26px] font-black text-white leading-tight">{prenume} 👋</h1>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
          className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Card tura de azi */}
      <div className="px-5 mt-4 mb-6">
        <div className={`rounded-3xl p-6 border ${turaAziInfo.bg} ${turaAziInfo.border}`}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Tura de azi</p>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[42px] font-black leading-none ${turaAziInfo.text}`}>
                {turaAziInfo.label}
              </p>
              <p className="text-white/40 text-[13px] mt-2 capitalize">
                {azi.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <span className="text-[48px]">{turaAziInfo.icon}</span>
          </div>
        </div>
      </div>

      {/* Saptamana */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Săptămâna</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(o => o - 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-400 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-zinc-400 min-w-[110px] text-center capitalize">{lunaLabel}</span>
            <button onClick={() => setWeekOffset(o => o + 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-400 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const tip = getTura(d, angajat, echipa)
            const info = TURA_INFO[tip] ?? TURA_INFO.L
            const isToday = fmtDateInput(d) === aziStr
            const isWE = d.getDay() === 0 || d.getDay() === 6
            return (
              <div key={i} className={`flex flex-col items-center gap-1 ${isWE ? 'opacity-60' : ''}`}>
                <span className={`text-[10px] font-semibold ${isToday ? 'text-[#60cdff]' : 'text-zinc-600'}`}>
                  {ZILE[i]}
                </span>
                <span className={`text-[11px] font-bold ${isToday ? 'text-white' : 'text-zinc-500'}`}>
                  {d.getDate()}
                </span>
                <div className={`w-full aspect-square rounded-xl border flex items-center justify-center text-[13px]
                  ${info.bg} ${info.border}
                  ${isToday ? 'ring-2 ring-[#60cdff]/50 ring-offset-1 ring-offset-[#1c1c1e]' : ''}
                `}>
                  {tip === 'D' ? '☀' : tip === 'S' ? '🌙' : tip === 'CO' ? '🏖' : tip === 'CM' ? '🏥' : tip === 'AN' ? '⛔' : '○'}
                </div>
              </div>
            )
          })}
        </div>

        {/* CO ramas */}
        <div className="mt-6 bg-[#2c2c2e] border border-white/[0.07] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Zile CO rămase</p>
            <p className="text-[36px] font-black text-white leading-none">{angajat.zile_co}</p>
          </div>
          <span className="text-[40px]">🌴</span>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
