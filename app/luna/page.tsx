'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getTura, fmtDateInput, TURA_INFO } from '@/lib/rotatie'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZH = ['L','M','M','J','V','S','D']

const BADGE: Record<string, {bg:string;color:string}> = {
  D:  {bg:'rgba(30,79,168,0.6)',  color:'#93c5fd'},
  S:  {bg:'rgba(76,29,138,0.6)',  color:'#c4b5fd'},
  L:  {bg:'rgba(255,255,255,0.05)',color:'#6b6b80'},
  CO: {bg:'rgba(127,29,29,0.6)',  color:'#fca5a5'},
  CM: {bg:'rgba(124,45,18,0.6)',  color:'#fdba74'},
  AN: {bg:'rgba(69,10,10,0.6)',   color:'#f87171'},
}

export default function LunaPage() {
  const { angajat, echipa, loading } = useAuth()
  const [lunaOffset, setLunaOffset] = useState(0)

  const lunaStart = new Date(new Date().getFullYear(), new Date().getMonth() + lunaOffset, 1)
  const lunaEnd = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)

  if (loading) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>
  if (!angajat) return null

  const firstDow = (lunaStart.getDay()+6)%7
  const cells: (Date|null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1))
  ]
  while(cells.length%7!==0) cells.push(null)

  let nD=0,nS=0,nCO=0
  for(let i=1;i<=lunaEnd.getDate();i++){
    const d=new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i)
    const t=getTura(d,angajat,echipa)
    if(t==='D')nD++; else if(t==='S')nS++; else if(t==='CO')nCO++
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:80,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5}}>Calendar</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{fontSize:13,fontWeight:600,color:'white',minWidth:110,textAlign:'center'}}>
              {LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}
            </span>
            <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
          {[['☀',nD,'Dimineață','rgba(30,79,168,0.4)','#93c5fd'],['🌙',nS,'Seară','rgba(76,29,138,0.4)','#c4b5fd'],['🏖',nCO,'Concediu','rgba(127,29,29,0.4)','#fca5a5']].map(([ic,n,l,bg,c])=>(
            <div key={String(l)} style={{background:String(bg),borderRadius:14,padding:'12px 8px',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:22,fontWeight:800,color:String(c)}}>{n}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{background:'#26262e',borderRadius:18,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            {ZH.map((z,i)=>(
              <div key={i} style={{textAlign:'center',padding:'10px 0',fontSize:11,fontWeight:700,color:i>=5?'#4b4b60':'#6b6b80'}}>{z}</div>
            ))}
          </div>
          {Array.from({length:cells.length/7},(_,wi)=>(
            <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
              {cells.slice(wi*7,(wi+1)*7).map((d,di)=>{
                if(!d) return <div key={di} style={{padding:4}}/>
                const tip=getTura(d,angajat,echipa)
                const b=BADGE[tip]??BADGE.L
                const isToday=fmtDateInput(d)===fmtDateInput(azi)
                return(
                  <div key={di} style={{padding:3}}>
                    <div style={{
                      borderRadius:10,padding:'6px 2px',
                      background:b.bg,
                      border:isToday?'1.5px solid #60a5fa':'1px solid rgba(255,255,255,0.04)',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:1,
                      boxShadow:isToday?'0 0 0 3px rgba(96,165,250,0.15)':'none',
                    }}>
                      <span style={{fontSize:10,fontWeight:700,color:isToday?'#60a5fa':'rgba(255,255,255,0.5)'}}>{d.getDate()}</span>
                      <span style={{fontSize:9,fontWeight:700,color:b.color}}>{tip==='L'?'':tip}</span>
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
