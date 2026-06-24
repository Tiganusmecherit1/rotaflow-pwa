'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { getTura, getMonday, fmtDateInput, TURA_INFO } from '@/lib/rotatie'

const ZILE_SCURT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']
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

  const azi = new Date(); azi.setHours(0,0,0,0)
  const aziStr = fmtDateInput(azi)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1c1c1e' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,205,255,0.2)', borderTopColor: '#60cdff', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!angajat) return null

  const turaAziTip = getTura(azi, angajat, echipa)
  const turaAziInfo = TURA_INFO[turaAziTip] ?? TURA_INFO.L
  const prenume = angajat.nume.split(' ').slice(-1)[0] || angajat.nume

  // Tura de maine
  const maine = new Date(azi.getTime() + 86400000)
  const turaMaine = getTura(maine, angajat, echipa)
  const turaMaineInfo = TURA_INFO[turaMaine] ?? TURA_INFO.L

  const lunaLabel = `${LUNI[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  return (
    <div className="min-h-screen" style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: '90px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p className="text-[13px]" style={{ color: '#8e8e93' }}>Bună,</p>
          <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">{prenume} 👋</h1>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
          className="flex items-center justify-center active:scale-95 transition-all"
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Card tura de azi — HERO */}
      <div className="px-5 mt-5">
        <div className={`rounded-3xl p-6 ${turaAziInfo.bg} ${turaAziInfo.border} border relative overflow-hidden`}
          style={{ boxShadow: turaAziTip === 'L' ? 'none' : '0 8px 40px rgba(0,0,0,0.4)' }}>

          {/* Subtle pattern */}
          {turaAziTip !== 'L' && (
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}/>
          )}

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Tura de azi
              </p>
              <p className={`text-[44px] font-black leading-none ${turaAziInfo.text}`}>
                {turaAziInfo.label}
              </p>
              <p className="text-[13px] mt-2.5 capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {azi.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <span className="text-[48px] opacity-80">{turaAziInfo.emoji}</span>
          </div>

          {/* Maine preview */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Mâine</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px]">{turaMaineInfo.emoji}</span>
                <span className={`text-[13px] font-semibold ${turaMaineInfo.text}`}>{turaMaineInfo.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saptamana */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#8e8e93' }}>
            Săptămâna
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(o => o-1)}
              className="flex items-center justify-center active:scale-95 transition-all"
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] capitalize min-w-[110px] text-center" style={{ color: '#8e8e93' }}>{lunaLabel}</span>
            <button onClick={() => setWeekOffset(o => o+1)}
              className="flex items-center justify-center active:scale-95 transition-all"
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* 7 day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const tip = getTura(d, angajat, echipa)
            const info = TURA_INFO[tip] ?? TURA_INFO.L
            const isToday = fmtDateInput(d) === aziStr
            const isWE = d.getDay() === 0 || d.getDay() === 6

            return (
              <div key={i} className={`flex flex-col items-center gap-1.5 ${isWE ? 'opacity-55' : ''}`}>
                <span className="text-[10px] font-semibold" style={{ color: isToday ? '#60cdff' : '#636366' }}>
                  {ZILE_SCURT[i]}
                </span>
                <span className="text-[12px] font-bold" style={{ color: isToday ? 'white' : '#8e8e93' }}>
                  {d.getDate()}
                </span>
                <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center text-[15px] ${info.bgCard} ${info.borderCard} transition-all`}
                  style={isToday ? { boxShadow: '0 0 0 2px rgba(96,205,255,0.5), 0 0 0 4px rgba(96,205,255,0.1)' } : {}}>
                  {tip === 'D' ? '☀' : tip === 'S' ? '🌙' : tip === 'CO' ? '🏖' : tip === 'CM' ? '🏥' : tip === 'AN' ? '⛔' : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* CO ramas */}
        <div className="mt-5 rounded-2xl p-4 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8e8e93' }}>
              Zile CO rămase
            </p>
            <p className="text-[38px] font-black text-white leading-none">{angajat.zile_co}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[36px]">🌴</span>
            <span className="text-[10px]" style={{ color: '#636366' }}>din 24 total</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
