'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/dashboard',
    label: 'Tura mea',
    icon: (active: boolean) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60a5fa' : '#6b6b80'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2.5"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/luna',
    label: 'Program',
    icon: (active: boolean) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60a5fa' : '#6b6b80'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2.5"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="14" x2="16" y2="14"/>
        <line x1="8" y1="18" x2="12" y2="18"/>
      </svg>
    ),
  },
  {
    href: '/swap',
    label: 'Swap',
    icon: (active: boolean) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60a5fa' : '#6b6b80'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    ),
  },
  {
    href: '/notificari',
    label: 'Notificări',
    badge: true,
    icon: (active: boolean) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60a5fa' : '#6b6b80'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
]

export default function BottomNav({ badge = 0 }: { badge?: number }) {
  const path = usePathname()
  return (
    <nav style={{
      position:'fixed',bottom:0,left:0,right:0,zIndex:50,
      background:'rgba(26,26,31,0.96)',
      backdropFilter:'blur(20px)',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      paddingBottom:'env(safe-area-inset-bottom,0px)',
    }}>
      <div style={{display:'flex',maxWidth:430,margin:'0 auto'}}>
        {TABS.map(tab => {
          const active = path.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex:1,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              gap:3,padding:'9px 0',textDecoration:'none',position:'relative',
            }}>
              {tab.badge && badge > 0 && (
                <span style={{
                  position:'absolute',top:7,right:'calc(50% - 18px)',
                  width:16,height:16,background:'#ef4444',borderRadius:'50%',
                  fontSize:9,fontWeight:700,color:'white',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {tab.icon(active)}
              <span style={{fontSize:10,fontWeight:active?600:500,color:active?'#60a5fa':'#6b6b80'}}>
                {tab.label}
              </span>
              {active && <span style={{position:'absolute',bottom:2,width:20,height:2,borderRadius:1,background:'#60a5fa'}}/>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
