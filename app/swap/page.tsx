'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

interface Swap { id: string; aId: number; aData: string; bId: number; bData: string; nota: string }

export default function SwapPage() {
  const { angajat, echipa, loading } = useAuth()
  const [swapuri, setSwapuri] = useState<Swap[]>([])
  const [dataA, setDataA] = useState('')
  const [destId, setDestId] = useState('')
  const [dataB, setDataB] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ok:boolean,text:string}|null>(null)

  useEffect(() => {
    if (!angajat) return
    fetch('/api/data').then(r=>r.json()).then(d => setSwapuri(d.swapuri||[]))
  }, [angajat])

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!angajat || !destId || !dataA || !dataB) return
    setSaving(true); setMsg(null)
    const res = await fetch('/api/swap', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ aId: angajat.id, aData: dataA, bId: Number(destId), bData: dataB, nota })
    })
    if (res.ok) {
      setMsg({ok:true,text:'Cerere trimisă!'})
      setDataA(''); setDataB(''); setDestId(''); setNota('')
      fetch('/api/data').then(r=>r.json()).then(d=>setSwapuri(d.swapuri||[]))
    } else {
      setMsg({ok:false,text:'Eroare la trimitere'})
    }
    setSaving(false)
  }

  const colegii = echipa.filter(a => a.id !== angajat?.id)
  const swapuriMele = swapuri.filter(s => s.aId===angajat?.id || s.bId===angajat?.id)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1c1c1e' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,205,255,0.2)', borderTopColor: '#60cdff', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#1c1c1e', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: '90px' }}>

      <div className="px-5 pt-12 pb-6">
        <h1 className="text-[26px] font-black text-white">Cerere Swap</h1>
        <p className="text-[13px] mt-1" style={{ color: '#8e8e93' }}>Schimbă o tură cu un coleg</p>
      </div>

      <form onSubmit={handleSwap} className="px-5 space-y-3">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label:'Ziua mea', type:'date', value:dataA, onChange:setDataA },
          ].map(f => (
            <div key={f.label} className="px-4 py-3.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <label className="block text-[10px] font-semibold mb-1.5" style={{ color:'#8e8e93', letterSpacing:'0.06em', textTransform:'uppercase' }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e=>f.onChange(e.target.value)} required
                className="w-full bg-transparent text-[15px] text-white outline-none"/>
            </div>
          ))}
          <div className="px-4 py-3.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color:'#8e8e93', letterSpacing:'0.06em', textTransform:'uppercase' }}>Coleg</label>
            <select value={destId} onChange={e=>setDestId(e.target.value)} required
              className="w-full bg-transparent text-[15px] text-white outline-none">
              <option value="" style={{ background:'#2c2c2e' }}>Alege coleg...</option>
              {colegii.map(c => <option key={c.id} value={c.id} style={{ background:'#2c2c2e' }}>{c.nume}</option>)}
            </select>
          </div>
          <div className="px-4 py-3.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color:'#8e8e93', letterSpacing:'0.06em', textTransform:'uppercase' }}>Ziua colegului</label>
            <input type="date" value={dataB} onChange={e=>setDataB(e.target.value)} required
              className="w-full bg-transparent text-[15px] text-white outline-none"/>
          </div>
          <div className="px-4 py-3.5">
            <label className="block text-[10px] font-semibold mb-1.5" style={{ color:'#8e8e93', letterSpacing:'0.06em', textTransform:'uppercase' }}>Notă (opțional)</label>
            <input type="text" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Motivul schimbului..."
              className="w-full bg-transparent text-[15px] text-white placeholder-zinc-600 outline-none"/>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-3 text-center text-[13px] font-medium"
            style={{ background: msg.ok ? 'rgba(76,217,100,0.12)' : 'rgba(255,59,48,0.12)', border: `1px solid ${msg.ok ? 'rgba(76,217,100,0.25)' : 'rgba(255,59,48,0.25)'}`, color: msg.ok ? '#4cd964' : '#ff6b6b' }}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full text-[17px] font-bold py-4 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: '#0078d4', color: 'white' }}>
          {saving ? 'Se trimite...' : 'Trimite cerere'}
        </button>
      </form>

      {swapuriMele.length > 0 && (
        <div className="px-5 mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:'#8e8e93' }}>Swap-uri active</h2>
          <div className="space-y-2">
            {swapuriMele.map(s => {
              const coleg = echipa.find(a => a.id===(s.aId===angajat?.id?s.bId:s.aId))
              const dataEu = s.aId===angajat?.id?s.aData:s.bData
              const dataLui = s.aId===angajat?.id?s.bData:s.aData
              return (
                <div key={s.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background:'rgba(255,214,10,0.08)', border:'1px solid rgba(255,214,10,0.15)' }}>
                  <span className="text-[22px]">🔄</span>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{dataEu} ↔ {dataLui}</p>
                    <p className="text-[12px] mt-0.5" style={{ color:'#8e8e93' }}>cu {coleg?.nume}</p>
                    {s.nota && <p className="text-[11px] mt-0.5 italic" style={{ color:'#636366' }}>„{s.nota}"</p>}
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
