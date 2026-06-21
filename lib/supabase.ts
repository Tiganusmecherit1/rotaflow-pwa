import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Tipuri de date ───
export interface Angajat {
  id: string;
  auth_user_id: string | null;
  nume: string;
  pozitie_rotatie: number;
  zile_co: number;
  este_sef: boolean;
  activ: boolean;
  avatar_culoare: string;
}

export interface Concediu {
  id: string;
  angajat_id: string;
  data_start: string;
  data_sfarsit: string;
  nume_slot: string | null;
  zile_lucratoare: number;
}

export interface Absenta {
  id: string;
  angajat_id: string;
  tip: 'CM' | 'AN';
  data_start: string;
  zile: number;
}

export interface SwapRequest {
  id: string;
  solicitant_id: string;
  solicitant_data: string;
  partener_id: string;
  partener_data: string;
  nota: string | null;
  status: 'pending_coleg' | 'pending_sef' | 'aprobat' | 'refuzat_coleg' | 'refuzat_sef';
  created_at: string;
}

export interface Notificare {
  id: string;
  destinatar_id: string;
  tip: string;
  titlu: string;
  descriere: string | null;
  referinta_id: string | null;
  citita: boolean;
  created_at: string;
}
