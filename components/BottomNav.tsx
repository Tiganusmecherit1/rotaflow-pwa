'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/dashboard',
    label: 'Ture',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60cdff' : '#636366'} strokeWidth="1.7"
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
    label: 'Lună',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60cdff' : '#636366'} strokeWidth="1.7"
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60cdff' : '#636366'} strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    ),
  },
  {
    href: '/notificari',
    label: 'Alerte',
    badge: true,
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#60cdff' : '#636366'} strokeWidth="1.7"
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
    <nav className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'rgba(28,28,30,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch justify-around max-w-sm mx-auto">
        {TABS.map(tab => {
          const active = path.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 flex-1 relative">
              {tab.badge && badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-20px)] w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center z-10">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {tab.icon(active)}
              <span className="text-[10px] font-semibold" style={{ color: active ? '#60cdff' : '#636366' }}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#60cdff]"/>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
