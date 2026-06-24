'use client'
import { useState } from 'react'
import { useAuth, TuraMirror } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { fmtDateInput, getMonday, Angajat } from '@/lib/rotatie'

const LUNI_FULL = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZILE_LUNG = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă']
const ZILE_SCURT = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']

function getTuraMirror(tureMirror: TuraMirror[], angajatId: number, d: Date): string {
  const dStr = fmtDateInput(d)
  return tureMirror.find(t => t.angajat_id === angajatId && t.data === dStr)?.tura ?? 'L'
}

const TURA_COLOR: Record<string,{bg:string;color:string;label:string;emoji:string}> = {
  D:  {bg:'rgba(37,99,235,0.2)', color:'#93c5fd', label:'Dimineață', emoji:'☀️'},
  S:  {bg:'rgba(109,40,217,0.2)',color:'#c4b5fd', label:'Seară',     emoji:'🌙'},
  L:  {bg:'rgba(255,255,255,0.05)',color:'#6b6b80',label:'Liber',    emoji:'○'},
  CO: {bg:'rgba(127,29,29,0.2)', color:'#fca5a5', label:'Concediu', emoji:'🏖️'},
  CM: {bg:'rgba(124,45,18,0.2)', color:'#fdba74', label:'Medical',  emoji:'🏥'},
  AN: {bg:'rgba(69,10,10,0.2)',  color:'#f87171', label:'Absent',   emoji:'⛔'},
}

// Urmatoarele 14 zile cu ture D sau S
function getZileDisponibile(angajatId: number, tureMirror: TuraMirror[]): Date[] {
  const azi = new Date(); azi.setHours(0,0,0,0)
  const zile: Date[] = []
  for (let i=0; i<30; i++) {
    const d = new Date(azi.getTime() + i*86400000)
    const t = getTuraMirror(tureMirror, angajatId, d)
    if (t==='D'||t==='S') zile.push(d)
    if (zile.length >= 14) break
  }
  return zile
}

export default function SwapPage() {
  const { angajat, echipa, tureMirror, loading } = useAuth()
  const [pas, setPas] = useState<1|2|3|4>(1)
  const [ziaMea, setZiaMea]   = useState<Date|null>(null)
  const [colegAles, setColegAles] = useState<Angajat|null>(null)
  const [ziaCo, setZiaCo]     = useState<Date|null>(null)
  const [nota, setNota]       = useState('')
  const [trimis, setTrimis]   = useState(false)

  if (loading||!angajat) return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid rgba(96,165,250,0.2)',borderTopColor:'#60a5fa',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const colegii = echipa.filter(a=>a.id!==angajat.id)
  const zileMele = getZileDisponibile(angajat.id, tureMirror)
  const zileCo = colegAles ? getZileDisponibile(colegAles.id, tureMirror) : []

  const reset = () => {
    setPas(1); setZiaMea(null); setColegAles(null); setZiaCo(null); setNota(''); setTrimis(false)
  }

  // Ecran de succes
  if (trimis) return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,paddingBottom:88}}>
      <div style={{fontSize:80,marginBottom:24}}>✅</div>
      <div style={{fontSize:26,fontWeight:900,color:'white',textAlign:'center',marginBottom:12}}>
        Cerere trimisă!
      </div>
      <div style={{fontSize:16,color:'#8b8b9e',textAlign:'center',lineHeight:1.6,marginBottom:8}}>
        Ai cerut schimb cu
      </div>
      <div style={{fontSize:20,fontWeight:800,color:'white',textAlign:'center',marginBottom:4}}>
        {colegAles?.nume}
      </div>
      {ziaMea&&ziaCo&&(
        <div style={{fontSize:15,color:'#8b8b9e',textAlign:'center',marginBottom:32}}>
          {ziaMea.getDate()} {LUNI_FULL[ziaMea.getMonth()]} ⇄ {ziaCo.getDate()} {LUNI_FULL[ziaCo.getMonth()]}
        </div>
      )}
      {nota&&(
        <div style={{background:'rgba(255,255,255,0.06)',borderRadius:14,padding:'12px 16px',marginBottom:32,maxWidth:300,width:'100%'}}>
          <div style={{fontSize:11,color:'#6b6b80',marginBottom:4}}>Nota ta</div>
          <div style={{fontSize:14,color:'#8b8b9e',fontStyle:'italic'}}>„{nota}"</div>
        </div>
      )}
      <button onClick={reset} style={{
        background:'#2a6dd9',border:'none',borderRadius:16,padding:'18px 40px',
        fontSize:17,fontWeight:700,color:'white',cursor:'pointer',fontFamily:'inherit',
        boxShadow:'0 4px 20px rgba(42,109,217,0.4)',
      }}>
        Altă cerere
      </button>
      <BottomNav/>
    </div>
  )

  // Indicator pași
  const PasIndicator = () => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:28}}>
      {[1,2,3,4].map(p=>(
        <div key={p} style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            width:p===pas?36:28,height:p===pas?36:28,borderRadius:'50%',
            background:p<pas?'#2a6dd9':p===pas?'#2a6dd9':'rgba(255,255,255,0.08)',
            border:p===pas?'none':'none',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:p===pas?15:12,fontWeight:800,
            color:p<=pas?'white':'#4b4b60',
            transition:'all 0.2s',
            flexShrink:0,
          }}>
            {p<pas?'✓':p}
          </div>
          {p<4&&<div style={{width:p===pas?20:16,height:2,background:p<pas?'#2a6dd9':'rgba(255,255,255,0.08)',borderRadius:1}}/>}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:88,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 20px 0'}}>

        {/* Header */}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:24,fontWeight:900,color:'white',letterSpacing:-0.5}}>Schimb tură</div>
          <div style={{fontSize:14,color:'#8b8b9e',marginTop:2}}>
            {pas===1&&'Alege ziua ta de muncă'}
            {pas===2&&'Alege colegul cu care schimbi'}
            {pas===3&&'Alege ziua colegului'}
            {pas===4&&'Confirmă schimbul'}
          </div>
        </div>

        <PasIndicator/>

        {/* ─── PAS 1: Ziua mea ─── */}
        {pas===1&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#8b8b9e',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Când vrei să schimbi?
            </div>
            {zileMele.length===0?(
              <div style={{textAlign:'center',padding:'40px 20px',color:'#4b4b60',fontSize:15}}>
                Nu ai ture disponibile în următoarele 30 de zile.
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {zileMele.map((d,i)=>{
                  const tip=getTuraMirror(tureMirror,angajat.id,d)
                  const tc=TURA_COLOR[tip]??TURA_COLOR.L
                  const isWE=d.getDay()===0||d.getDay()===6
                  return (
                    <button key={i} onClick={()=>{setZiaMea(d);setPas(2)}} style={{
                      display:'flex',alignItems:'center',gap:16,
                      background:'#26262e',border:'1.5px solid rgba(255,255,255,0.08)',
                      borderRadius:18,padding:'16px 20px',cursor:'pointer',
                      width:'100%',fontFamily:'inherit',textAlign:'left',
                      transition:'all 0.15s',
                    }}>
                      {/* Data */}
                      <div style={{
                        width:56,height:56,borderRadius:14,
                        background:tc.bg,border:`1.5px solid ${tc.color}33`,
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                        flexShrink:0,
                      }}>
                        <span style={{fontSize:22,fontWeight:900,color:'white',lineHeight:1}}>{d.getDate()}</span>
                        <span style={{fontSize:10,fontWeight:700,color:isWE?'#ef4444':'#8b8b9e',textTransform:'uppercase'}}>{ZILE_SCURT[d.getDay()]}</span>
                      </div>
                      {/* Info */}
                      <div style={{flex:1}}>
                        <div style={{fontSize:17,fontWeight:700,color:'white',marginBottom:3}}>
                          {ZILE_LUNG[d.getDay()]}
                        </div>
                        <div style={{fontSize:14,color:tc.color}}>
                          {tc.emoji} {tc.label}
                        </div>
                        <div style={{fontSize:12,color:'#6b6b80',marginTop:2}}>
                          {LUNI_FULL[d.getMonth()]} {d.getFullYear()}
                        </div>
                      </div>
                      {/* Arrow */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b4b60" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── PAS 2: Alege coleg ─── */}
        {pas===2&&ziaMea&&(
          <div>
            {/* Rezumat ziua mea */}
            <div style={{background:'rgba(37,99,235,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:14,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:28}}>📅</div>
              <div>
                <div style={{fontSize:11,color:'#8b8b9e',fontWeight:600}}>Ziua ta selectată</div>
                <div style={{fontSize:16,fontWeight:800,color:'white'}}>{ZILE_LUNG[ziaMea.getDay()]}, {ziaMea.getDate()} {LUNI_FULL[ziaMea.getMonth()]}</div>
                <div style={{fontSize:13,color:'#93c5fd'}}>{TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.emoji} {TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.label}</div>
              </div>
            </div>

            <div style={{fontSize:13,fontWeight:700,color:'#8b8b9e',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Cu cine schimbi?
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {colegii.map((c,i)=>(
                <button key={i} onClick={()=>{setColegAles(c);setPas(3)}} style={{
                  display:'flex',alignItems:'center',gap:16,
                  background:'#26262e',border:'1.5px solid rgba(255,255,255,0.08)',
                  borderRadius:18,padding:'16px 20px',cursor:'pointer',
                  width:'100%',fontFamily:'inherit',
                }}>
                  <div style={{
                    width:52,height:52,borderRadius:'50%',
                    background:'rgba(42,109,217,0.2)',border:'1.5px solid rgba(42,109,217,0.3)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:18,fontWeight:900,color:'#60a5fa',flexShrink:0,
                  }}>
                    {c.nume.split(' ').map((p:string)=>p[0]).slice(0,2).join('')}
                  </div>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontSize:18,fontWeight:700,color:'white'}}>{c.nume}</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b4b60" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>

            <button onClick={()=>setPas(1)} style={{marginTop:20,background:'none',border:'none',color:'#6b6b80',fontSize:15,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
              ← Înapoi
            </button>
          </div>
        )}

        {/* ─── PAS 3: Ziua colegului ─── */}
        {pas===3&&ziaMea&&colegAles&&(
          <div>
            {/* Rezumat */}
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:14,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
              <div>
                <div style={{fontSize:11,color:'#8b8b9e',fontWeight:600,marginBottom:4}}>Schimb propus</div>
                <div style={{fontSize:14,fontWeight:700,color:'white'}}>
                  Tu: {ziaMea.getDate()} {LUNI_FULL[ziaMea.getMonth()]} · {TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.emoji}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:'white',marginTop:2}}>
                  {colegAles.nume.split(' ').pop()}: ?
                </div>
              </div>
            </div>

            <div style={{fontSize:13,fontWeight:700,color:'#8b8b9e',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Ce zi a lui {colegAles.nume.split(' ').pop()} vrei?
            </div>

            {zileCo.length===0?(
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:40,marginBottom:12}}>😕</div>
                <div style={{fontSize:16,color:'#8b8b9e'}}>{colegAles.nume.split(' ').pop()} nu are ture disponibile în curând.</div>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {zileCo.map((d,i)=>{
                  const tip=getTuraMirror(tureMirror,colegAles.id,d)
                  const tc=TURA_COLOR[tip]??TURA_COLOR.L
                  const isWE=d.getDay()===0||d.getDay()===6
                  return (
                    <button key={i} onClick={()=>{setZiaCo(d);setPas(4)}} style={{
                      display:'flex',alignItems:'center',gap:16,
                      background:'#26262e',border:'1.5px solid rgba(255,255,255,0.08)',
                      borderRadius:18,padding:'16px 20px',cursor:'pointer',
                      width:'100%',fontFamily:'inherit',textAlign:'left',
                    }}>
                      <div style={{width:56,height:56,borderRadius:14,background:tc.bg,border:`1.5px solid ${tc.color}33`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:22,fontWeight:900,color:'white',lineHeight:1}}>{d.getDate()}</span>
                        <span style={{fontSize:10,fontWeight:700,color:isWE?'#ef4444':'#8b8b9e',textTransform:'uppercase'}}>{ZILE_SCURT[d.getDay()]}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:17,fontWeight:700,color:'white',marginBottom:3}}>{ZILE_LUNG[d.getDay()]}</div>
                        <div style={{fontSize:14,color:tc.color}}>{tc.emoji} {tc.label}</div>
                        <div style={{fontSize:12,color:'#6b6b80',marginTop:2}}>{LUNI_FULL[d.getMonth()]} {d.getFullYear()}</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b4b60" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )
                })}
              </div>
            )}

            <button onClick={()=>setPas(2)} style={{marginTop:20,background:'none',border:'none',color:'#6b6b80',fontSize:15,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
              ← Înapoi
            </button>
          </div>
        )}

        {/* ─── PAS 4: Confirmare ─── */}
        {pas===4&&ziaMea&&ziaCo&&colegAles&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#8b8b9e',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Verifică și trimite
            </div>

            {/* Card confirmare */}
            <div style={{background:'#26262e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'20px',marginBottom:16}}>

              {/* Randul meu */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:12,background:TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                  {TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'#8b8b9e',fontWeight:600,marginBottom:2}}>Tu dai</div>
                  <div style={{fontSize:16,fontWeight:800,color:'white'}}>{ZILE_LUNG[ziaMea.getDay()]}, {ziaMea.getDate()} {LUNI_FULL[ziaMea.getMonth()]}</div>
                  <div style={{fontSize:13,color:TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.color}}>{TURA_COLOR[getTuraMirror(tureMirror,angajat.id,ziaMea)]?.label}</div>
                </div>
              </div>

              {/* Sageata */}
              <div style={{textAlign:'center',fontSize:28,marginBottom:16,opacity:0.5}}>⇅</div>

              {/* Randul colegului */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{width:44,height:44,borderRadius:12,background:TURA_COLOR[getTuraMirror(tureMirror,colegAles.id,ziaCo)]?.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                  {TURA_COLOR[getTuraMirror(tureMirror,colegAles.id,ziaCo)]?.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'#8b8b9e',fontWeight:600,marginBottom:2}}>{colegAles.nume.split(' ').pop()} dă</div>
                  <div style={{fontSize:16,fontWeight:800,color:'white'}}>{ZILE_LUNG[ziaCo.getDay()]}, {ziaCo.getDate()} {LUNI_FULL[ziaCo.getMonth()]}</div>
                  <div style={{fontSize:13,color:TURA_COLOR[getTuraMirror(tureMirror,colegAles.id,ziaCo)]?.color}}>{TURA_COLOR[getTuraMirror(tureMirror,colegAles.id,ziaCo)]?.label}</div>
                </div>
              </div>

              {/* Nota */}
              <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:16}}>
                <div style={{fontSize:13,fontWeight:600,color:'#8b8b9e',marginBottom:8}}>
                  💬 Adaugă o notă (opțional)
                </div>
                <textarea
                  value={nota}
                  onChange={e=>setNota(e.target.value)}
                  placeholder="ex: Am o urgență, te rog să schimbi cu mine..."
                  maxLength={120}
                  rows={2}
                  style={{
                    width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:12,padding:'12px 14px',fontSize:15,color:'white',fontFamily:'inherit',
                    outline:'none',resize:'none',boxSizing:'border-box',lineHeight:1.5,
                  }}
                />
                {nota&&<div style={{fontSize:11,color:'#4b4b60',textAlign:'right',marginTop:4}}>{nota.length}/120</div>}
              </div>
            </div>

            {/* Buton trimite — MARE */}
            <button onClick={()=>setTrimis(true)} style={{
              width:'100%',padding:'20px 0',borderRadius:18,border:'none',cursor:'pointer',
              fontSize:20,fontWeight:800,color:'white',fontFamily:'inherit',
              background:'linear-gradient(145deg,#2a6dd9,#1a4fa0)',
              boxShadow:'0 6px 24px rgba(42,109,217,0.5)',
              marginBottom:12,
            }}>
              ✓ Trimite cererea
            </button>

            <button onClick={()=>setPas(3)} style={{
              width:'100%',padding:'14px 0',borderRadius:14,border:'1px solid rgba(255,255,255,0.08)',
              background:'none',fontSize:15,fontWeight:600,color:'#8b8b9e',fontFamily:'inherit',cursor:'pointer',
            }}>
              ← Înapoi
            </button>
          </div>
        )}

      </div>
      <BottomNav/>
    </div>
  )
}
