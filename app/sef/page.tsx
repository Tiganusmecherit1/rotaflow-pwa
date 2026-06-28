'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fmtDateInput, getMonday } from '@/lib/rotatie'
import { TuraMirror } from '@/components/AuthProvider'

const LUNI = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const LUNI_S = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const ZILE_S = ['L','M','M','J','V','S','D']
const ZILE_L = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']

const TC: Record<string,{bg:string;color:string;label:string;emoji:string}> = {
  D:  {bg:'rgba(37,99,235,0.25)', color:'#93c5fd', label:'Dimineață', emoji:'☀️'},
  S:  {bg:'rgba(109,40,217,0.25)',color:'#c4b5fd', label:'Seară',     emoji:'🌙'},
  L:  {bg:'rgba(255,255,255,0.04)',color:'#4b4b60',label:'Liber',     emoji:''},
  CO: {bg:'rgba(127,29,29,0.25)', color:'#fca5a5', label:'Concediu', emoji:'🏖️'},
  CM: {bg:'rgba(124,45,18,0.25)', color:'#fdba74', label:'Medical',  emoji:'🏥'},
  AN: {bg:'rgba(69,10,10,0.25)',  color:'#f87171', label:'Absent',   emoji:'⛔'},
}

interface Angajat { id: number; uuid: string; nume: string }
interface SwapCerere { id: string; a_id: number; a_data: string; b_id: number; b_data: string; nota?: string; status: string; creat_la: string }
interface IstoricItem { id: string; mesaj: string; creat_la: string }

function getTura(tm: TuraMirror[], id: number, d: Date): string {
  return tm.find(t => t.angajat_id===id && t.data===fmtDateInput(d))?.tura ?? 'L'
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
  const [prenume, setPrenume] = useState('Șef')
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [tureMirror, setTureMirror] = useState<TuraMirror[]>([])
  const [swapuri, setSwapuri] = useState<SwapCerere[]>([])
  const [istoric, setIstoric] = useState<IstoricItem[]>([])
  const [tab, setTab] = useState<'azi'|'luna'|'stats'|'swap'|'alerte'>('azi')
  const [lunaOffset, setLunaOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [concedii, setConcedii] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: sef } = await supabase.from('angajati').select('*').eq('id', session.user.id).single()
      if (!sef?.este_sef) { router.replace('/dashboard'); return }

      // Prenume — primul cuvant din nume
      const numeComplet = sef.nume || ''
      setPrenume(numeComplet.split(' ')[0] || 'Șef')

      // Echipa + suplinitor
      const { data: ec } = await supabase.from('angajati').select('id,nume,pozitie_rotatie').eq('este_sef', false).order('pozitie_rotatie')
      const echipaMap: Angajat[] = (ec||[]).map((a:any)=>({id:a.pozitie_rotatie, uuid:a.id, nume:a.nume}))
      // Adaugam suplinitor daca apare in ture_mirror
      setEchipa(echipaMap)

      // Ture mirror
      const azi = new Date(); azi.setDate(azi.getDate()-7)
      const { data: tm } = await supabase.from('ture_mirror').select('angajat_id,data,tura').gte('data', azi.toISOString().split('T')[0])
      const tmData = tm || []
      setTureMirror(tmData)

      // Verificam daca suplinitorul (id=999) apare in mirror
      const areSup = tmData.some((t:any) => t.angajat_id === 999)
      if (areSup && !echipaMap.find(m=>m.id===999)) {
        setEchipa([...echipaMap, {id:999, uuid:'sup', nume:'Suplinitor (Cta)'}])
      }

      // Concedii pentru countdown criza
      const { data: conc } = await supabase.from('concedii').select('angajat_id,data_start,data_sfarsit')
      setConcedii(conc||[])

      // Swapuri
      const { data: sw } = await supabase.from('swapuri').select('*').order('creat_la', {ascending:false}).limit(20)
      setSwapuri(sw||[])

      // Istoric
      const { data: ist } = await supabase.from('istoric').select('*').order('creat_la', {ascending:false}).limit(30)
      setIstoric(ist||[])

      setLoading(false)
    }
    load()
  }, [router])

  const approveSwap = useCallback(async (id: string, approve: boolean) => {
    await supabase.from('swapuri').update({status: approve?'aprobat':'refuzat'}).eq('id', id)
    setSwapuri(prev => prev.map(s => s.id===id ? {...s, status: approve?'aprobat':'refuzat'} : s))
  }, [])

  if (loading) return <Spinner/>

  const azi = new Date(); azi.setHours(0,0,0,0)
  const weekStart = (() => { const m=getMonday(new Date()); m.setDate(m.getDate()+weekOffset*7); return m })()
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d })

  const lunaStart = new Date(azi.getFullYear(), azi.getMonth()+lunaOffset, 1)
  const lunaEnd   = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)

  // Ore luna per angajat
  const oreAngajat: Record<number,number> = {}
  echipa.forEach(m => { oreAngajat[m.id]=0 })
  for (let i=1;i<=lunaEnd.getDate();i++) {
    const d=new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i)
    echipa.forEach(m => { if(['D','S'].includes(getTura(tureMirror,m.id,d))) oreAngajat[m.id]+=8 })
  }

  // Countdown criza — urmatoarea perioada cu < 4 activi
  const detecteazaCriza = () => {
    const echipaNormala = echipa.filter(m=>m.id!==999)
    for (let i=0; i<180; i++) {
      const d = new Date(azi.getTime()+(i+1)*86400000)
      const dStr = fmtDateInput(d)
      const inCO = concedii.filter((c:any) => c.data_start<=dStr && c.data_sfarsit>=dStr)
      const activi = echipaNormala.length - inCO.length
      if (activi < 4) {
        // Gasim intervalul complet
        let end = new Date(d)
        for (let j=i+1; j<180; j++) {
          const d2 = new Date(azi.getTime()+(j+1)*86400000)
          const d2Str = fmtDateInput(d2)
          const inCO2 = concedii.filter((c:any)=>c.data_start<=d2Str&&c.data_sfarsit>=d2Str)
          if (echipaNormala.length - inCO2.length >= 4) break
          end = new Date(d2)
        }
        return { zile: i+1, data: d, dataEnd: end, activi }
      }
    }
    return null
  }
  const criza = detecteazaCriza()

  // Alerte automate
  const alerte: {tip:string;mesaj:string;culoare:string}[] = []
  // Verificam saptamana curenta
  echipa.filter(m=>m.id!==999).forEach(m => {
    let consec=0; let maxConsec=0
    let oreSapt=0
    let prevT=''
    for (let i=-1;i<8;i++) {
      const d=new Date(weekStart.getTime()+(i-1)*86400000)
      const t=getTura(tureMirror,m.id,d)
      if(i>=0 && prevT==='S' && t==='D') alerte.push({tip:'err',mesaj:`S→D interzis: ${m.nume} — ${fmtDateInput(d)}`,culoare:'#f87171'})
      if(t==='D'||t==='S'){consec++;oreSapt+=8}else consec=0
      maxConsec=Math.max(maxConsec,consec)
      prevT=t
    }
    if(oreSapt>48) alerte.push({tip:'err',mesaj:`${m.nume}: ${oreSapt}h/săpt — depășește 48h!`,culoare:'#f87171'})
    if(maxConsec>6) alerte.push({tip:'warn',mesaj:`${m.nume}: ${maxConsec} zile consecutive`,culoare:'#fbbf24'})
  })

  const swapuriPending = swapuri.filter(s=>s.status==='pending'||s.status===null||s.status==='')

  const numeBadge = (id:number) => echipa.find(m=>m.id===id)?.nume?.split(' ').pop()||'?'

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:20,paddingTop:'env(safe-area-inset-top,0px)'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(145deg,#d97706,#b45309)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(217,119,6,0.4)',fontSize:18}}>
            👑
          </div>
          <div>
            <div style={{fontSize:11,color:'#8b8b9e'}}>Bună, {prenume}!</div>
            <div style={{fontSize:15,fontWeight:700,color:'white'}}>RotaFlow Manager</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <a href="https://rotaflow-app.vercel.app" target="_blank" rel="noopener noreferrer"
            style={{background:'rgba(217,119,6,0.15)',border:'1px solid rgba(217,119,6,0.3)',borderRadius:9,padding:'6px 10px',color:'#fbbf24',fontSize:11,fontWeight:700,textDecoration:'none'}}>
            🖥 Desktop
          </a>
          <button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}}
            style={{background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'6px 10px',color:'#6b6b80',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            Ieșire
          </button>
        </div>
      </div>

      {/* Countdown criza */}
      {criza && (
        <div style={{margin:'4px 16px 8px',background:criza.zile<=7?'rgba(239,68,68,0.12)':'rgba(251,191,36,0.08)',border:`1px solid ${criza.zile<=7?'rgba(239,68,68,0.3)':'rgba(251,191,36,0.25)'}`,borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:criza.zile<=7?'#f87171':'#fbbf24'}}>
              ⚠️ Criză în {criza.zile} {criza.zile===1?'zi':'zile'}
            </div>
            <div style={{fontSize:10,color:'#8b8b9e',marginTop:2}}>
              {criza.data.toLocaleDateString('ro-RO',{day:'numeric',month:'long'})} — doar {criza.activi} activi
            </div>
          </div>
          <div style={{fontSize:28,fontWeight:900,color:criza.zile<=7?'#f87171':'#fbbf24'}}>{criza.zile}</div>
        </div>
      )}

      {/* Tab-uri */}
      <div style={{display:'flex',margin:'0 16px 8px',background:'#26262e',borderRadius:12,padding:3,border:'1px solid rgba(255,255,255,0.07)',gap:2}}>
        {([
          ['azi','👥'],
          ['luna','📅'],
          ['stats','📊'],
          ['swap',`🔄${swapuriPending.length>0?` (${swapuriPending.length})`:''}` ],
          ['alerte',`🔔${alerte.length>0?` (${alerte.length})`:''}` ],
        ] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v as any)} style={{
            flex:1,padding:'7px 2px',borderRadius:9,border:'none',cursor:'pointer',
            fontSize:11,fontWeight:600,fontFamily:'inherit',
            background:tab===v?'#3a3a4a':'transparent',
            color:tab===v?'white':'#6b6b80',
          }}>{l}</button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>

        {/* ═══ TAB AZI ═══ */}
        {tab==='azi'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:13,fontWeight:600,color:'white'}}>
                {days[0].getDate()}–{days[6].getDate()} {LUNI_S[days[6].getMonth()]}
                {weekOffset===0&&<span style={{fontSize:10,color:'#60a5fa',marginLeft:6}}>curentă</span>}
              </span>
              <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{background:'#26262e',borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
              {/* Header */}
              <div style={{display:'grid',gridTemplateColumns:'110px repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{padding:'6px 8px',fontSize:9,color:'#4b4b60',fontWeight:700}}>ANGAJAT</div>
                {days.map((d,i)=>{
                  const isToday=fmtDateInput(d)===fmtDateInput(azi)
                  const isWE=d.getDay()===0||d.getDay()===6
                  return <div key={i} style={{padding:'6px 2px',textAlign:'center'}}>
                    <div style={{fontSize:8,fontWeight:700,color:isToday?'#60a5fa':isWE?'#3b3b4f':'#6b6b80'}}>{ZILE_L[d.getDay()]}</div>
                    <div style={{fontSize:12,fontWeight:800,color:isToday?'#60a5fa':isWE?'#4b4b60':'white'}}>{d.getDate()}</div>
                  </div>
                })}
              </div>
              {echipa.map((m,mi)=>(
                <div key={mi} style={{display:'grid',gridTemplateColumns:'110px repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.04)',background:m.id===999?'rgba(251,191,36,0.04)':'transparent'}}>
                  <div style={{padding:'6px 8px',display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:m.id===999?'rgba(251,191,36,0.2)':'rgba(42,109,217,0.2)',border:`1px solid ${m.id===999?'rgba(251,191,36,0.3)':'rgba(42,109,217,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:m.id===999?'#fbbf24':'#60a5fa',flexShrink:0}}>
                      {m.id===999?'S':m.nume.split(' ').map((p:string)=>p[0]).slice(0,2).join('')}
                    </div>
                    <span style={{fontSize:10,fontWeight:600,color:m.id===999?'#fbbf24':'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.id===999?'Suplinitor':m.nume.split(' ').pop()}</span>
                  </div>
                  {days.map((d,di)=>{
                    const tip=getTura(tureMirror,m.id,d)
                    const c=TC[tip]??TC.L
                    const isToday=fmtDateInput(d)===fmtDateInput(azi)
                    return <div key={di} style={{padding:2}}>
                      <div style={{borderRadius:6,height:32,display:'flex',alignItems:'center',justifyContent:'center',background:tip==='L'?'transparent':c.bg,border:isToday&&tip!=='L'?`1.5px solid ${c.color}44`:'none',fontSize:10,fontWeight:800,color:tip==='L'?'#2b2b3b':c.color}}>
                        {tip==='L'?'':tip}
                      </div>
                    </div>
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB LUNA ═══ */}
        {tab==='luna'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,background:'#26262e',borderRadius:12,padding:'8px 12px',border:'1px solid rgba(255,255,255,0.07)'}}>
              <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:14,fontWeight:700,color:'white'}}>{LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
              <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{overflowX:'auto'}}>
              <div style={{minWidth:Math.max(500, lunaEnd.getDate()*18+90),background:'#26262e',borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{display:'grid',gridTemplateColumns:`90px repeat(${lunaEnd.getDate()},1fr)`,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{padding:'5px 8px',fontSize:8,color:'#4b4b60',fontWeight:700}}>ANGAJAT</div>
                  {Array.from({length:lunaEnd.getDate()},(_,i)=>{
                    const d=new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
                    const isWE=d.getDay()===0||d.getDay()===6
                    const isToday=fmtDateInput(d)===fmtDateInput(azi)
                    return <div key={i} style={{padding:'3px 1px',textAlign:'center'}}>
                      <div style={{fontSize:7,fontWeight:700,color:isToday?'#60a5fa':isWE?'#3b3b4f':'#4b4b60'}}>{ZILE_S[d.getDay()]}</div>
                      <div style={{fontSize:8,fontWeight:800,color:isToday?'#60a5fa':isWE?'#3b3b4f':'#6b6b80'}}>{i+1}</div>
                    </div>
                  })}
                </div>
                {echipa.map((m,mi)=>(
                  <div key={mi} style={{display:'grid',gridTemplateColumns:`90px repeat(${lunaEnd.getDate()},1fr)`,borderBottom:'1px solid rgba(255,255,255,0.04)',background:m.id===999?'rgba(251,191,36,0.04)':'transparent'}}>
                    <div style={{padding:'4px 8px',fontSize:9,fontWeight:600,color:m.id===999?'#fbbf24':'white',display:'flex',alignItems:'center'}}>
                      {m.id===999?'Suplinitor':m.nume.split(' ').pop()}
                    </div>
                    {Array.from({length:lunaEnd.getDate()},(_,i)=>{
                      const d=new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
                      const tip=getTura(tureMirror,m.id,d)
                      const c=TC[tip]??TC.L
                      const isToday=fmtDateInput(d)===fmtDateInput(azi)
                      return <div key={i} style={{padding:'2px 1px'}}>
                        <div style={{borderRadius:3,height:20,display:'flex',alignItems:'center',justifyContent:'center',background:tip==='L'?'transparent':c.bg,border:isToday?`1px solid ${c.color}55`:'none',fontSize:7,fontWeight:800,color:tip==='L'?'transparent':c.color}}>
                          {tip==='L'?'':tip}
                        </div>
                      </div>
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB STATISTICI ═══ */}
        {tab==='stats'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:26,height:26,borderRadius:7,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{fontSize:13,fontWeight:600,color:'white',flex:1,textAlign:'center'}}>{LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
              <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:26,height:26,borderRadius:7,background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...echipa].filter(m=>m.id!==999).sort((a,b)=>(oreAngajat[b.id]||0)-(oreAngajat[a.id]||0)).map(m=>{
                const ore=oreAngajat[m.id]||0
                const maxO=Math.max(...echipa.filter(x=>x.id!==999).map(x=>oreAngajat[x.id]||0),1)
                const zileD=Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)).filter(d=>getTura(tureMirror,m.id,d)==='D').length
                const zileS=Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)).filter(d=>getTura(tureMirror,m.id,d)==='S').length
                const zileCO=Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)).filter(d=>getTura(tureMirror,m.id,d)==='CO').length
                return (
                  <div key={m.id} style={{background:'#26262e',borderRadius:14,padding:'12px 14px',border:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(42,109,217,0.2)',border:'1px solid rgba(42,109,217,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#60a5fa'}}>
                          {m.nume.split(' ').map((p:string)=>p[0]).slice(0,2).join('')}
                        </div>
                        <span style={{fontSize:14,fontWeight:700,color:'white'}}>{m.nume}</span>
                      </div>
                      <span style={{fontSize:20,fontWeight:900,color:'#60a5fa'}}>{ore}h</span>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,marginBottom:8,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(ore/maxO)*100}%`,background:'linear-gradient(90deg,#2a6dd9,#60a5fa)',borderRadius:2}}/>
                    </div>
                    <div style={{display:'flex',gap:12}}>
                      <span style={{fontSize:11,color:'#93c5fd'}}>☀️ {zileD}D</span>
                      <span style={{fontSize:11,color:'#c4b5fd'}}>🌙 {zileS}S</span>
                      {zileCO>0&&<span style={{fontSize:11,color:'#fca5a5'}}>🏖️ {zileCO}CO</span>}
                    </div>
                  </div>
                )
              })}
              <div style={{background:'rgba(42,109,217,0.1)',border:'1px solid rgba(42,109,217,0.2)',borderRadius:14,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,color:'#8b8b9e',fontWeight:600}}>Total echipă</span>
                <span style={{fontSize:20,fontWeight:900,color:'#60a5fa'}}>{echipa.filter(m=>m.id!==999).reduce((s,m)=>s+(oreAngajat[m.id]||0),0)}h</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB SWAP ═══ */}
        {tab==='swap'&&(
          <div>
            <div style={{fontSize:12,color:'#8b8b9e',marginBottom:12,fontWeight:600}}>Cereri de schimb tură</div>
            {swapuri.length===0?(
              <div style={{textAlign:'center',padding:'40px 20px',color:'#4b4b60',fontSize:14}}>Nicio cerere de swap</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {swapuri.map(s=>{
                  const isPending = !s.status||s.status==='pending'||s.status===''
                  const isAprobat = s.status==='aprobat'
                  const isRefuzat = s.status==='refuzat'
                  return (
                    <div key={s.id} style={{background:'#26262e',border:`1px solid ${isPending?'rgba(251,191,36,0.3)':isAprobat?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:14,padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>
                          {numeBadge(s.a_id)} ⇄ {numeBadge(s.b_id)}
                        </div>
                        <div style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,
                          background:isPending?'rgba(251,191,36,0.15)':isAprobat?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.15)',
                          color:isPending?'#fbbf24':isAprobat?'#4ade80':'#f87171'}}>
                          {isPending?'⏳ În așteptare':isAprobat?'✓ Aprobat':'✗ Refuzat'}
                        </div>
                      </div>
                      <div style={{fontSize:12,color:'#8b8b9e',marginBottom:s.nota?6:0}}>
                        {new Date(s.a_data).toLocaleDateString('ro-RO',{day:'numeric',month:'short'})} ↔ {new Date(s.b_data).toLocaleDateString('ro-RO',{day:'numeric',month:'short'})}
                      </div>
                      {s.nota&&<div style={{fontSize:11,color:'#6b6b80',fontStyle:'italic',marginBottom:8}}>„{s.nota}"</div>}
                      {isPending&&(
                        <div style={{display:'flex',gap:8,marginTop:10}}>
                          <button onClick={()=>approveSwap(s.id,true)} style={{flex:1,padding:'8px 0',borderRadius:10,border:'none',cursor:'pointer',background:'rgba(74,222,128,0.15)',color:'#4ade80',fontSize:13,fontWeight:700,fontFamily:'inherit'}}>
                            ✓ Aprobă
                          </button>
                          <button onClick={()=>approveSwap(s.id,false)} style={{flex:1,padding:'8px 0',borderRadius:10,border:'none',cursor:'pointer',background:'rgba(239,68,68,0.12)',color:'#f87171',fontSize:13,fontWeight:700,fontFamily:'inherit'}}>
                            ✗ Refuză
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB ALERTE ═══ */}
        {tab==='alerte'&&(
          <div>
            {/* Alerte automate */}
            <div style={{fontSize:12,color:'#8b8b9e',marginBottom:10,fontWeight:600}}>🔔 Alerte automate — săptămâna curentă</div>
            {alerte.length===0?(
              <div style={{background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>✅</span>
                <span style={{fontSize:13,color:'#4ade80',fontWeight:600}}>Toate regulile respectate săptămâna aceasta!</span>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
                {alerte.map((a,i)=>(
                  <div key={i} style={{background:`${a.culoare}12`,border:`1px solid ${a.culoare}30`,borderRadius:11,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:16}}>{a.tip==='err'?'⚠️':'⚡'}</span>
                    <span style={{fontSize:12,color:a.culoare,fontWeight:600}}>{a.mesaj}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Istoric modificari */}
            <div style={{fontSize:12,color:'#8b8b9e',marginBottom:10,fontWeight:600}}>📋 Istoric modificări program</div>
            {istoric.length===0?(
              <div style={{textAlign:'center',padding:'20px',color:'#4b4b60',fontSize:13}}>Nicio modificare înregistrată</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {istoric.map((item,i)=>(
                  <div key={i} style={{background:'#26262e',borderRadius:10,padding:'8px 12px',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.8)'}}>{item.mesaj}</div>
                    <div style={{fontSize:10,color:'#4b4b60',marginTop:2}}>
                      {new Date(item.creat_la).toLocaleDateString('ro-RO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
