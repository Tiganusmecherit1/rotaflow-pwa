import { supabase } from './supabaseClient'

export interface UserProfile {
  id: number
  uuid: string
  nume: string
  este_sef: boolean
  pozitie_rotatie: number
  zile_co: number
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('angajati')
    .select('*')
    .eq('uuid', user.id)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export async function signOut() {
  await supabase.auth.signOut()
}
