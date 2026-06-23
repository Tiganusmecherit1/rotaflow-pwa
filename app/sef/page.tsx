'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile, signOut } from '@/lib/auth'

export default function SefPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nume, setNume] = useState('')

  useEffect(() => {
    getUserProfile().then(p => {
      if (!p) { router.replace('/login'); return; }
      if (!p.este_sef) { router.replace('/dashboard'); return; }
      setNume(p.nume)
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#60cdff]/30 border-t-[#60cdff] rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-900/30 border border-amber-500/20 flex items-center justify-center text-3xl mb-6">
        👑
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Bună, {nume.split(' ')[0]}!</h1>
      <p className="text-zinc-400 text-[14px] mb-8 max-w-xs">
        Contul tău are acces complet la RotaFlow. Deschide versiunea desktop pentru management complet.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <a href="https://rotaflow-app.vercel.app" target="_blank" rel="noopener noreferrer"
          className="block w-full bg-[#60cdff] text-[#1c1c1e] font-bold text-[15px] py-4 rounded-xl text-center active:scale-95 transition-all">
          Deschide versiunea completă →
        </a>

        <button onClick={async () => { await signOut(); router.replace('/login'); }}
          className="block w-full bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-semibold text-[14px] py-3.5 rounded-xl active:scale-95 transition-all">
          Deconectare
        </button>
      </div>

      <p className="text-zinc-600 text-[11px] mt-8">
        Sau bookmarkuiește rotaflow-app.vercel.app pe desktop
      </p>
    </div>
  )
}
