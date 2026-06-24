'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Angajat } from '@/lib/rotatie'

interface AuthCtx {
  angajat: Angajat | null
  echipa: Angajat[]
  loading: boolean
  eroare: string | null
}

const Ctx = createContext<AuthCtx>({ angajat: null, echipa: [], loading: true, eroare: null })
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [angajat, setAngajat] = useState<Angajat | null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [loading, setLoading] = useState(true)
  const [eroare, setEroare] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session }, error: sessErr } = await supabase.auth.getSession()

        if (sessErr || !session) {
          if (pathname !== '/login') router.replace('/login')
          setLoading(false)
          return
        }

        // Incarcam angajatii
        const { data: sbAngajati, error: errA } = await supabase
          .from('angajati')
          .select('*')
          .order('pozitie_rotatie')

        if (errA) {
          console.error('Eroare angajati:', errA)
          setEroare(`Eroare DB: ${errA.message}`)
          setLoading(false)
          return
        }

        const { data: sbConcedii } = await supabase.from('concedii').select('*')
        const { data: sbAbsente } = await supabase.from('absente').select('*')

        const lista = sbAngajati || []

        const ec: Angajat[] = lista
          .filter((a: any) => !a.este_sef)
          .sort((a: any, b: any) => (a.pozitie_rotatie || 0) - (b.pozitie_rotatie || 0))
          .map((a: any) => ({
            id: a.pozitie_rotatie || 0,
            uuid: a.id,
            nume: a.nume || 'Necunoscut',
            zile_co: a.zile_co || 0,
            este_sef: !!a.este_sef,
            pozitie_rotatie: a.pozitie_rotatie || 0,
            concedii: (sbConcedii || [])
              .filter((c: any) => c.angajat_id === a.id)
              .map((c: any) => ({ s: c.data_start, e: c.data_sfarsit })),
            absente: (sbAbsente || [])
              .filter((ab: any) => ab.angajat_id === a.id)
              .map((ab: any) => ({ data: ab.data_start, tip: ab.tip, zile: ab.zile })),
          }))

        setEchipa(ec)

        // Gasim userul curent
        const mySelf = lista.find((a: any) => a.id === session.user.id)

        if (mySelf?.este_sef) {
          router.replace('/sef')
          setLoading(false)
          return
        }

        // Cautam in ec dupa uuid
        let selfAdaptat = ec.find(a => a.uuid === session.user.id) ?? null

        // Fallback: daca nu gasim dupa uuid, cautam dupa email in metadata
        if (!selfAdaptat && mySelf) {
          selfAdaptat = {
            id: mySelf.pozitie_rotatie || 0,
            uuid: mySelf.id,
            nume: mySelf.nume || session.user.email || 'Tu',
            zile_co: mySelf.zile_co || 0,
            este_sef: false,
            pozitie_rotatie: mySelf.pozitie_rotatie || 0,
            concedii: (sbConcedii || [])
              .filter((c: any) => c.angajat_id === mySelf.id)
              .map((c: any) => ({ s: c.data_start, e: c.data_sfarsit })),
            absente: (sbAbsente || [])
              .filter((ab: any) => ab.angajat_id === mySelf.id)
              .map((ab: any) => ({ data: ab.data_start, tip: ab.tip, zile: ab.zile })),
          }
        }

        if (!selfAdaptat) {
          console.warn('User autentificat dar nu gasit in tabel angajati:', session.user.id)
          setEroare(`Contul tău (${session.user.email}) nu are un profil de angajat asociat.`)
        }

        setAngajat(selfAdaptat)
        setLoading(false)

      } catch (e: any) {
        console.error('AuthProvider error:', e)
        setEroare(`Eroare neașteptată: ${e?.message || 'necunoscută'}`)
        setLoading(false)
      }
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
      if (event === 'SIGNED_IN') load()
    })
    return () => sub.subscription.unsubscribe()
  }, [pathname]) // eslint-disable-line

  return <Ctx.Provider value={{ angajat, echipa, loading, eroare }}>{children}</Ctx.Provider>
}
