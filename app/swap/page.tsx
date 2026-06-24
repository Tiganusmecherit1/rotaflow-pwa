'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'

export default function SwapPage() {
  const { angajat, echipa, loading } = useAuth()
  const [dataA, setDataA] = useState('')
  const [destId, setDestId] = useState('')
  const [dataB, setDataB] = useState('')
  const [nota, setNota] = useState('')
  const [sent, setSent] = useState(false)

  if (loading) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>
  if (!angajat) return null

  const colegii = echipa.filter(a => a.id !== angajat.id)

  const inp = (label: string, el: React.ReactNode) => (
    <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
      <div style={{fontSize:10,fontWeight:700,color:'#8b8b9e',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>{label}</div>
      {el}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width:'100%',background:'transparent',border:'none',outline:'none',
    fontSize:15,color:'white',fontFamily:'inherit',
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:80,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>
        <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5,marginBottom:4}}>Swap tură</div>
        <div style={{fontSize:13,color:'#8b8b9e',marginBottom:20}}>Propune un schimb cu un coleg</div>

        {sent ? (
          <div style={{textAlign:'center',paddingTop:40}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:18,fontWeight:700,color:'white',marginBottom:8}}>Cerere trimisă!</div>
            <div style={{fontSize:13,color:'#8b8b9e',marginBottom:24}}>Colegul va fi notificat.</div>
            <button onClick={()=>setSent(false)} style={{background:'#26262e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'12px 24px',color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Altă cerere
            </button>
          </div>
        ) : (
          <>
            <div style={{background:'#26262e',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',overflow:'hidden',marginBottom:12}}>
              {inp('Ziua mea', <input type="date" value={dataA} onChange={e=>setDataA(e.target.value)} style={inputStyle}/>)}
              {inp('Coleg', (
                <select value={destId} onChange={e=>setDestId(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                  <option value="" style={{background:'#26262e'}}>Alege coleg...</option>
                  {colegii.map(c=><option key={c.id} value={c.id} style={{background:'#26262e'}}>{c.nume}</option>)}
                </select>
              ))}
              {inp('Ziua colegului', <input type="date" value={dataB} onChange={e=>setDataB(e.target.value)} style={inputStyle}/>)}
              <div style={{padding:'14px 16px'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#8b8b9e',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Notă</div>
                <input type="text" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Opțional..." style={{...inputStyle,'::placeholder':{color:'#4b4b60'} as any}}/>
              </div>
            </div>

            <button
              disabled={!dataA||!destId||!dataB}
              onClick={()=>setSent(true)}
              style={{
                width:'100%',padding:'15px 0',borderRadius:14,border:'none',cursor:'pointer',
                fontSize:16,fontWeight:700,color:'white',fontFamily:'inherit',
                background:(!dataA||!destId||!dataB)?'rgba(42,109,217,0.3)':'linear-gradient(145deg,#2a6dd9,#1a4fa0)',
                boxShadow:(!dataA||!destId||!dataB)?'none':'0 4px 20px rgba(42,109,217,0.4)',
              }}>
              Trimite cerere
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
