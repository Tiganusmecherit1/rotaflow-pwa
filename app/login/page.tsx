'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [parola, setParola] = useState('')
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setEroare('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: parola })

    if (error) {
      setEroare('Email sau parolă incorectă')
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#60cdff]/10 border border-[#60cdff]/20 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60cdff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">RotaFlow</h1>
        <p className="text-zinc-500 text-sm mt-1">Gestiune ture echipă</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nume@email.com"
            required
            className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-[15px] outline-none focus:border-[#60cdff]/50 transition-all placeholder:text-zinc-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Parolă</label>
          <input
            type="password"
            value={parola}
            onChange={e => setParola(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-[15px] outline-none focus:border-[#60cdff]/50 transition-all placeholder:text-zinc-600"
          />
        </div>

        {eroare && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
            {eroare}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#60cdff] text-[#1c1c1e] font-bold text-[16px] py-4 rounded-xl hover:bg-[#60cdff]/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#1c1c1e]/30 border-t-[#1c1c1e] rounded-full animate-spin"/>
              Se conectează...
            </span>
          ) : 'Conectare'}
        </button>
      </form>
    </div>
  )
}
