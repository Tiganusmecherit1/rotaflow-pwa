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
    <div style={{
      minHeight: '100vh', background: '#1a1a1f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'linear-gradient(145deg, #2a6dd9, #1a4fa0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(42,109,217,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}>
          <span style={{ color: 'white', fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>R</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>RotaFlow</div>
          <div style={{ fontSize: 13, color: '#8b8b9e', marginTop: 2 }}>Tura ta, oriunde ești</div>
        </div>
      </div>

      {/* Card form */}
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
        <div style={{
          background: '#26262e', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b8b9e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="adresa@email.com" required autoComplete="email"
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'white', fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b8b9e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Parolă</div>
            <input
              type="password" value={parola} onChange={e => setParola(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'white', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {err && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: '10px 16px',
            color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12,
          }}>{err}</div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
          fontSize: 16, fontWeight: 700, color: 'white', fontFamily: 'inherit',
          background: loading ? 'rgba(42,109,217,0.5)' : 'linear-gradient(145deg, #2a6dd9, #1a4fa0)',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(42,109,217,0.4)',
          transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Conectare...' : 'Conectare'}
        </button>
      </form>
    </div>
  )
}
