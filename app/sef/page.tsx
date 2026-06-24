'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SefPage() {
  const router = useRouter()
  const [nume, setNume] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data } = await supabase.from('angajati').select('nume, este_sef').eq('id', session.user.id).single()
      if (!data?.este_sef) { router.replace('/dashboard'); return }
      setNume(data.nume)
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1c1c1e' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,205,255,0.2)', borderTopColor: '#60cdff', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const prenume = nume.split(' ').slice(-1)[0] || nume

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      <div className="mb-8 w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(255,214,10,0.12)', border: '1px solid rgba(255,214,10,0.25)' }}>
        <span className="text-[36px]">👑</span>
      </div>

      <h1 className="text-[28px] font-black text-white mb-2">Bună, {prenume}!</h1>
      <p className="text-[14px] mb-10 max-w-xs" style={{ color: '#8e8e93' }}>
        Contul tău de manager are acces complet. Deschide versiunea desktop pentru toate funcționalitățile.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <a href="https://rotaflow-app.vercel.app" target="_blank" rel="noopener noreferrer"
          className="block w-full text-[17px] font-bold py-4 rounded-2xl text-center active:scale-[0.98] transition-all"
          style={{ background: '#0078d4', color: 'white', boxShadow: '0 4px 24px rgba(0,120,212,0.35)' }}>
          Deschide versiunea completă →
        </a>

        <button onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
          className="w-full text-[15px] font-semibold py-4 rounded-2xl active:scale-[0.98] transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8e8e93' }}>
          Deconectare
        </button>
      </div>
    </div>
  )
}
