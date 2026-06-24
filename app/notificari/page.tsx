'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'acum'
  if (diff < 3600) return `${Math.floor(diff/60)} min`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}z`
}

const TIP_ICON: Record<string,string> = {
  program: '📅', swap: '🔄', sistem: '⚙️'
}

export default function NotificariPage() {
  const { angajat, notificari, setNotificari, loading, marcheazaCitita } = useAuth() as any
  const [sterse, setSterse] = useState<Set<string>>(new Set())
  const [swipeX, setSwipeX] = useState<Record<string,number>>({})
  const touchStart = useRef<Record<string,number>>({})

  if (loading || !angajat) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>

  const vizibile = notificari.filter((n: any) => !sterse.has(n.id))
  const necitite = vizibile.filter((n: any) => !(n.citita_de||[]).includes(angajat.id)).length

  const stergeNotif = async (id: string) => {
    setSterse(prev => new Set(Array.from(prev).concat(id)))
    await supabase.from('notificari').delete().eq('id', id)
  }

  const stergeToate = async () => {
    const ids = vizibile.map((n: any) => n.id)
    setSterse(prev => new Set(Array.from(prev).concat(ids)))
    if (ids.length > 0) await supabase.from('notificari').delete().in('id', ids)
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:88,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5}}>Notificări</div>
            {necitite > 0 && <div style={{fontSize:12,color:'#8b8b9e',marginTop:2}}>{necitite} necitite</div>}
          </div>
          {vizibile.length > 0 && (
            <button onClick={stergeToate}
              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,padding:'6px 12px',color:'#f87171',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Șterge toate
            </button>
          )}
        </div>

        {vizibile.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:60,gap:12}}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b3b4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div style={{fontSize:16,fontWeight:600,color:'#4b4b60'}}>Nicio notificare</div>
            <div style={{fontSize:13,color:'#3b3b4f',textAlign:'center',maxWidth:240}}>
              Vei fi anunțat când șeful modifică programul.
            </div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {vizibile.map((n: any) => {
              const citita = (n.citita_de||[]).includes(angajat.id)
              const dx = swipeX[n.id] || 0
              return (
                <div key={n.id} style={{position:'relative',overflow:'hidden',borderRadius:16}}>
                  {/* Fundal rosu pentru swipe */}
                  <div style={{position:'absolute',inset:0,background:'rgba(239,68,68,0.15)',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:20,borderRadius:16}}>
                    <span style={{fontSize:18}}>🗑️</span>
                  </div>

                  {/* Cardul notificarii */}
                  <div
                    onClick={() => !citita && marcheazaCitita(n.id)}
                    onTouchStart={(e) => { touchStart.current[n.id] = e.touches[0].clientX }}
                    onTouchMove={(e) => {
                      const dx = e.touches[0].clientX - (touchStart.current[n.id]||0)
                      if (dx < 0) setSwipeX(prev => ({...prev, [n.id]: Math.max(dx,-120)}))
                    }}
                    onTouchEnd={() => {
                      if ((swipeX[n.id]||0) < -80) stergeNotif(n.id)
                      else setSwipeX(prev => ({...prev, [n.id]: 0}))
                    }}
                    style={{
                      background: citita ? '#26262e' : 'rgba(42,109,217,0.12)',
                      border: citita ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(96,165,250,0.25)',
                      borderRadius:16, padding:'14px 16px',
                      cursor: citita ? 'default' : 'pointer',
                      transform: `translateX(${dx}px)`,
                      transition: dx === 0 ? 'transform 0.3s ease' : 'none',
                      display:'flex', alignItems:'flex-start', gap:12,
                      position:'relative',
                    }}>

                    {/* Dot necitit */}
                    {!citita && (
                      <div style={{position:'absolute',top:14,right:44,width:8,height:8,background:'#60a5fa',borderRadius:'50%'}}/>
                    )}

                    <div style={{fontSize:24,flexShrink:0}}>{TIP_ICON[n.tip]||'📢'}</div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:'white',marginBottom:3}}>{n.titlu}</div>
                      {n.mesaj && <div style={{fontSize:13,color:'#8b8b9e',lineHeight:1.4}}>{n.mesaj}</div>}
                      <div style={{fontSize:11,color:'#4b4b60',marginTop:6}}>{timeAgo(n.creat_la)}</div>
                    </div>

                    {/* Buton stergere */}
                    <button
                      onClick={(e) => { e.stopPropagation(); stergeNotif(n.id) }}
                      style={{flexShrink:0,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav badge={necitite}/>
    </div>
  )
}
