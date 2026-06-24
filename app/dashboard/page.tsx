'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { getTura, getMonday, fmtDateInput, TURA_INFO } from '@/lib/rotatie'

const ZILE = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du']
const LUNI_GEN = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec']

const ORA_TURA: Record<string,string> = {
  D:'07:00 — 15:00', S:'15:00 — 23:00', L:'', CO:'', CM:'', AN:''
}

const CARD_STYLE: Record<string,{bg:string;shadow:string;labelColor:string}> = {
  D:  {bg:'linear-gradient(145deg,#1e4fa8,#1a3d8a)',shadow:'0 8px 32px rgba(30,79,168,0.5)',labelColor:'rgba(255,255,255,0.7)'},
  S:  {bg:'linear-gradient(145deg,#4c1d8a,#3b1570)',shadow:'0 8px 32px rgba(76,29,138,0.5)',labelColor:'rgba(255,255,255,0.7)'},
  L:  {bg:'#26262e',shadow:'none',labelColor:'rgba(255,255,255,0.4)'},
  CO: {bg:'linear-gradient(145deg,#7f1d1d,#991b1b)',shadow:'0 8px 32px rgba(127,29,29,0.5)',labelColor:'rgba(255,255,255,0.7)'},
  CM: {bg:'linear-gradient(145deg,#7c2d12,#9a3412)',shadow:'0 8px 32px rgba(124,45,18,0.5)',labelColor:'rgba(255,255,255,0.7)'},
  AN: {bg:'linear-gradient(145deg,#450a0a,#7f1d1d)',shadow:'0 8px 32px rgba(69,10,10,0.5)',labelColor:'rgba(255,255,255,0.7)'},
}

const BADGE: Record<string,{bg:string;color:string}> = {
  D:  {bg:'rgba(30,79,168,0.6)',  color:'#93c5fd'},
  S:  {bg:'rgba(76,29,138,0.6)',  color:'#c4b5fd'},
  L:  {bg:'rgba(255,255,255,0.07)',color:'#6b6b80'},
  CO: {bg:'rgba(127,29,29,0.6)',  color:'#fca5a5'},
  CM: {bg:'rgba(124,45,18,0.6)',  color:'#fdba74'},
  AN: {bg:'rgba(69,10,10,0.6)',   color:'#f87171'},
}

function Spinner() {
  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:28,height:28,borderRadius:'50%',border:'2.5px solid rgba(96,165,250,0.2)',borderTopColor:'#60a5fa',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function Dashboard() {
  const { angajat, echipa, overrides, notificari, oreAcumulate, loading, eroare } = useAuth()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)

  if (loading) return <Spinner/>
  if (!angajat) return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:16,fontWeight:700,color:'white',textAlign:'center'}}>{eroare||'Nu s-au putut încărca datele'}</div>
      <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}}
        style={{background:'#26262e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'10px 20px',color:'white',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
        Deconectare
      </button>
    </div>
  )

  const prenume = angajat.nume.split(' ').slice(-1)[0]||angajat.nume

  const weekStart = (() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate()+weekOffset*7)
    return m
  })()

  const days = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d
  })

  const azi = new Date(); azi.setHours(0,0,0,0)
  const aziStr = fmtDateInput(azi)

  const turaAzi = getTura(azi, angajat, echipa, overrides, oreAcumulate)
  const infoAzi = TURA_INFO[turaAzi]??TURA_INFO.L
  const cardStyle = CARD_STYLE[turaAzi]??CARD_STYLE.L
  const dataLabel = azi.toLocaleDateString('ro-RO',{weekday:'long',day:'numeric',month:'long'})

  // Notificari necitite
  const necitite = notificari.filter(n => !(n.citita_de||[]).includes(angajat.id)).length

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:80,paddingTop:'env(safe-area-inset-top,0px)'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(145deg,#2a6dd9,#1a4fa0)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(42,109,217,0.4)'}}>
            <span style={{color:'white',fontSize:17,fontWeight:900}}>R</span>
          </div>
          <span style={{fontSize:17,fontWeight:700,color:'white',letterSpacing:-0.3}}>RotaFlow</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>router.push('/notificari')} style={{background:'none',border:'none',cursor:'pointer',position:'relative',padding:4}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0a0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {necitite > 0 && (
              <span style={{position:'absolute',top:2,right:2,width:8,height:8,background:'#ef4444',borderRadius:'50%',border:'1.5px solid #1a1a1f'}}/>
            )}
          </button>
          <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}}
            style={{background:'none',border:'none',cursor:'pointer',padding:4}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{padding:'8px 16px 0'}}>

        {/* Salut */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:13,color:'#8b8b9e',fontWeight:500}}>Bună, {prenume}</div>
          <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5}}>Tura ta de azi</div>
        </div>

        {/* Card tura */}
        <div style={{borderRadius:18,padding:'20px 20px 18px',background:cardStyle.bg,boxShadow:cardStyle.shadow,marginBottom:20,position:'relative',overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'rgba(255,255,255,0.15)',borderRadius:'18px 18px 0 0'}}/>
          <div style={{fontSize:12,color:cardStyle.labelColor,fontWeight:500,marginBottom:4,textTransform:'capitalize'}}>{dataLabel}</div>
          <div style={{fontSize:34,fontWeight:800,color:'white',letterSpacing:-0.5,lineHeight:1.1,marginBottom:6}}>{infoAzi.label}</div>
          {ORA_TURA[turaAzi]&&<div style={{fontSize:13,color:'rgba(255,255,255,0.6)',fontWeight:500}}>{ORA_TURA[turaAzi]}</div>}
          <div style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',fontSize:40,opacity:0.35}}>
            {turaAzi==='D'?'☀':turaAzi==='S'?'🌙':turaAzi==='CO'?'🏖':turaAzi==='CM'?'🏥':turaAzi==='AN'?'⛔':''}
          </div>
        </div>

        {/* Saptamana */}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:600,color:'#8b8b9e'}}>Săptămâna asta</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:26,height:26,borderRadius:7,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:11,color:'#6b6b80',minWidth:90,textAlign:'center'}}>
                {days[0].getDate()} — {days[6].getDate()} {LUNI_GEN[days[6].getMonth()]}
              </span>
              <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:26,height:26,borderRadius:7,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {days.map((d,i)=>{
              const tip=getTura(d,angajat,echipa,overrides)
              const badge=BADGE[tip]??BADGE.L
              const isToday=fmtDateInput(d)===aziStr
              const isWE=d.getDay()===0||d.getDay()===6
              return (
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:isWE?0.5:1}}>
                  <span style={{fontSize:10,fontWeight:600,color:isToday?'#60a5fa':'#6b6b80'}}>{ZILE[i]}</span>
                  <div style={{width:'100%',aspectRatio:'1',borderRadius:10,background:badge.bg,border:isToday?'1.5px solid #60a5fa':'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isToday?'0 0 0 3px rgba(96,165,250,0.15)':'none'}}>
                    <span style={{fontSize:11,fontWeight:700,color:badge.color}}>{tip==='L'?'':tip}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Buton Swap */}
        <Link href="/swap" style={{textDecoration:'none'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'15px 20px',borderRadius:14,background:'#26262e',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            <span style={{fontSize:15,fontWeight:600,color:'white'}}>Cere schimb de tură</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="2.5" strokeLinecap="round"><polyline points="7 17 17 7"/><polyline points="7 7 17 7 17 17"/></svg>
          </div>
        </Link>

      </div>
      <BottomNav badge={necitite}/>
    </div>
  )
}
