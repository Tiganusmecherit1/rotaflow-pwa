'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Angajat } from '@/lib/rotatie'

interface AuthCtx {
  angajat: Angajat | null
  echipa: Angajat[]
  loading: boolean
}

const Ctx = createContext<AuthCtx>({ angajat: null, echipa: [], loading: true })
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [angajat, setAngajat] = useState<Angajat | null>(null)
  const [echipa, setEchipa] = useState<Angajat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (pathname !== '/login') router.replace('/login')
        setLoading(false)
        return
      }

      const [{ data: sbAngajati }, { data: sbConcedii }, { data: sbAbsente }] = await Promise.all([
        supabase.from('angajati').select('*').order('pozitie_rotatie'),
        supabase.from('concedii').select('*'),
        supabase.from('absente').select('*'),
      ])

      const ec: Angajat[] = (sbAngajati || [])
        .filter((a: any) => !a.este_sef)
        .map((a: any) => ({
          id: a.pozitie_rotatie,
          uuid: a.id,
          nume: a.nume,
          zile_co: a.zile_co,
          este_sef: a.este_sef,
          pozitie_rotatie: a.pozitie_rotatie,
          concedii: (sbConcedii || [])
            .filter((c: any) => c.angajat_id === a.id)
            .map((c: any) => ({ s: c.data_start, e: c.data_sfarsit })),
          absente: (sbAbsente || [])
            .filter((ab: any) => ab.angajat_id === a.id)
            .map((ab: any) => ({ data: ab.data_start, tip: ab.tip, zile: ab.zile })),
        }))

      setEchipa(ec)

      const mySelf = (sbAngajati || []).find((a: any) => a.id === session.user.id)
      if (mySelf?.este_sef) {
        router.replace('/sef')
        setLoading(false)
        return
      }

      const selfAdaptat = ec.find(a => a.uuid === session.user.id) ?? null
      setAngajat(selfAdaptat)
      setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
    })
    return () => sub.subscription.unsubscribe()
  }, [router, pathname])

  return <Ctx.Provider value={{ angajat, echipa, loading }}>{children}</Ctx.Provider>
}
