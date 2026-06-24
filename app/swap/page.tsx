'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getTura, fmtDateInput, getMonday } from '@/lib/rotatie'

const ZILE_SCURT = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ']
const LUNI = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

const TC: Record<string,{pillBg:string;pillColor:string;border:string}> = {
  D:  {pillBg:'rgba(30,79,168,0.5)', pillColor:'#bfdbfe',border:'rgba(59,130,246,0.3)'},
  S:  {pillBg:'rgba(76,29,138,0.5)', pillColor:'#ddd6fe',border:'rgba(139,92,246,0.3)'},
  L:  {pillBg:'rgba(255,255,255,0.05)',pillColor:'#4b4b60',border:'rgba(255,255,255,0.05)'},
  CO: {pillBg:'rgba(127,29,29,0.5)', pillColor:'#fecaca',border:'rgba(239,68,68,0.25)'},
  CM: {pillBg:'rgba(124,45,18,0.5)', pillColor:'#fed7aa',border:'rgba(249,115,22,0.25)'},
  AN: {pillBg:'rgba(69,10,10,0.5)',  pillColor:'#fca5a5',border:'rgba(220,38,38,0.25)'},
}

export default function SwapPage() {
  const { angajat, echipa, loading } = useAuth()
  const [colegAles, setColegAles] = useState<number|null>(null)
  const [ziaMea, setZiaMea]   = useState<string|null>(null)
  const [ziaCo, setZiaCo]     = useState<string|null>(null)
  const [sent, setSent]        = useState(false)
  const [lunaOffset, setLunaOffset] = useState(0)

  if (loading || !angajat) return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:28,height:28,borderRadius:'50%',border:'2.5px solid rgba(96,165,250,0.2)',borderTopColor:'#60a5fa',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const now = new Date()
  const lunaStart = new Date(now.getFullYear(), now.getMonth()+lunaOffset, 1)
  const lunaEnd   = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)
  const azi = new Date(); azi.setHours(0,0,0,0)

  const zile: Date[] = Array.from({length:lunaEnd.getDate()},(_,i)=>
    new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1)
  )

  const colegii = echipa.filter(a => a.id !== angajat.id)
  const colegObiect = colegii.find(c => c.id === colegAles) ?? null

  const turaMeaPeZi = (d: Date) => getTura(d, angajat, echipa)
  const turaColegPeZi = (d: Date) => colegObiect ? getTura(d, colegObiect, echipa) : null

  const canSwap = (dMea: Date, dCo: Date) => {
    const tM = turaMeaPeZi(dMea)
    const tC = turaColegPeZi(dCo)
    return (tM==='D'||tM==='S') && (tC==='D'||tC==='S')
  }

  const reset = () => { setZiaMea(null); setZiaCo(null); setSent(false) }

  if (sent) return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <div style={{fontSize:56}}>✅</div>
      <div style={{fontSize:20,fontWeight:800,color:'white'}}>Cerere trimisă!</div>
      <div style={{fontSize:13,color:'#8b8b9e',textAlign:'center'}}>
        {colegObiect?.nume} va fi notificat.
      </div>
      <button onClick={reset} style={{marginTop:8,background:'#26262e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'12px 28px',color:'white',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
        Altă cerere
      </button>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:88,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>

        <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5,marginBottom:4}}>Swap tură</div>
        <div style={{fontSize:13,color:'#8b8b9e',marginBottom:18}}>Selectează zilele pe care vrei să le schimbi</div>

        {/* Pasul 1 — alege coleg */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'#8b8b9e',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
            1. Alege colegul
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {colegii.map(c => (
              <button key={c.id} onClick={()=>{setColegAles(c.id);setZiaCo(null)}} style={{
                padding:'8px 16px',borderRadius:20,border:'none',cursor:'pointer',
                fontFamily:'inherit',fontSize:13,fontWeight:600,
                background:colegAles===c.id?'rgba(42,109,217,0.4)':'#26262e',
                color:colegAles===c.id?'#93c5fd':'#8b8b9e',
                outline:colegAles===c.id?'1.5px solid rgba(96,165,250,0.5)':'1px solid rgba(255,255,255,0.08)',
              }}>
                {c.nume.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* Navigator luna */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,background:'#26262e',borderRadius:12,padding:'8px 12px',border:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={()=>setLunaOffset(o=>o-1)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{fontSize:14,fontWeight:600,color:'white'}}>
            {LUNI[lunaStart.getMonth()]} {lunaStart.getFullYear()}
          </span>
          <button onClick={()=>setLunaOffset(o=>o+1)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b8b9e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Pasul 2 — zile */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>

          {/* Coloana mea */}
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8b8b9e',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8,textAlign:'center'}}>
              2. Ziua mea
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              {zile.map((d,i) => {
                const tip = turaMeaPeZi(d)
                const c = TC[tip]??TC.L
                const sel = ziaMea===fmtDateInput(d)
                const isWE = d.getDay()===0||d.getDay()===6
                const canSel = (tip==='D'||tip==='S') && d>=azi
                return (
                  <button key={i} onClick={()=>canSel&&setZiaMea(fmtDateInput(d))}
                    disabled={!canSel}
                    style={{
                      display:'flex',alignItems:'center',gap:6,
                      background:sel?'rgba(96,165,250,0.15)':canSel?c.pillBg:'transparent',
                      border:sel?'1.5px solid #60a5fa':canSel?`1px solid ${c.border}`:'1px solid rgba(255,255,255,0.03)',
                      borderRadius:10,padding:'7px 8px',cursor:canSel?'pointer':'default',
                      opacity:canSel?1:0.3,width:'100%',fontFamily:'inherit',
                    }}>
                    <div style={{minWidth:22,textAlign:'center'}}>
                      <div style={{fontSize:13,fontWeight:800,color:sel?'#60a5fa':isWE?'#6b6b80':'white',lineHeight:1}}>{d.getDate()}</div>
                      <div style={{fontSize:8,color:'#6b6b80',fontWeight:600}}>{ZILE_SCURT[d.getDay()]}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:sel?'#93c5fd':c.pillColor}}>{tip==='L'?'—':tip}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Coloana coleg */}
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8b8b9e',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8,textAlign:'center'}}>
              3. Ziua {colegObiect ? colegObiect.nume.split(' ').pop() : 'coleg'}
            </div>
            {!colegAles ? (
              <div style={{textAlign:'center',paddingTop:20,color:'#4b4b60',fontSize:12}}>← alege coleg</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                {zile.map((d,i) => {
                  const tip = turaColegPeZi(d) ?? 'L'
                  const c = TC[tip]??TC.L
                  const sel = ziaCo===fmtDateInput(d)
                  const isWE = d.getDay()===0||d.getDay()===6
                  const canSel = (tip==='D'||tip==='S') && d>=azi && ziaMea!=null && canSwap(new Date(ziaMea), d)
                  return (
                    <button key={i} onClick={()=>canSel&&setZiaCo(fmtDateInput(d))}
                      disabled={!canSel}
                      style={{
                        display:'flex',alignItems:'center',gap:6,
                        background:sel?'rgba(96,165,250,0.15)':canSel?c.pillBg:'transparent',
                        border:sel?'1.5px solid #60a5fa':canSel?`1px solid ${c.border}`:'1px solid rgba(255,255,255,0.03)',
                        borderRadius:10,padding:'7px 8px',cursor:canSel?'pointer':'default',
                        opacity:canSel?1:0.3,width:'100%',fontFamily:'inherit',
                      }}>
                      <div style={{minWidth:22,textAlign:'center'}}>
                        <div style={{fontSize:13,fontWeight:800,color:sel?'#60a5fa':isWE?'#6b6b80':'white',lineHeight:1}}>{d.getDate()}</div>
                        <div style={{fontSize:8,color:'#6b6b80',fontWeight:600}}>{ZILE_SCURT[d.getDay()]}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:sel?'#93c5fd':c.pillColor}}>{tip==='L'?'—':tip}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sumar + buton */}
        {ziaMea && ziaCo && colegObiect && (
          <div style={{
            background:'rgba(42,109,217,0.12)',border:'1px solid rgba(96,165,250,0.25)',
            borderRadius:16,padding:'14px 16px',marginBottom:14,
          }}>
            <div style={{fontSize:12,color:'#8b8b9e',marginBottom:8,fontWeight:600}}>Rezumat swap</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:11,color:'#8b8b9e'}}>Tu</div>
                <div style={{fontSize:16,fontWeight:800,color:'white'}}>{new Date(ziaMea).getDate()} {LUNI[new Date(ziaMea).getMonth()]}</div>
                <div style={{fontSize:12,fontWeight:700,color:'#93c5fd'}}>{turaMeaPeZi(new Date(ziaMea))}</div>
              </div>
              <div style={{fontSize:22}}>⇄</div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:11,color:'#8b8b9e'}}>{colegObiect.nume.split(' ').pop()}</div>
                <div style={{fontSize:16,fontWeight:800,color:'white'}}>{new Date(ziaCo).getDate()} {LUNI[new Date(ziaCo).getMonth()]}</div>
                <div style={{fontSize:12,fontWeight:700,color:'#c4b5fd'}}>{turaColegPeZi(new Date(ziaCo))}</div>
              </div>
            </div>
          </div>
        )}

        <button
          disabled={!ziaMea||!ziaCo||!colegAles}
          onClick={()=>setSent(true)}
          style={{
            width:'100%',padding:'15px 0',borderRadius:14,border:'none',cursor:'pointer',
            fontSize:16,fontWeight:700,color:'white',fontFamily:'inherit',
            background:(!ziaMea||!ziaCo||!colegAles)?'rgba(42,109,217,0.25)':'linear-gradient(145deg,#2a6dd9,#1a4fa0)',
            boxShadow:(!ziaMea||!ziaCo||!colegAles)?'none':'0 4px 20px rgba(42,109,217,0.4)',
            opacity:(!ziaMea||!ziaCo||!colegAles)?0.5:1,
          }}>
          Trimite cerere swap
        </button>

      </div>
      <BottomNav/>
    </div>
  )
}
