'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile, UserProfile } from '@/lib/auth'
import BottomNav from '@/components/BottomNav'

interface Concediu { s: string; e: string }
interface Angajat {
  id: number; uuid?: string; nume: string; zileCO: number
  concedii: Concediu[]; absente: { data: string; tip: string }[]
  este_sef: boolean; pozitie_rotatie: number
}

const parseD = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
const fmtDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const LUNI_RO = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']
const ZILE_SCURT = ['L','M','M','J','V','S','D']

function inCO(d: Date, m: Angajat): boolean {
  return m.concedii.some(c => { const s=parseD(c.s),e=parseD(c.e); e.setHours(23,59,59); return d>=s&&d<=e; })
}

function getTura(d: Date, angajat: Angajat, toataEchipa: Angajat[]): string {
  if (angajat.absente.some(a => a.data === fmtDateInput(d))) return 'AN'
  if (inCO(d, angajat)) return 'CO'
  const activi = toataEchipa.filter(a => !inCO(d,a) && !angajat.absente.some(ab => ab.data === fmtDateInput(d)))
  const poz = activi.findIndex(a => a.id === angajat.id)
  if (poz === -1) return 'L'
  const ref = new Date(2026,0,1)
  const dayIdx = Math.floor((d.getTime()-ref.getTime())/86400000)
  const n = activi.length
  const sec = ((dayIdx+poz)%n+n)%n
  if (sec===0||sec===1) return 'D'
  if (sec===2) return 'S'
  return 'L'
}

const CELL_STYLE: Record<string,string> = {
  D: 'bg-sky-800/60 text-sky-100 border-sky-400/30',
  S: 'bg-purple-800/60 text-purple-100 border-purple-400/30',
  L: 'bg-transparent text-zinc-600 border-transparent',
  CO: 'bg-rose-800/50 text-rose-200 border-rose-400/20',
  AN: 'bg-red-800/50 text-red-200 border-red-400/20',
}
const CELL_ICON: Record<string,string> = { D:'☀', S:'🌙', CO:'🏖', AN:'🏥', L:'' }

export default function LunaPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile|null>(null)
  const [angajat, setAngajat] = useState<Angajat|null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [lunaOffset, setLunaOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const lunaStart = new Date(now.getFullYear(), now.getMonth() + lunaOffset, 1)
  const lunaEnd = new Date(lunaStart.getFullYear(), lunaStart.getMonth()+1, 0)

  useEffect(() => {
    getUserProfile().then(p => {
      if (!p) { router.replace('/login'); return; }
      if (p.este_sef) { router.replace('/sef'); return; }
      setProfile(p)
      fetch('/api/data').then(r=>r.json()).then(data => {
        const ec: Angajat[] = (data.angajati||[]).map((a: any) => ({
          id:a.id,uuid:a.uuid,nume:a.nume,zileCO:a.zile_co,
          este_sef:a.este_sef,pozitie_rotatie:a.pozitie_rotatie,
          concedii:data.concedii?.filter((c:any)=>c.angajat_id===a.id).map((c:any)=>({s:c.start,e:c.end}))||[],
          absente:data.absente?.filter((ab:any)=>ab.angajat_id===a.id)||[]
        }))
        setEchipa(ec)
        setAngajat(ec.find(a=>a.uuid===p.uuid)||null)
        setLoading(false)
      })
    })
  }, [router])

  if (loading) return <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#60cdff]/30 border-t-[#60cdff] rounded-full animate-spin"/></div>
  if (!angajat) return null

  // Construim zilele lunii
  const firstDow = (lunaStart.getDay()+6)%7 // 0=Lu
  const totalCells = firstDow + lunaEnd.getDate()
  const cells: (Date|null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({length:lunaEnd.getDate()},(_,i)=>new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i+1))
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const azi = new Date(); azi.setHours(0,0,0,0)

  // Stats luna
  let nD=0,nS=0,nCO=0,nL=0
  for (let i=1;i<=lunaEnd.getDate();i++) {
    const d = new Date(lunaStart.getFullYear(),lunaStart.getMonth(),i)
    const t = getTura(d,angajat,echipa)
    if(t==='D') nD++; else if(t==='S') nS++; else if(t==='CO') nCO++; else nL++
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-white">Calendar lunar</h1>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={()=>setLunaOffset(o=>o-1)} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-[15px] font-bold text-white capitalize flex-1 text-center">
            {LUNI_RO[lunaStart.getMonth()]} {lunaStart.getFullYear()}
          </span>
          <button onClick={()=>setLunaOffset(o=>o+1)} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-4 grid grid-cols-4 gap-2">
        {[['D','☀',nD,'sky'],['S','🌙',nS,'purple'],['CO','🏖',nCO,'rose'],['L','○',nL,'zinc']].map(([t,ic,n,c])=>(
          <div key={String(t)} className={`bg-${c}-900/20 border border-${c}-500/20 rounded-xl p-2.5 text-center`}>
            <p className="text-lg">{ic}</p>
            <p className={`text-xl font-black text-${c}-300`}>{n}</p>
            <p className={`text-[9px] text-${c}-500 font-semibold`}>{t==='D'?'Dim':t==='S'?'Seară':t==='CO'?'CO':'Liber'}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-4">
        <div className="bg-[#2c2c2e] border border-white/[0.07] rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {ZILE_SCURT.map((z,i)=>(
              <div key={i} className={`text-center py-2.5 text-[11px] font-bold ${i>=5?'text-zinc-600':'text-zinc-500'}`}>{z}</div>
            ))}
          </div>
          {/* Weeks */}
          {Array.from({length:cells.length/7},(_,wi)=>(
            <div key={wi} className="grid grid-cols-7 border-b border-white/[0.04] last:border-0">
              {cells.slice(wi*7,(wi+1)*7).map((d,di)=>{
                if (!d) return <div key={di} className="p-1"/>
                const t = getTura(d,angajat,echipa)
                const isToday = fmtDateInput(d)===fmtDateInput(azi)
                const style = CELL_STYLE[t]??CELL_STYLE.L
                return (
                  <div key={di} className={`p-1`}>
                    <div className={`rounded-lg border flex flex-col items-center py-1.5 ${style} ${isToday?'ring-1 ring-[#60cdff]':''}`}>
                      <span className={`text-[10px] font-bold ${isToday?'text-[#60cdff]':''}`}>{d.getDate()}</span>
                      <span className="text-[11px]">{CELL_ICON[t]||''}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
