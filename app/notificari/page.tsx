'use client'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'

export default function NotificariPage() {
  const { loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1c1c1e' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,205,255,0.2)', borderTopColor: '#60cdff', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: '90px' }}>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-[26px] font-black text-white">Notificări</h1>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <span className="text-[56px] mb-4">🔔</span>
        <p className="text-[16px] font-semibold text-white mb-2">Nicio notificare</p>
        <p className="text-[13px]" style={{ color: '#636366' }}>
          Vei fi anunțat când apar modificări în rotație sau cereri de swap.
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
