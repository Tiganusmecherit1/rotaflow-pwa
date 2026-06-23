'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Ture', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { href: '/luna', label: 'Lună', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/>
    </svg>
  )},
  { href: '/swap', label: 'Swap', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  )},
  { href: '/notificari', label: 'Alerte', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )},
]

export default function BottomNav({ badge }: { badge?: number }) {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#2c2c2e]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {tabs.map(tab => {
          const active = path === tab.href || path.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative
                ${active ? 'text-[#60cdff]' : 'text-zinc-500'}`}>
              {tab.href === '/notificari' && badge && badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#60cdff]"/>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
