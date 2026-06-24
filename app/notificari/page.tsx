'use client'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'acum'
  if (diff < 3600) return `${Math.floor(diff/60)} min`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}z`
}

export default function NotificariPage() {
  const { angajat, notificari, loading, marcheazaCitita } = useAuth()

  if (loading || !angajat) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>

  const necitite = notificari.filter(n => !(n.citita_de||[]).includes(angajat.id)).length

  const TIP_ICON: Record<string,string> = {
    program: '📅', swap: '🔄', sistem: '⚙️'
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:88,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5}}>Notificări</div>
            {necitite > 0 && (
              <div style={{fontSize:12,color:'#8b8b9e',marginTop:2}}>{necitite} necitite</div>
            )}
          </div>
          {necitite > 0 && (
            <button
              onClick={() => notificari.filter(n=>!(n.citita_de||[]).includes(angajat.id)).forEach(n=>marcheazaCitita(n.id))}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 12px',color:'#8b8b9e',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Marchează toate
            </button>
          )}
        </div>

        {notificari.length === 0 ? (
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
            {notificari.map(n => {
              const citita = (n.citita_de||[]).includes(angajat.id)
              return (
                <div key={n.id}
                  onClick={() => !citita && marcheazaCitita(n.id)}
                  style={{
                    background: citita ? '#26262e' : 'rgba(42,109,217,0.12)',
                    border: citita ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(96,165,250,0.25)',
                    borderRadius:16, padding:'14px 16px', cursor: citita ? 'default' : 'pointer',
                    position:'relative',
                  }}>
                  {!citita && (
                    <div style={{position:'absolute',top:14,right:14,width:8,height:8,background:'#60a5fa',borderRadius:'50%'}}/>
                  )}
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{fontSize:24,flexShrink:0}}>{TIP_ICON[n.tip]||'📢'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:'white',marginBottom:3}}>{n.titlu}</div>
                      <div style={{fontSize:13,color:'#8b8b9e',lineHeight:1.4}}>{n.mesaj}</div>
                      <div style={{fontSize:11,color:'#4b4b60',marginTop:6}}>{timeAgo(n.creat_la)}</div>
                    </div>
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
