'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Angajat } from '@/lib/rotatie'

export interface Override {
  id: string; angajat_id: number; data: string; tura: string; expira_la: string; tip: string
}

export interface Notificare {
  id: string; titlu: string; mesaj: string; tip: string; creat_la: string; citita_de: number[]
}

// Tura mirror — vine direct din desktop
export interface TuraMirror {
  angajat_id: number; data: string; tura: string
}

interface AuthCtx {
  angajat: Angajat | null
  echipa: Angajat[]
  tureMirror: TuraMirror[]
  notificari: Notificare[]
  setNotificari: React.Dispatch<React.SetStateAction<Notificare[]>>
  loading: boolean
  eroare: string | null
  marcheazaCitita: (notifId: string) => void
}

const Ctx = createContext<AuthCtx>({
  angajat: null, echipa: [], tureMirror: [], notificari: [], setNotificari: () => {},
  loading: true, eroare: null, marcheazaCitita: () => {}
})
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [angajat, setAngajat] = useState<Angajat | null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [tureMirror, setTureMirror] = useState<TuraMirror[]>([])
  const [notificari, setNotificari] = useState<Notificare[]>([])
  const [loading, setLoading] = useState(true)
  const [eroare, setEroare] = useState<string | null>(null)

  const loadTureMirror = useCallback(async () => {
    const azi = new Date()
    azi.setDate(azi.getDate() - 7)
    const aziStr = azi.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('ture_mirror')
      .select('angajat_id, data, tura')
      .gte('data', aziStr)
    console.log('ture_mirror:', data?.length, error)
    if (data) setTureMirror(data)
  }, [])

  const loadNotificari = useCallback(async (angajatId?: number, angajatUuid?: string) => {
    let query = supabase
      .from('notificari')
      .select('id, titlu, descriere, tip, citita, created_at, destinatar_id')
      .order('created_at', { ascending: false })
      .limit(50)

    if (angajatUuid) query = query.eq('destinatar_id', angajatUuid)

    const { data, error } = await query
    console.log('notificari:', data?.length, error)
    if (data) {
      setNotificari(data.map((n: any) => ({
        id: n.id,
        titlu: n.titlu || 'Notificare',
        mesaj: n.descriere || '',
        tip: n.tip || 'swap_primit',
        creat_la: n.created_at,
        citita_de: n.citita ? [angajatId ?? 0] : [],
      })))
    }
  }, [])

  const marcheazaCitita = useCallback(async (notifId: string) => {
    setNotificari(prev => prev.map(n =>
      n.id === notifId ? { ...n, citita_de: [1] } : n
    ))
    await supabase.from('notificari').update({ citita: true }).eq('id', notifId)
  }, []) // fara dependinte

  useEffect(() => {
    async function load() {
      try {
        const { data: { session }, error: sessErr } = await supabase.auth.getSession()
        if (sessErr || !session) {
          if (pathname !== '/login') router.replace('/login')
          setLoading(false); return
        }

        const [{ data: sbAngajati, error: errA }, { data: sbConcedii }, { data: sbAbsente }] =
          await Promise.all([
            supabase.from('angajati').select('*').order('pozitie_rotatie'),
            supabase.from('concedii').select('*'),
            supabase.from('absente').select('*'),
          ])

        if (errA) { setEroare(`Eroare DB: ${errA.message}`); setLoading(false); return }

        const lista = sbAngajati || []
        const ec: Angajat[] = lista
          .filter((a: any) => !a.este_sef)
          .sort((a: any, b: any) => (a.pozitie_rotatie||0) - (b.pozitie_rotatie||0))
          .map((a: any) => ({
            id: a.pozitie_rotatie || 0,
            uuid: a.id,
            nume: a.nume || 'Necunoscut',
            zile_co: a.zile_co || 0,
            este_sef: !!a.este_sef,
            pozitie_rotatie: a.pozitie_rotatie || 0,
            concedii: (sbConcedii||[]).filter((c:any)=>c.angajat_id===a.id).map((c:any)=>({s:c.data_start,e:c.data_sfarsit})),
            absente: (sbAbsente||[]).filter((ab:any)=>ab.angajat_id===a.id).map((ab:any)=>({data:ab.data_start,tip:ab.tip,zile:ab.zile})),
          }))

        setEchipa(ec)

        const mySelf = lista.find((a: any) => a.id === session.user.id)
        if (mySelf?.este_sef) { router.replace('/sef'); setLoading(false); return }

        let selfAdaptat = ec.find(a => a.uuid === session.user.id) ?? null
        if (!selfAdaptat && mySelf) {
          selfAdaptat = {
            id: mySelf.pozitie_rotatie||0, uuid: mySelf.id,
            nume: mySelf.nume||session.user.email||'Tu',
            zile_co: mySelf.zile_co||0, este_sef: false,
            pozitie_rotatie: mySelf.pozitie_rotatie||0,
            concedii: (sbConcedii||[]).filter((c:any)=>c.angajat_id===mySelf.id).map((c:any)=>({s:c.data_start,e:c.data_sfarsit})),
            absente: (sbAbsente||[]).filter((ab:any)=>ab.angajat_id===mySelf.id).map((ab:any)=>({data:ab.data_start,tip:ab.tip,zile:ab.zile})),
          }
        }

        if (!selfAdaptat) setEroare(`Contul tău (${session.user.email}) nu are un profil de angajat asociat.`)
        setAngajat(selfAdaptat)

        await Promise.all([loadTureMirror(), loadNotificari(selfAdaptat?.id, session.user.id)])
        setLoading(false)

      } catch (e: any) {
        setEroare(`Eroare: ${e?.message||'necunoscută'}`)
        setLoading(false)
      }
    }

    load()

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
      if (event === 'SIGNED_IN') load()
    })

    // Realtime — ture_mirror (debounced - nu reincarcam la fiecare rand)
    let mirrorTimer: ReturnType<typeof setTimeout> | null = null
    const mirrorSub = supabase
      .channel('ture-mirror-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ture_mirror' },
        () => {
          if (mirrorTimer) clearTimeout(mirrorTimer)
          mirrorTimer = setTimeout(() => loadTureMirror(), 2000)
        }
      ).subscribe()

    // Realtime — notificari
    const notifSub = supabase
      .channel('notificari-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificari' },
        (payload) => {
          const n = payload.new as any
          // Adaugam doar daca e pentru userul curent
          setAngajat(crtAngajat => {
            if (!crtAngajat) return crtAngajat
            if (n.destinatar_id && n.destinatar_id !== crtAngajat.uuid) return crtAngajat
            setNotificari(prev => [{
              id: n.id,
              titlu: n.titlu || 'Notificare',
              mesaj: n.descriere || '',
              tip: n.tip || 'program',
              creat_la: n.created_at,
              citita_de: [],
            }, ...prev])
            return crtAngajat
          })
        }
      ).subscribe()

    return () => {
      authSub.subscription.unsubscribe()
      supabase.removeChannel(mirrorSub)
      supabase.removeChannel(notifSub)
    }
  }, [pathname, loadTureMirror, loadNotificari]) // eslint-disable-line

  return (
    <Ctx.Provider value={{ angajat, echipa, tureMirror, notificari, setNotificari, loading, eroare, marcheazaCitita }}>
      {children}
    </Ctx.Provider>
  )
}
