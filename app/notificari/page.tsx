'use client'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'

export default function NotificariPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{minHeight:'100vh',background:'#1a1a1f'}}/>

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1f',paddingBottom:80,paddingTop:'env(safe-area-inset-top,0px)'}}>
      <div style={{padding:'12px 16px 0'}}>
        <div style={{fontSize:22,fontWeight:800,color:'white',letterSpacing:-0.5,marginBottom:24}}>Notificări</div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:60,gap:12}}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b3b4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{fontSize:16,fontWeight:600,color:'#4b4b60'}}>Nicio notificare</div>
          <div style={{fontSize:13,color:'#3b3b4f',textAlign:'center',maxWidth:240}}>
            Vei fi anunțat când apar modificări în rotație.
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
