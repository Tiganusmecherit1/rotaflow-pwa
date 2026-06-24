'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [parola, setParola] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: parola })
    if (error) { setErr('Email sau parolă incorecte'); setLoading(false); return }
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #60cdff, #0078d4, transparent)' }}/>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-14">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(96,205,255,0.15), rgba(0,120,212,0.25))', border: '1px solid rgba(96,205,255,0.25)', boxShadow: '0 0 40px rgba(96,205,255,0.12)' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#60cdff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="13" y2="14"/>
                <line x1="8" y1="18" x2="11" y2="18"/>
              </svg>
            </div>
            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-3xl blur-xl opacity-30"
              style={{ background: 'radial-gradient(circle, #60cdff, transparent)' }}/>
          </div>
          <div className="text-center">
            <h1 className="text-[32px] font-black tracking-tight text-white">RotaFlow</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#636366' }}>Tura ta, oriunde ești</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="w-full max-w-[340px] space-y-3">

          <div className="rounded-2xl overflow-hidden" style={{ background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Email */}
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="block text-[10px] font-semibold mb-1.5" style={{ color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="adresa@email.com"
                required
                autoComplete="email"
                className="w-full bg-transparent text-[16px] text-white placeholder-zinc-600 outline-none"
              />
            </div>
            {/* Parola */}
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-semibold mb-1.5" style={{ color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Parolă
              </label>
              <input
                type="password"
                value={parola}
                onChange={e => setParola(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-transparent text-[16px] text-white placeholder-zinc-600 outline-none"
              />
            </div>
          </div>

          {err && (
            <div className="rounded-xl px-4 py-3 text-center text-[13px] font-medium"
              style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)', color: '#ff6b6b' }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 text-[17px] font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: loading ? 'rgba(0,120,212,0.6)' : '#0078d4', color: 'white', boxShadow: '0 4px 24px rgba(0,120,212,0.35)' }}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }}/>
                  Conectare...
                </span>
              : 'Conectare'}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </form>
      </div>
    </div>
  )
}
