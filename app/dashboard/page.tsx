'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, TuraMirror } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { getMonday, fmtDateInput, TURA_INFO, Angajat } from '@/lib/rotatie'

const ZILE = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du']
const ZILE_LUNG = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă']
const LUNI_GEN = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec']
const LUNI_FULL = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']

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
  D:  {bg:'rgba(37,99,235,0.55)',  color:'#93c5fd'},
  S:  {bg:'rgba(109,40,217,0.55)', color:'#c4b5fd'},
  L:  {bg:'rgba(255,255,255,0.07)',color:'#6b6b80'},
  CO: {bg:'rgba(127,29,29,0.6)',   color:'#fca5a5'},
  CM: {bg:'rgba(124,45,18,0.6)',   color:'#fdba74'},
  AN: {bg:'rgba(69,10,10,0.6)',    color:'#f87171'},
}

const TURA_LABEL: Record<string,string> = {
  D:'Dimineață ☀️', S:'Seară 🌙', L:'Liber', CO:'Concediu 🏖️', CM:'Medical 🏥', AN:'Absent ⛔'
}

function getTuraMirror(tureMirror: TuraMirror[], angajatId: number, d: Date): string {
  const dStr = fmtDateInput(d)
  return tureMirror.find(t => t.angajat_id === angajatId && t.data === dStr)?.tura ?? 'L'
}

// Mini calendar days grid
function MiniCalendar({ angajat, tureMirror, theme, onDayTap }: {
  angajat: Angajat; tureMirror: TuraMirror[]
  theme: 'dark'|'light'; onDayTap: (d: Date) => void
}) {
  const [lunaOffset, setLunaOffset] = useState(0)
  const now = new Date()
  const lunaStart = new Date(now.getFullYear(), now.getMonth()+lunaOffset, 1)
  const lunaEnd = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)
  const firstDow = (lunaStart.getDay()+6)%7
  const cells: (Date|null)[] = [...Array(firstDow).fill(null),
    ...Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1))]
  while(cells.length%7!==0) cells.push(null)

  const isDark = theme==='dark'
  const cardBg = isDark?'#26262e':'#f1f5f9'
  const textMuted = isDark?'#6b6b80':'#94a3b8'
  const textMain = isDark?'white':'#1e293b'

  return (
    <div style={{borderRadius:18,overflow:'hidden',border:`1px solid ${isDark?'rgba(255,255,255,0.07)':'#e2e8f0'}`,background:cardBg}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e2e8f0'}`}}>
        <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,background:isDark?'rgba(255,255,255,0.06)':'#e2e8f0',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{fontSize:13,fontWeight:700,color:textMain}}>{LUNI_FULL[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
        <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,background:isDark?'rgba(255,255,255,0.06)':'#e2e8f0',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      {/* Zile header */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
        {['L','M','M','J','V','S','D'].map((z,i)=>(
          <div key={i} style={{textAlign:'center',padding:'6px 0',fontSize:10,fontWeight:700,color:i>=5?'#ef4444':textMuted}}>{z}</div>
        ))}
      </div>
      {/* Zile */}
      {Array.from({length:cells.length/7},(_,wi)=>(
        <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
          {cells.slice(wi*7,(wi+1)*7).map((d,di)=>{
            if(!d) return <div key={di} style={{padding:2}}/>
            const tip = getTuraMirror(tureMirror, angajat.id, d)
            const b = BADGE[tip]??BADGE.L
            const isToday = fmtDateInput(d)===fmtDateInput(azi)
            const isWE = d.getDay()===0||d.getDay()===6
            return (
              <div key={di} style={{padding:2}}>
                <button onClick={()=>onDayTap(d)} style={{
                  width:'100%',aspectRatio:'1',borderRadius:8,
                  background:isToday?'#2a6dd9':tip==='L'?'transparent':b.bg,
                  border:isToday?'none':`1px solid ${tip==='L'?(isDark?'rgba(255,255,255,0.04)':'#e2e8f0'):b.bg}`,
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  cursor:'pointer',gap:1,
                }}>
                  <span style={{fontSize:11,fontWeight:800,lineHeight:1,color:isToday?'white':isWE?'#ef4444':tip==='L'?textMuted:b.color}}>
                    {d.getDate()}
                  </span>
                  {tip!=='L'&&<span style={{fontSize:7,fontWeight:700,color:isToday?'rgba(255,255,255,0.8)':b.color}}>{tip}</span>}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Popup echipa azi
function PopupEchipaZi({ d, tureMirror, echipa, angajat, theme, onClose }: {
  d: Date; tureMirror: TuraMirror[]; echipa: Angajat[]; angajat: Angajat
  theme: 'dark'|'light'; onClose: () => void
}) {
  const isDark = theme==='dark'
  const dimineata = echipa.filter(m=>getTuraMirror(tureMirror,m.id,d)==='D')
  const seara = echipa.filter(m=>getTuraMirror(tureMirror,m.id,d)==='S')
  const liberi = echipa.filter(m=>['L','CO','CM','AN'].includes(getTuraMirror(tureMirror,m.id,d)))

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}/>
      <div onClick={e=>e.stopPropagation()} style={{
        position:'relative',width:'100%',maxWidth:430,
        background:isDark?'#1e1e26':'white',
        borderRadius:'24px 24px 0 0',padding:'20px 20px 40px',
        border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'#e2e8f0'}`,
      }}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:isDark?'rgba(255,255,255,0.15)':'#e2e8f0',margin:'0 auto 16px'}}/>
        
        <div style={{fontSize:16,fontWeight:800,color:isDark?'white':'#1e293b',marginBottom:4}}>
          {ZILE_LUNG[d.getDay()]}, {d.getDate()} {LUNI_FULL[d.getMonth()]}
        </div>
        <div style={{fontSize:12,color:isDark?'#6b6b80':'#94a3b8',marginBottom:20}}>Cine lucrează în această zi</div>

        {[{label:'☀️ Dimineață',list:dimineata,bg:'rgba(37,99,235,0.12)',border:'rgba(59,130,246,0.25)',color:'#93c5fd'},
          {label:'🌙 Seară',list:seara,bg:'rgba(109,40,217,0.12)',border:'rgba(139,92,246,0.25)',color:'#c4b5fd'},
          {label:'○ Liberi / Absenți',list:liberi,bg:isDark?'rgba(255,255,255,0.03)':'#f8fafc',border:isDark?'rgba(255,255,255,0.06)':'#e2e8f0',color:isDark?'#6b6b80':'#94a3b8'},
        ].map(({label,list,bg,border,color})=>list.length>0&&(
          <div key={label} style={{background:bg,border:`1px solid ${border}`,borderRadius:14,padding:'12px 14px',marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {list.map(m=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:color+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color,flexShrink:0}}>
                    {m.nume.substring(0,2).toUpperCase()}
                  </div>
                  <span style={{fontSize:13,fontWeight:m.id===angajat.id?700:500,color:isDark?'white':'#1e293b'}}>
                    {m.nume}{m.id===angajat.id?' (tu)':''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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
  const { angajat, echipa, tureMirror, notificari, loading, eroare } = useAuth()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [confirmat, setConfermat] = useState(false)
  const [popupZi, setPopupZi] = useState<Date|null>(null)

  // Citim tema din localStorage
  useEffect(()=>{
    const saved = localStorage.getItem('rf_theme') as 'dark'|'light'|null
    if(saved) setTheme(saved)
    const conf = localStorage.getItem('rf_confirmat_sapt')
    if(conf === getCurrentWeekKey()) setConfermat(true)
  },[])

  const getCurrentWeekKey = () => {
    const m = getMonday(new Date())
    return fmtDateInput(m)
  }

  const toggleTheme = () => {
    const nou = theme==='dark'?'light':'dark'
    setTheme(nou)
    localStorage.setItem('rf_theme', nou)
  }

  const confirmaTura = () => {
    setConfermat(true)
    localStorage.setItem('rf_confirmat_sapt', getCurrentWeekKey())
  }

  const isDark = theme==='dark'
  const bg = isDark?'#1a1a1f':'#f8fafc'
  const cardBg = isDark?'#26262e':'white'
  const textMain = isDark?'white':'#1e293b'
  const textMuted = isDark?'#8b8b9e':'#64748b'
  const textFaint = isDark?'#6b6b80':'#94a3b8'
  const border = isDark?'rgba(255,255,255,0.08)':'#e2e8f0'

  if (loading) return <Spinner/>
  if (!angajat) return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:16,fontWeight:700,color:textMain,textAlign:'center'}}>{eroare||'Nu s-au putut încărca datele'}</div>
      <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}}
        style={{background:cardBg,border:`1px solid ${border}`,borderRadius:12,padding:'10px 20px',color:textMain,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
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
  const maine = new Date(azi.getTime()+86400000)

  const turaAzi = getTuraMirror(tureMirror, angajat.id, azi)
  const turaMaine = getTuraMirror(tureMirror, angajat.id, maine)
  const infoAzi = TURA_INFO[turaAzi]??TURA_INFO.L
  const infoMaine = TURA_INFO[turaMaine]??TURA_INFO.L
  const cardStyle = CARD_STYLE[turaAzi]??CARD_STYLE.L
  const dataLabel = azi.toLocaleDateString('ro-RO',{weekday:'long',day:'numeric',month:'long'})
  const necitite = notificari.filter(n => !(n.citita_de||[]).includes(angajat.id)).length
  const hasMirror = tureMirror.length > 0

  return (
    <div style={{minHeight:'100vh',background:bg,paddingBottom:80,paddingTop:'env(safe-area-inset-top,0px)',transition:'background 0.3s'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(145deg,#2a6dd9,#1a4fa0)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(42,109,217,0.4)'}}>
            <span style={{color:'white',fontSize:17,fontWeight:900}}>R</span>
          </div>
          <span style={{fontSize:17,fontWeight:700,color:textMain,letterSpacing:-0.3}}>RotaFlow</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {/* Toggle dark/light */}
          <button onClick={toggleTheme} style={{background:'none',border:'none',cursor:'pointer',padding:4,fontSize:18}}>
            {isDark?'☀️':'🌙'}
          </button>
          <button onClick={()=>router.push('/notificari')} style={{background:'none',border:'none',cursor:'pointer',position:'relative',padding:4}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {necitite > 0 && <span style={{position:'absolute',top:2,right:2,width:8,height:8,background:'#ef4444',borderRadius:'50%',border:'1.5px solid '+bg}}/>}
          </button>
          <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}} style={{background:'none',border:'none',cursor:'pointer',padding:4}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{padding:'8px 16px 0'}}>

        {!hasMirror && (
          <div style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{fontSize:12,color:'#fbbf24',fontWeight:500}}>Apasă "Sincronizează DB" din aplicația desktop.</span>
          </div>
        )}

        {/* Salut */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:13,color:textMuted,fontWeight:500}}>Bună, {prenume}</div>
          <div style={{fontSize:22,fontWeight:800,color:textMain,letterSpacing:-0.5}}>Tura ta de azi</div>
        </div>

        {/* Card tura azi */}
        <div style={{borderRadius:18,padding:'18px 20px 14px',background:cardStyle.bg,boxShadow:cardStyle.shadow,marginBottom:12,position:'relative',overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'rgba(255,255,255,0.15)',borderRadius:'18px 18px 0 0'}}/>
          <div style={{fontSize:11,color:cardStyle.labelColor,fontWeight:500,marginBottom:3,textTransform:'capitalize'}}>{dataLabel}</div>
          <div style={{fontSize:32,fontWeight:800,color:'white',letterSpacing:-0.5,lineHeight:1.1,marginBottom:4}}>{infoAzi.label}</div>
          {ORA_TURA[turaAzi]&&<div style={{fontSize:12,color:'rgba(255,255,255,0.6)',fontWeight:500,marginBottom:10}}>{ORA_TURA[turaAzi]}</div>}
          
          {/* Maine preview */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.12)',paddingTop:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Mâine</span>
            <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>
              {infoMaine.emoji} {infoMaine.label} {ORA_TURA[turaMaine]?`· ${ORA_TURA[turaMaine]}`:''}
            </span>
          </div>

          <div style={{position:'absolute',right:20,top:18,fontSize:36,opacity:0.25}}>
            {turaAzi==='D'?'☀':turaAzi==='S'?'🌙':turaAzi==='CO'?'🏖':turaAzi==='CM'?'🏥':turaAzi==='AN'?'⛔':''}
          </div>
        </div>

        {/* Buton confirmare tura */}
        {weekOffset===0&&(
          <button onClick={confirmaTura} disabled={confirmat} style={{
            width:'100%',padding:'12px 0',borderRadius:14,border:'none',cursor:confirmat?'default':'pointer',
            fontSize:14,fontWeight:700,color:confirmat?'#4ade80':'white',fontFamily:'inherit',marginBottom:12,
            background:confirmat?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.06)',
            outline:confirmat?'1px solid rgba(74,222,128,0.3)':`1px solid ${border}`,
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          }}>
            {confirmat
              ? <><span>✓</span> Program confirmat pentru săptămâna asta</>
              : <><span>👁</span> Confirmă că ai văzut programul</>
            }
          </button>
        )}

        {/* Saptamana */}
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:600,color:textMuted}}>Săptămâna</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:26,height:26,borderRadius:7,background:cardBg,border:`1px solid ${border}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:11,color:textFaint,minWidth:90,textAlign:'center'}}>
                {days[0].getDate()} — {days[6].getDate()} {LUNI_GEN[days[6].getMonth()]}
              </span>
              <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:26,height:26,borderRadius:7,background:cardBg,border:`1px solid ${border}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
            {days.map((d,i)=>{
              const tip = getTuraMirror(tureMirror, angajat.id, d)
              const badge = BADGE[tip]??BADGE.L
              const isToday = fmtDateInput(d)===aziStr
              const isWE = d.getDay()===0||d.getDay()===6
              return (
                <button key={i} onClick={()=>setPopupZi(d)} style={{
                  display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                  opacity:isWE?0.5:1, background:'none',border:'none',cursor:'pointer',padding:0,
                }}>
                  <span style={{fontSize:10,fontWeight:600,color:isToday?'#60a5fa':textFaint}}>{ZILE[i]}</span>
                  <div style={{width:'100%',aspectRatio:'1',borderRadius:10,background:badge.bg,
                    border:isToday?'1.5px solid #60a5fa':`1px solid ${isDark?'rgba(255,255,255,0.06)':'#e2e8f0'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    boxShadow:isToday?'0 0 0 3px rgba(96,165,250,0.15)':'none'}}>
                    <span style={{fontSize:11,fontWeight:700,color:badge.color}}>{tip==='L'?'':tip}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mini calendar */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:textMuted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
            Calendar
          </div>
          <MiniCalendar angajat={angajat} tureMirror={tureMirror} theme={theme} onDayTap={setPopupZi}/>
        </div>

        {/* Buton Swap */}
        <Link href="/swap" style={{textDecoration:'none'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'14px 20px',borderRadius:14,background:cardBg,border:`1px solid ${border}`,cursor:'pointer'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            <span style={{fontSize:15,fontWeight:600,color:textMain}}>Cere schimb de tură</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textFaint} strokeWidth="2.5" strokeLinecap="round"><polyline points="7 17 17 7"/><polyline points="7 7 17 7 17 17"/></svg>
          </div>
        </Link>

      </div>

      {/* Popup echipa zi */}
      {popupZi && (
        <PopupEchipaZi
          d={popupZi}
          tureMirror={tureMirror}
          echipa={echipa}
          angajat={angajat}
          theme={theme}
          onClose={()=>setPopupZi(null)}
        />
      )}

      <BottomNav badge={necitite}/>
    </div>
  )
}
