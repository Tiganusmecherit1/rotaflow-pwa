'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fmtDateInput, getMonday } from '@/lib/rotatie'
import { TuraMirror } from '@/components/AuthProvider'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const LUNI_SCURT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const ZILE_LUNG = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']
const ZILE_SCURT = ['L','M','M','J','V','S','D']

const TC: Record<string,{bg:string;color:string;label:string;emoji:string}> = {
  D:  {bg:'rgba(37,99,235,0.25)', color:'#93c5fd', label:'Dimineață', emoji:'☀️'},
  S:  {bg:'rgba(109,40,217,0.25)',color:'#c4b5fd', label:'Seară',     emoji:'🌙'},
  L:  {bg:'rgba(255,255,255,0.04)',color:'#4b4b60',label:'Liber',     emoji:''},
  CO: {bg:'rgba(127,29,29,0.25)', color:'#fca5a5', label:'Concediu', emoji:'🏖️'},
  CM: {bg:'rgba(124,45,18,0.25)', color:'#fdba74', label:'Medical',  emoji:'🏥'},
  AN: {bg:'rgba(69,10,10,0.25)',  color:'#f87171', label:'Absent',   emoji:'⛔'},
}

interface Angajat { id: number; uuid: string; nume: string; pozitie_rotatie: number }

function getTura(tureMirror: TuraMirror[], angajatId: number, d: Date): string {
  const dStr = fmtDateInput(d)
  return tureMirror.find(t => t.angajat_id === angajatId && t.data === dStr)?.tura ?? 'L'
}

function Spinner() {
  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid rgba(96,165,250,0.2)',borderTopColor:'#60a5fa',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function SefPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nume, setNume] = useState('')
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [tureMirror, setTureMirror] = useState<TuraMirror[]>([])
  const [tab, setTab] = useState<'azi'|'luna'|'stats'>('azi')
  const [lunaOffset, setLunaOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: angajatData } = await supabase
        .from('angajati').select('*').eq('id', session.user.id).single()
      if (!angajatData?.este_sef) { router.replace('/dashboard'); return }

      // Prenume
      const parts = (angajatData.nume || '').split(' ')
      setNume(parts[parts.length > 1 ? 0 : 0] || 'Șef')

      // Echipa
      const { data: ec } = await supabase
        .from('angajati').select('id,uuid:id,nume,pozitie_rotatie')
        .eq('este_sef', false).order('pozitie_rotatie')
      setEchipa((ec || []).map((a:any) => ({
        id: a.pozitie_rotatie, uuid: a.id, nume: a.nume, pozitie_rotatie: a.pozitie_rotatie
      })))

      // Ture mirror
      const azi = new Date(); azi.setDate(azi.getDate()-7)
      const { data: tm } = await supabase
        .from('ture_mirror').select('angajat_id,data,tura')
        .gte('data', azi.toISOString().split('T')[0])
      setTureMirror(tm || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Spinner/>

  const azi = new Date(); azi.setHours(0,0,0,0)
  const prenume = nume.split(' ')[0] || 'Șef'

  const weekStart = (() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  })()
  const days = Array.from({length:7},(_,i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); return d
  })

  const lunaStart = new Date(azi.getFullYear(), azi.getMonth()+lunaOffset, 1)
  const lunaEnd = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const firstDow = (lunaStart.getDay()+6)%7
  const cells: (Date|null)[] = [...Array(firstDow).fill(null),
    ...Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1))]
  while(cells.length%7!==0) cells.push(null)

  // Stats luna curenta
  const oreAngajat: Record<number,number> = {}
  echipa.forEach(m => { oreAngajat[m.id] = 0 })
  for (let i=1; i<=lunaEnd.getDate(); i++) {
    const d = new Date(lunaStart.getFullYear(), lunaStart.getMonth(), i)
    echipa.forEach(m => {
      const t = getTura(tureMirror, m.id, d)
      if (t==='D'||t==='S') oreAngajat[m.id] += 8
    })
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:20,paddingTop:'env(safe-area-inset-top,0px)'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(145deg,#d97706,#b45309)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(217,119,6,0.4)'}}>
            <span style={{fontSize:16}}>👑</span>
          </div>
          <div>
            <div style={{fontSize:11,color:'#8b8b9e'}}>Bună, {prenume}</div>
            <div style={{fontSize:15,fontWeight:700,color:'white',letterSpacing:-0.3}}>RotaFlow Manager</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <a href="https://rotaflow-app.vercel.app" target="_blank" rel="noopener noreferrer"
            style={{background:'rgba(217,119,6,0.15)',border:'1px solid rgba(217,119,6,0.3)',borderRadius:10,padding:'6px 10px',color:'#fbbf24',fontSize:11,fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
            🖥 Desktop
          </a>
          <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}}
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'6px 10px',color:'#6b6b80',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            Ieșire
          </button>
        </div>
      </div>

      {/* Tab-uri */}
      <div style={{display:'flex',margin:'8px 16px',background:'#26262e',borderRadius:12,padding:3,border:'1px solid rgba(255,255,255,0.07)'}}>
        {([['azi','👥 Echipa azi'],['luna','📅 Calendar'],['stats','📊 Statistici']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{
            flex:1,padding:'8px 4px',borderRadius:9,border:'none',cursor:'pointer',
            fontSize:12,fontWeight:600,fontFamily:'inherit',
            background:tab===v?'#3a3a4a':'transparent',
            color:tab===v?'white':'#6b6b80',
          }}>{l}</button>
        ))}
      </div>

      <div style={{padding:'4px 16px 0'}}>

        {/* ═══ TAB: ECHIPA AZI ═══ */}
        {tab==='azi' && (
          <div>
            {/* Navigator saptamana */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:30,height:30,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:13,fontWeight:600,color:'white'}}>
                {days[0].getDate()} — {days[6].getDate()} {LUNI_SCURT[days[6].getMonth()]}
                {weekOffset===0&&<span style={{fontSize:10,color:'#60a5fa',marginLeft:6}}>săpt. curentă</span>}
              </span>
              <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:30,height:30,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Grid saptamana — fiecare zi = coloana */}
            <div style={{background:'#26262e',borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
              {/* Header zile */}
              <div style={{display:'grid',gridTemplateColumns:`140px repeat(7,1fr)`,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{padding:'8px 10px',fontSize:10,color:'#4b4b60',fontWeight:700}}>ANGAJAT</div>
                {days.map((d,i)=>{
                  const isToday = fmtDateInput(d)===fmtDateInput(azi)
                  const isWE = d.getDay()===0||d.getDay()===6
                  return (
                    <div key={i} style={{padding:'8px 4px',textAlign:'center'}}>
                      <div style={{fontSize:9,fontWeight:700,color:isToday?'#60a5fa':isWE?'#4b4b60':'#6b6b80',textTransform:'uppercase'}}>{ZILE_LUNG[d.getDay()]}</div>
                      <div style={{fontSize:13,fontWeight:800,color:isToday?'#60a5fa':isWE?'#4b4b60':'white'}}>{d.getDate()}</div>
                    </div>
                  )
                })}
              </div>

              {/* Randuri angajati */}
              {echipa.map((m,mi)=>(
                <div key={mi} style={{display:'grid',gridTemplateColumns:'140px repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{padding:'8px 10px',display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(42,109,217,0.2)',border:'1px solid rgba(42,109,217,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#60a5fa',flexShrink:0}}>
                      {m.nume.split(' ').map((p:string)=>p[0]).slice(0,2).join('')}
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:'white',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.nume.split(' ').pop()}</span>
                  </div>
                  {days.map((d,di)=>{
                    const tip = getTura(tureMirror, m.id, d)
                    const c = TC[tip]??TC.L
                    const isToday = fmtDateInput(d)===fmtDateInput(azi)
                    return (
                      <div key={di} style={{padding:3}}>
                        <div style={{
                          borderRadius:8,height:36,display:'flex',alignItems:'center',justifyContent:'center',
                          background:isToday&&tip!=='L'?c.bg:'transparent',
                          border:isToday?`1.5px solid ${c.color}33`:'none',
                          fontSize:tip==='L'?9:12,fontWeight:700,
                          color:tip==='L'?'#3b3b4f':c.color,
                        }}>
                          {tip==='L'?'—':tip}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
              {Object.entries(TC).filter(([k])=>k!=='L').map(([k,v])=>(
                <div key={k} style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:10,height:10,borderRadius:3,background:v.bg,border:`1px solid ${v.color}33`}}/>
                  <span style={{fontSize:10,color:'#6b6b80'}}>{v.emoji} {v.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB: CALENDAR LUNAR ═══ */}
        {tab==='luna' && (
          <div>
            {/* Navigator luna */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,background:'#26262e',borderRadius:12,padding:'8px 12px',border:'1px solid rgba(255,255,255,0.07)'}}>
              <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:14,fontWeight:700,color:'white'}}>{LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
              <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Tabel angajati x zile */}
            <div style={{overflowX:'auto'}}>
              <div style={{minWidth:600,background:'#26262e',borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
                {/* Header zile */}
                <div style={{display:'grid',gridTemplateColumns:`80px repeat(${lunaEnd.getDate()},1fr)`,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{padding:'6px 8px',fontSize:9,color:'#4b4b60',fontWeight:700}}>ANGAJAT</div>
                  {Array.from({length:lunaEnd.getDate()},(_,i)=>{
                    const d = new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
                    const isWE = d.getDay()===0||d.getDay()===6
                    const isToday = fmtDateInput(d)===fmtDateInput(azi)
                    return (
                      <div key={i} style={{padding:'4px 2px',textAlign:'center'}}>
                        <div style={{fontSize:8,color:isToday?'#60a5fa':isWE?'#4b4b60':'#6b6b80',fontWeight:700}}>{ZILE_SCURT[d.getDay()]}</div>
                        <div style={{fontSize:9,fontWeight:700,color:isToday?'#60a5fa':isWE?'#4b4b60':'#8b8b9e'}}>{i+1}</div>
                      </div>
                    )
                  })}
                </div>
                {/* Randuri */}
                {echipa.map((m,mi)=>(
                  <div key={mi} style={{display:'grid',gridTemplateColumns:`80px repeat(${lunaEnd.getDate()},1fr)`,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:'white',display:'flex',alignItems:'center'}}>
                      {m.nume.split(' ').pop()}
                    </div>
                    {Array.from({length:lunaEnd.getDate()},(_,i)=>{
                      const d = new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
                      const tip = getTura(tureMirror, m.id, d)
                      const c = TC[tip]??TC.L
                      const isToday = fmtDateInput(d)===fmtDateInput(azi)
                      return (
                        <div key={i} style={{padding:'2px 1px'}}>
                          <div style={{
                            borderRadius:4,height:24,display:'flex',alignItems:'center',justifyContent:'center',
                            background:tip==='L'?'transparent':c.bg,
                            border:isToday?`1px solid ${c.color}`:'none',
                            fontSize:8,fontWeight:800,color:tip==='L'?'transparent':c.color,
                          }}>
                            {tip==='L'?'':tip}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: STATISTICI ═══ */}
        {tab==='stats' && (
          <div>
            <div style={{fontSize:12,color:'#8b8b9e',marginBottom:12,fontWeight:600}}>
              {LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()} — ore lucrate
            </div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:13,fontWeight:600,color:'white',flex:1,textAlign:'center',lineHeight:'28px'}}>{LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
              <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Cards angajati */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...echipa].sort((a,b)=>(oreAngajat[b.id]||0)-(oreAngajat[a.id]||0)).map((m,i)=>{
                const ore = oreAngajat[m.id]||0
                const maxOre = Math.max(...echipa.map(x=>oreAngajat[x.id]||0))
                const pct = maxOre>0?(ore/maxOre)*100:0
                const zileD = Array.from({length:lunaEnd.getDate()},(_,j)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),j+1))
                  .filter(d=>getTura(tureMirror,m.id,d)==='D').length
                const zileS = Array.from({length:lunaEnd.getDate()},(_,j)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),j+1))
                  .filter(d=>getTura(tureMirror,m.id,d)==='S').length
                const zileCO = Array.from({length:lunaEnd.getDate()},(_,j)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),j+1))
                  .filter(d=>getTura(tureMirror,m.id,d)==='CO').length

                return (
                  <div key={m.id} style={{background:'#26262e',borderRadius:14,padding:'12px 14px',border:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(42,109,217,0.2)',border:'1px solid rgba(42,109,217,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#60a5fa'}}>
                          {m.nume.split(' ').map((p:string)=>p[0]).slice(0,2).join('')}
                        </div>
                        <span style={{fontSize:14,fontWeight:700,color:'white'}}>{m.nume}</span>
                      </div>
                      <span style={{fontSize:18,fontWeight:900,color:'#60a5fa'}}>{ore}h</span>
                    </div>
                    {/* Bar */}
                    <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,marginBottom:8,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#2a6dd9,#60a5fa)',borderRadius:2,transition:'width 0.3s'}}/>
                    </div>
                    {/* Detalii */}
                    <div style={{display:'flex',gap:12}}>
                      <span style={{fontSize:11,color:'#93c5fd'}}>☀️ {zileD} D</span>
                      <span style={{fontSize:11,color:'#c4b5fd'}}>🌙 {zileS} S</span>
                      {zileCO>0&&<span style={{fontSize:11,color:'#fca5a5'}}>🏖️ {zileCO} CO</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total echipa */}
            <div style={{marginTop:12,background:'rgba(42,109,217,0.1)',border:'1px solid rgba(42,109,217,0.2)',borderRadius:14,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,color:'#8b8b9e',fontWeight:600}}>Total ore echipă</span>
              <span style={{fontSize:20,fontWeight:900,color:'#60a5fa'}}>{Object.values(oreAngajat).reduce((s,v)=>s+v,0)}h</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
