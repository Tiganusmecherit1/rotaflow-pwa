'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/auth'
import BottomNav from '@/components/BottomNav'

interface Notificare {
  id: string
  tip: 'CO' | 'SWAP' | 'INFO'
  titlu: string
  mesaj: string
  data: string
  citita: boolean
}

export default function NotificariPage() {
  const router = useRouter()
  const [notificari, setNotificari] = useState<Notificare[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserProfile().then(p => {
      if (!p) { router.replace('/login'); return; }
      if (p.este_sef) { router.replace('/sef'); return; }

      // Notificari statice pentru moment — pot fi extinse cu tabel Supabase
      const mock: Notificare[] = [
        {
          id: '1', tip: 'INFO', citita: false,
          titlu: 'Rotație actualizată',
          mesaj: 'Tura săptămânii 03-09 Aug a fost modificată de manager.',
          data: new Date().toISOString()
        },
      ]
      setNotificari(mock)
      setLoading(false)
    })
  }, [router])

  const TIP_ICON: Record<string,string> = { CO:'🏖', SWAP:'🔄', INFO:'ℹ️' }
  const TIP_COLOR: Record<string,string> = {
    CO: 'bg-rose-900/30 border-rose-500/20',
    SWAP: 'bg-amber-900/30 border-amber-500/20',
    INFO: 'bg-sky-900/30 border-sky-500/20'
  }

  const necitite = notificari.filter(n => !n.citita).length

  if (loading) return <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#60cdff]/30 border-t-[#60cdff] rounded-full animate-spin"/></div>

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-24">
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Notificări</h1>
          {necitite > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              {necitite} noi
            </span>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {notificari.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-zinc-400 font-semibold">Nicio notificare</p>
            <p className="text-zinc-600 text-sm mt-1">Vei fi anunțat când apar modificări</p>
          </div>
        ) : (
          notificari.map(n => (
            <div key={n.id} className={`rounded-2xl border p-4 ${TIP_COLOR[n.tip]} ${!n.citita ? 'ring-1 ring-white/10' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{TIP_ICON[n.tip]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white text-[14px]">{n.titlu}</p>
                    {!n.citita && <span className="w-2 h-2 rounded-full bg-[#60cdff] flex-shrink-0"/>}
                  </div>
                  <p className="text-zinc-400 text-[13px] mt-1">{n.mesaj}</p>
                  <p className="text-zinc-600 text-[11px] mt-2">
                    {new Date(n.data).toLocaleDateString('ro-RO', {day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav badge={necitite} />
    </div>
  )
}
