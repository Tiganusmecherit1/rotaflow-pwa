'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile, UserProfile } from '@/lib/auth'
import BottomNav from '@/components/BottomNav'

interface Swap { id: string; aId: number; aData: string; bId: number; bData: string; nota: string }
interface Angajat { id: number; uuid?: string; nume: string; pozitie_rotatie: number }

export default function SwapPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile|null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [swapuri, setSwapuri] = useState<Swap[]>([])
  const [angajatMeu, setAngajatMeu] = useState<Angajat|null>(null)
  const [loading, setLoading] = useState(true)

  // Form nou swap
  const [dataA, setDataA] = useState('')
  const [destId, setDestId] = useState('')
  const [dataB, setDataB] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{type:'ok'|'err',text:string}|null>(null)

  useEffect(() => {
    getUserProfile().then(p => {
      if (!p) { router.replace('/login'); return; }
      if (p.este_sef) { router.replace('/sef'); return; }
      setProfile(p)
      fetch('/api/data').then(r=>r.json()).then(data => {
        const ec: Angajat[] = (data.angajati||[]).map((a:any)=>({id:a.id,uuid:a.uuid,nume:a.nume,pozitie_rotatie:a.pozitie_rotatie}))
        setEchipa(ec)
        setAngajatMeu(ec.find(a=>a.uuid===p.uuid)||null)
        setSwapuri(data.swapuri||[])
        setLoading(false)
      })
    })
  }, [router])

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!angajatMeu || !destId || !dataA || !dataB) return
    setSaving(true)
    setMsg(null)

    const res = await fetch('/api/swap', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ aId: angajatMeu.id, aData: dataA, bId: Number(destId), bData: dataB, nota })
    })
    if (res.ok) {
      setMsg({type:'ok', text:'Cerere de swap trimisă!'})
      setDataA(''); setDataB(''); setDestId(''); setNota('')
      // Reload swapuri
      fetch('/api/data').then(r=>r.json()).then(d=>setSwapuri(d.swapuri||[]))
    } else {
      setMsg({type:'err', text:'Eroare la trimitere'})
    }
    setSaving(false)
  }

  const colegii = echipa.filter(a => a.id !== angajatMeu?.id)

  if (loading) return <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#60cdff]/30 border-t-[#60cdff] rounded-full animate-spin"/></div>

  const swapuriMele = swapuri.filter(s => s.aId === angajatMeu?.id || s.bId === angajatMeu?.id)

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-24">
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-black text-white">Cerere Swap</h1>
        <p className="text-zinc-500 text-sm mt-1">Schimbă o tură cu un coleg</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSwap} className="px-5 space-y-4 mb-8">
        <div className="bg-[#2c2c2e] border border-white/[0.07] rounded-2xl p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ziua mea</label>
            <input type="date" value={dataA} onChange={e=>setDataA(e.target.value)} required
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#60cdff]/50"/>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Coleg</label>
            <select value={destId} onChange={e=>setDestId(e.target.value)} required
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#60cdff]/50">
              <option value="">Alege coleg...</option>
              {colegii.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ziua colegului</label>
            <input type="date" value={dataB} onChange={e=>setDataB(e.target.value)} required
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#60cdff]/50"/>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Notă (opțional)</label>
            <input type="text" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Motivul schimbului..."
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#60cdff]/50 placeholder:text-zinc-600"/>
          </div>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center font-semibold ${msg.type==='ok'?'bg-emerald-900/30 border border-emerald-500/20 text-emerald-300':'bg-red-900/30 border border-red-500/20 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-[#60cdff] text-[#1c1c1e] font-bold text-[16px] py-4 rounded-xl active:scale-95 transition-all disabled:opacity-50">
          {saving ? 'Se trimite...' : 'Trimite cerere'}
        </button>
      </form>

      {/* Istoricul swap-urilor mele */}
      {swapuriMele.length > 0 && (
        <div className="px-5">
          <h2 className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Swap-uri active</h2>
          <div className="space-y-2">
            {swapuriMele.map(s => {
              const coleg = echipa.find(a => a.id === (s.aId === angajatMeu?.id ? s.bId : s.aId))
              const dataEu = s.aId === angajatMeu?.id ? s.aData : s.bData
              const dataLui = s.aId === angajatMeu?.id ? s.bData : s.aData
              return (
                <div key={s.id} className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">🔄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">
                      {dataEu} ↔ {dataLui}
                    </p>
                    <p className="text-[11px] text-zinc-400">cu {coleg?.nume}</p>
                    {s.nota && <p className="text-[11px] text-zinc-500 italic">"{s.nota}"</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
