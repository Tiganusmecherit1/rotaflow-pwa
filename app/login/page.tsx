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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#1c1c1e]">

      {/* Logo */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-[#60cdff]/10 border border-[#60cdff]/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60cdff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2.5"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="14" x2="13" y2="14"/>
            <line x1="8" y1="18" x2="11" y2="18"/>
          </svg>
        </div>
        <h1 className="text-[28px] font-black text-white tracking-tight">RotaFlow</h1>
        <p className="text-zinc-500 text-[14px]">Tura ta, oriunde ești</p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="w-full max-w-[340px] space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="adresa@email.com"
            required
            autoComplete="email"
            className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-2xl px-4 py-4 text-[16px] text-white placeholder:text-zinc-600 outline-none focus:border-[#60cdff]/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
            Parolă
          </label>
          <input
            type="password"
            value={parola}
            onChange={e => setParola(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-2xl px-4 py-4 text-[16px] text-white placeholder:text-zinc-600 outline-none focus:border-[#60cdff]/40 transition-colors"
          />
        </div>

        {err && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-[13px] text-center">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#60cdff] text-[#111] font-bold text-[17px] py-4 rounded-2xl
            active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                Se conectează...
              </span>
            : 'Conectare'}
        </button>
      </form>
    </div>
  )
}
