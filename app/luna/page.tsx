'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getTura, fmtDateInput, TURA_INFO } from '@/lib/rotatie'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZILE = ['L','M','M','J','V','S','D']

export default function LunaPage() {
  const { angajat, echipa, loading } = useAuth()
  const [lunaOffset, setLunaOffset] = useState(0)

  const now = new Date()
  const lunaStart = new Date(now.getFullYear(), now.getMonth() + lunaOffset, 1)
  const lunaEnd = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1c1c1e' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,205,255,0.2)', borderTopColor: '#60cdff', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!angajat) return null

  // Build calendar cells
  const firstDow = (lunaStart.getDay() + 6) % 7
  const cells: (Date|null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: lunaEnd.getDate() }, (_, i) => new Date(lunaStart.getFullYear(), lunaStart.getMonth(), i+1))
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Stats
  let nD=0, nS=0, nCO=0, nL=0
  for (let i=1; i<=lunaEnd.getDate(); i++) {
    const d = new Date(lunaStart.getFullYear(), lunaStart.getMonth(), i)
    const t = getTura(d, angajat, echipa)
    if (t==='D') nD++; else if (t==='S') nS++; else if (t==='CO') nCO++; else nL++
  }

  return (
    <div className="min-h-screen" style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: '90px' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[26px] font-black text-white">Calendar lunar</h1>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => setLunaOffset(o => o-1)}
            className="flex items-center justify-center active:scale-95"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-[16px] font-bold text-white flex-1 text-center capitalize">
            {LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}
          </span>
          <button onClick={() => setLunaOffset(o => o+1)}
            className="flex items-center justify-center active:scale-95"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="px-5 mb-4 grid grid-cols-4 gap-2">
        {[['☀️',nD,'sky','Dim'],['🌙',nS,'purple','Seară'],['🏖️',nCO,'rose','CO'],['○',nL,'zinc','Liber']].map(([ic,n,c,l]) => (
          <div key={String(l)} className="rounded-2xl p-3 text-center"
            style={{ background: `var(--${c}-bg, rgba(255,255,255,0.04))`, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[18px] leading-none mb-1">{ic}</div>
            <div className="text-[20px] font-black text-white leading-none">{n}</div>
            <div className="text-[9px] mt-1" style={{ color: '#636366' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="px-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(44,44,46,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Day headers */}
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {ZILE.map((z,i) => (
              <div key={i} className="text-center py-3 text-[11px] font-bold"
                style={{ color: i >= 5 ? '#636366' : '#8e8e93' }}>{z}</div>
            ))}
          </div>
          {/* Weeks */}
          {Array.from({ length: cells.length/7 }, (_, wi) => (
            <div key={wi} className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {cells.slice(wi*7, (wi+1)*7).map((d, di) => {
                if (!d) return <div key={di} className="p-1.5"/>
                const tip = getTura(d, angajat, echipa)
                const info = TURA_INFO[tip] ?? TURA_INFO.L
                const isToday = fmtDateInput(d) === fmtDateInput(azi)
                return (
                  <div key={di} className="p-1">
                    <div className={`rounded-xl flex flex-col items-center py-2 gap-0.5 ${info.bgCard} ${info.borderCard} border`}
                      style={isToday ? { boxShadow: '0 0 0 1.5px #60cdff' } : {}}>
                      <span className="text-[11px] font-bold" style={{ color: isToday ? '#60cdff' : 'rgba(255,255,255,0.6)' }}>
                        {d.getDate()}
                      </span>
                      <span className="text-[11px]">
                        {tip==='D'?'☀':tip==='S'?'🌙':tip==='CO'?'🏖':tip==='CM'?'🏥':tip==='AN'?'⛔':''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
