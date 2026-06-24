'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getTura, fmtDateInput } from '@/lib/rotatie'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZILE_LUNG = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă']
const ZILE_SCURT = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']

const TURA_CONFIG: Record<string, {
  label: string; emoji: string
  bg: string; color: string; border: string
  pillBg: string; pillColor: string
}> = {
  D:  { label:'Dimineață', emoji:'☀️', bg:'rgba(30,79,168,0.18)',  color:'#93c5fd', border:'rgba(59,130,246,0.3)',  pillBg:'rgba(30,79,168,0.5)',  pillColor:'#bfdbfe' },
  S:  { label:'Seară',     emoji:'🌙', bg:'rgba(76,29,138,0.18)',  color:'#c4b5fd', border:'rgba(139,92,246,0.3)', pillBg:'rgba(76,29,138,0.5)',  pillColor:'#ddd6fe' },
  L:  { label:'Liber',     emoji:'',   bg:'transparent',            color:'#4b4b60', border:'rgba(255,255,255,0.05)', pillBg:'rgba(255,255,255,0.06)', pillColor:'#6b6b80' },
  CO: { label:'Concediu',  emoji:'🏖️', bg:'rgba(127,29,29,0.18)',  color:'#fca5a5', border:'rgba(239,68,68,0.25)', pillBg:'rgba(127,29,29,0.5)',  pillColor:'#fecaca' },
  CM: { label:'Medical',   emoji:'🏥', bg:'rgba(124,45,18,0.18)',  color:'#fdba74', border:'rgba(249,115,22,0.25)',pillBg:'rgba(124,45,18,0.5)',  pillColor:'#fed7aa' },
  AN: { label:'Absent',    emoji:'⛔', bg:'rgba(69,10,10,0.18)',   color:'#f87171', border:'rgba(220,38,38,0.25)', pillBg:'rgba(69,10,10,0.5)',   pillColor:'#fca5a5' },
}

export default function LunaPage() {
  const { angajat, echipa, loading } = useAuth()
  const [lunaOffset, setLunaOffset] = useState(0)
  const [view, setView] = useState<'lista'|'grid'>('lista')

  const lunaStart = new Date(new Date().getFullYear(), new Date().getMonth() + lunaOffset, 1)
  const lunaEnd   = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)

  if (loading) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>
  if (!angajat) return null

  // Zilele lunii
  const zile: Date[] = Array.from({length: lunaEnd.getDate()}, (_,i) =>
    new Date(lunaStart.getFullYear(), lunaStart.getMonth(), i+1)
  )

  // Stats
  const stats = zile.reduce((acc, d) => {
    const t = getTura(d, angajat, echipa)
    acc[t] = (acc[t]||0) + 1
    return acc
  }, {} as Record<string,number>)

  // Grid calendar
  const firstDow = (lunaStart.getDay()+6)%7
  const cells: (Date|null)[] = [...Array(firstDow).fill(null), ...zile]
  while(cells.length%7!==0) cells.push(null)

  return (
    <div style={{minHeight:'100vh', background:'#1a1a1f', paddingBottom:88, paddingTop:'env(safe-area-inset-top,0px)'}}>

      {/* Header */}
      <div style={{padding:'12px 16px 0'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <div style={{fontSize:22, fontWeight:800, color:'white', letterSpacing:-0.5}}>Program lunar</div>
          {/* Toggle lista/grid */}
          <div style={{display:'flex', background:'#26262e', borderRadius:10, padding:3, border:'1px solid rgba(255,255,255,0.08)'}}>
            {(['lista','grid'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{
                padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600, fontFamily:'inherit',
                background: view===v ? '#3a3a4a' : 'transparent',
                color: view===v ? 'white' : '#6b6b80',
                transition:'all 0.15s',
              }}>
                {v==='lista' ? '≡ Listă' : '⊞ Grilă'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigator luna */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14,
          background:'#26262e', borderRadius:14, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={()=>setLunaOffset(o=>o-1)} style={{
            width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16, fontWeight:700, color:'white'}}>{LUNI[lunaStart.getMonth()]}</div>
            <div style={{fontSize:11, color:'#6b6b80', marginTop:1}}>{lunaStart.getFullYear()}</div>
          </div>
          <button onClick={()=>setLunaOffset(o=>o+1)} style={{
            width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Stats pills */}
        <div style={{display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:2}}>
          {(['D','S','CO','L'] as const).filter(t => (stats[t]||0) > 0).map(t => {
            const c = TURA_CONFIG[t]
            return (
              <div key={t} style={{
                display:'flex', alignItems:'center', gap:6,
                background:c.pillBg, borderRadius:20, padding:'6px 12px',
                border:`1px solid ${c.border}`, flexShrink:0,
              }}>
                {c.emoji && <span style={{fontSize:13}}>{c.emoji}</span>}
                <span style={{fontSize:13, fontWeight:700, color:c.pillColor}}>{stats[t]}</span>
                <span style={{fontSize:11, color:c.color, opacity:0.8}}>{c.label}</span>
              </div>
            )
          })}
        </div>

        {/* ═══ LISTA VIEW ═══ */}
        {view === 'lista' && (
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            {zile.map((d, i) => {
              const tip = getTura(d, angajat, echipa)
              const c = TURA_CONFIG[tip] ?? TURA_CONFIG.L
              const isToday = fmtDateInput(d) === fmtDateInput(azi)
              const isWE = d.getDay()===0 || d.getDay()===6
              const isPast = d < azi

              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center',
                  background: isToday ? 'rgba(96,165,250,0.1)' : c.bg,
                  borderRadius:14,
                  border: isToday
                    ? '1.5px solid rgba(96,165,250,0.5)'
                    : `1px solid ${c.border}`,
                  padding:'11px 14px',
                  opacity: isPast && !isToday ? 0.55 : 1,
                  boxShadow: isToday ? '0 0 0 3px rgba(96,165,250,0.1)' : 'none',
                }}>

                  {/* Data — contrast maxim */}
                  <div style={{width:46, flexShrink:0}}>
                    <div style={{
                      fontSize:22, fontWeight:900, lineHeight:1,
                      color: isToday ? '#60a5fa' : isWE ? '#a0a0b8' : 'white',
                    }}>
                      {d.getDate()}
                    </div>
                    <div style={{
                      fontSize:10, fontWeight:600, marginTop:1, textTransform:'uppercase', letterSpacing:'0.05em',
                      color: isToday ? '#93c5fd' : isWE ? '#6b6b80' : '#8b8b9e',
                    }}>
                      {ZILE_SCURT[d.getDay()]}
                    </div>
                  </div>

                  {/* Separator */}
                  <div style={{width:1, height:32, background:'rgba(255,255,255,0.07)', margin:'0 12px', flexShrink:0}}/>

                  {/* Ziua saptamanii + tura */}
                  <div style={{flex:1}}>
                    <div style={{
                      fontSize:13, fontWeight:600,
                      color: isToday ? 'white' : isWE ? '#8b8b9e' : 'rgba(255,255,255,0.85)',
                    }}>
                      {ZILE_LUNG[d.getDay()]}
                    </div>
                    {tip !== 'L' && (
                      <div style={{fontSize:11, color:c.color, marginTop:2, fontWeight:500}}>
                        {c.emoji} {c.label}
                      </div>
                    )}
                  </div>

                  {/* Badge tura */}
                  <div style={{
                    background:c.pillBg, borderRadius:8, padding:'4px 10px',
                    border:`1px solid ${c.border}`,
                    fontSize:12, fontWeight:800, color:c.pillColor,
                    flexShrink:0,
                  }}>
                    {tip === 'L' ? '—' : tip}
                  </div>

                  {/* Indicator azi */}
                  {isToday && (
                    <div style={{
                      width:6, height:6, borderRadius:'50%', background:'#60a5fa',
                      marginLeft:8, flexShrink:0,
                    }}/>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ GRID VIEW ═══ */}
        {view === 'grid' && (
          <div style={{background:'#26262e', borderRadius:18, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)'}}>
            {/* Header zile */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
              {['Lu','Ma','Mi','Jo','Vi','Sâ','Du'].map((z,i) => (
                <div key={i} style={{
                  textAlign:'center', padding:'10px 0',
                  fontSize:11, fontWeight:700,
                  color: i>=5 ? '#4b4b60' : '#8b8b9e',
                }}>{z}</div>
              ))}
            </div>
            {/* Saptamani */}
            {Array.from({length:cells.length/7}, (_,wi) => (
              <div key={wi} style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                {cells.slice(wi*7,(wi+1)*7).map((d,di) => {
                  if (!d) return <div key={di}/>
                  const tip = getTura(d, angajat, echipa)
                  const c = TURA_CONFIG[tip] ?? TURA_CONFIG.L
                  const isToday = fmtDateInput(d) === fmtDateInput(azi)
                  const isWE = d.getDay()===0 || d.getDay()===6
                  return (
                    <div key={di} style={{padding:3}}>
                      <div style={{
                        borderRadius:10, padding:'7px 4px',
                        background: isToday ? 'rgba(96,165,250,0.15)' : c.bg,
                        border: isToday ? '1.5px solid #60a5fa' : `1px solid ${c.border}`,
                        display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                        boxShadow: isToday ? '0 0 0 2px rgba(96,165,250,0.2)' : 'none',
                      }}>
                        {/* Numar zi — mare si vizibil */}
                        <span style={{
                          fontSize:14, fontWeight:800, lineHeight:1,
                          color: isToday ? '#60a5fa' : isWE ? '#6b6b80' : 'white',
                        }}>
                          {d.getDate()}
                        </span>
                        {/* Badge tura */}
                        <span style={{
                          fontSize:9, fontWeight:800,
                          color: tip==='L' ? '#4b4b60' : c.pillColor,
                        }}>
                          {tip==='L' ? '' : tip}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
