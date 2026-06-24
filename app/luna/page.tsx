'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getTura, fmtDateInput } from '@/lib/rotatie'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZILE_LUNG = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă']
const ZILE_SCURT = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']

const TC: Record<string,{label:string;emoji:string;bg:string;color:string;border:string;pillBg:string;pillColor:string}> = {
  D:  {label:'Dimineață',emoji:'☀️',bg:'rgba(37,99,235,0.35)',  color:'#93c5fd',border:'rgba(59,130,246,0.6)', pillBg:'rgba(37,99,235,0.7)', pillColor:'#ffffff'},
  S:  {label:'Seară',    emoji:'🌙',bg:'rgba(109,40,217,0.35)', color:'#c4b5fd',border:'rgba(139,92,246,0.6)',pillBg:'rgba(109,40,217,0.7)',pillColor:'#ffffff'},
  L:  {label:'Liber',    emoji:'', bg:'transparent',             color:'#4b4b60',border:'rgba(255,255,255,0.06)',pillBg:'rgba(255,255,255,0.08)',pillColor:'#6b6b80'},
  CO: {label:'Concediu', emoji:'🏖️',bg:'rgba(185,28,28,0.35)',  color:'#fca5a5',border:'rgba(239,68,68,0.5)', pillBg:'rgba(185,28,28,0.7)', pillColor:'#ffffff'},
  CM: {label:'Medical',  emoji:'🏥',bg:'rgba(194,65,12,0.35)',  color:'#fdba74',border:'rgba(249,115,22,0.5)',pillBg:'rgba(194,65,12,0.7)', pillColor:'#ffffff'},
  AN: {label:'Absent',   emoji:'⛔',bg:'rgba(153,27,27,0.35)',  color:'#f87171',border:'rgba(220,38,38,0.5)', pillBg:'rgba(153,27,27,0.7)', pillColor:'#ffffff'},
}

const Spinner = () => (
  <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{width:28,height:28,borderRadius:'50%',border:'2.5px solid rgba(96,165,250,0.2)',borderTopColor:'#60a5fa',animation:'spin 0.7s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

export default function LunaPage() {
  const { angajat, echipa, overrides, oreAcumulate, loading } = useAuth()
  const [lunaOffset, setLunaOffset] = useState(0)
  const [view, setView] = useState<'lista'|'grid'>('lista')

  if (loading || !angajat) return <Spinner/>

  const now = new Date()
  const lunaStart = new Date(now.getFullYear(), now.getMonth()+lunaOffset, 1)
  const lunaEnd   = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)

  const zile: Date[] = Array.from({length:lunaEnd.getDate()},(_,i)=>
    new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
  )

  const stats: Record<string,number> = {}
  zile.forEach(d => { const t=getTura(d,angajat,echipa,overrides,oreAcumulate); stats[t]=(stats[t]||0)+1 })

  const firstDow = (lunaStart.getDay()+6)%7
  const cells: (Date|null)[] = [...Array(firstDow).fill(null),...zile]
  while(cells.length%7!==0) cells.push(null)

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:88,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5}}>Program lunar</div>
          <div style={{display:'flex',background:'#26262e',borderRadius:10,padding:3,border:'1px solid rgba(255,255,255,0.08)'}}>
            {(['lista','grid'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',
                fontSize:11,fontWeight:600,fontFamily:'inherit',
                background:view===v?'#3a3a4a':'transparent',
                color:view===v?'white':'#6b6b80',
              }}>
                {v==='lista'?'≡ Listă':'⊞ Grilă'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigator luna */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,background:'#26262e',borderRadius:14,padding:'10px 14px',border:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:700,color:'white'}}>{LUNI[lunaStart.getMonth()]}</div>
            <div style={{fontSize:11,color:'#6b6b80',marginTop:1}}>{lunaStart.getFullYear()}</div>
          </div>
          <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Stats pills */}
        <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:2}}>
          {(['D','S','CO','L'] as const).filter(t=>(stats[t]||0)>0).map(t=>{
            const c=TC[t]
            return (
              <div key={t} style={{display:'flex',alignItems:'center',gap:6,background:c.pillBg,borderRadius:20,padding:'6px 12px',border:`1px solid ${c.border}`,flexShrink:0}}>
                {c.emoji&&<span style={{fontSize:13}}>{c.emoji}</span>}
                <span style={{fontSize:13,fontWeight:700,color:c.pillColor}}>{stats[t]}</span>
                <span style={{fontSize:11,color:c.color}}>{c.label}</span>
              </div>
            )
          })}
        </div>

        {/* LISTA */}
        {view==='lista' && (
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {zile.map((d,i)=>{
              const tip=getTura(d,angajat,echipa,overrides,oreAcumulate)
              const c=TC[tip]??TC.L
              const isToday=fmtDateInput(d)===fmtDateInput(azi)
              const isWE=d.getDay()===0||d.getDay()===6
              const isPast=d<azi
              return (
                <div key={i} style={{
                  display:'flex',alignItems:'center',
                  background:isToday?'rgba(96,165,250,0.15)':c.bg,
                  borderRadius:13,
                  border:isToday?'2px solid rgba(96,165,250,0.7)':`1px solid ${c.border}`,
                  padding:'10px 14px',
                  opacity:isPast&&!isToday?0.45:1,
                  boxShadow:tip==='D'&&!isPast?'0 2px 12px rgba(37,99,235,0.25)':tip==='S'&&!isPast?'0 2px 12px rgba(109,40,217,0.25)':'none',
                }}>
                  <div style={{width:44,flexShrink:0}}>
                    <div style={{fontSize:22,fontWeight:900,lineHeight:1,color:isToday?'#60a5fa':isWE?'#a0a0b8':'white'}}>
                      {d.getDate()}
                    </div>
                    <div style={{fontSize:10,fontWeight:700,marginTop:2,textTransform:'uppercase',letterSpacing:'0.05em',color:isToday?'#93c5fd':isWE?'#6b6b80':'#8b8b9e'}}>
                      {ZILE_SCURT[d.getDay()]}
                    </div>
                  </div>
                  <div style={{width:1,height:32,background:'rgba(255,255,255,0.08)',margin:'0 12px',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:isToday?'white':isWE?'#8b8b9e':'rgba(255,255,255,0.9)'}}>
                      {ZILE_LUNG[d.getDay()]}
                    </div>
                    {tip!=='L'&&<div style={{fontSize:11,color:c.color,marginTop:2,fontWeight:500}}>{c.emoji} {c.label}</div>}
                  </div>
                  {tip!=='L'&&(
                    <div style={{background:c.pillBg,borderRadius:8,padding:'5px 11px',border:`1px solid ${c.border}`,fontSize:13,fontWeight:800,color:c.pillColor,flexShrink:0,letterSpacing:'0.02em'}}>
                      {tip}
                    </div>
                  )}
                  {isToday&&<div style={{width:6,height:6,borderRadius:'50%',background:'#60a5fa',marginLeft:8,flexShrink:0}}/>}
                </div>
              )
            })}
          </div>
        )}

        {/* GRID */}
        {view==='grid' && (
          <div style={{background:'#26262e',borderRadius:18,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
              {['Lu','Ma','Mi','Jo','Vi','Sâ','Du'].map((z,i)=>(
                <div key={i} style={{textAlign:'center',padding:'10px 0',fontSize:11,fontWeight:700,color:i>=5?'#4b4b60':'#8b8b9e'}}>{z}</div>
              ))}
            </div>
            {Array.from({length:cells.length/7},(_,wi)=>(
              <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                {cells.slice(wi*7,(wi+1)*7).map((d,di)=>{
                  if(!d) return <div key={di}/>
                  const tip=getTura(d,angajat,echipa,overrides,oreAcumulate)
                  const c=TC[tip]??TC.L
                  const isToday=fmtDateInput(d)===fmtDateInput(azi)
                  const isWE=d.getDay()===0||d.getDay()===6
                  return (
                    <div key={di} style={{padding:3}}>
                      <div style={{borderRadius:10,padding:'7px 2px',background:isToday?'rgba(96,165,250,0.2)':c.bg,border:isToday?'2px solid #60a5fa':`1px solid ${c.border}`,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                        <span style={{fontSize:14,fontWeight:800,lineHeight:1,color:isToday?'#60a5fa':isWE?'#6b6b80':'white'}}>{d.getDate()}</span>
                        <span style={{fontSize:9,fontWeight:800,color:tip==='L'?'transparent':c.pillColor}}>{tip==='L'?'·':tip}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav/>
    </div>
  )
}
