'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { supabase, Angajat, Concediu, Absenta } from '@/lib/supabase';
import { getTura } from '@/lib/rotatie';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ZILE_INITIALE = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const CULOARE_CELULA: Record<string, string> = {
  D: 'bg-sky-950/50',
  S: 'bg-purple-950/40',
  L: 'bg-white/[0.03]',
  CO: 'bg-rose-950/40',
  CM: 'bg-orange-950/40',
  AN: 'bg-red-950/50',
};

const CULOARE_TEXT: Record<string, string> = {
  D: 'text-sky-300',
  S: 'text-purple-300',
  L: 'text-zinc-600',
  CO: 'text-rose-400',
  CM: 'text-orange-300',
  AN: 'text-red-300',
};

const LUNI_NUME = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

export default function TuraMeaLunaPage() {
  const { session, angajat, loading } = useAuth();
  const router = useRouter();

  const [echipa, setEchipa] = useState<Angajat[]>([]);
  const [concedii, setConcedii] = useState<Concediu[]>([]);
  const [absente, setAbsente] = useState<Absenta[]>([]);
  const [suplinitorActiv, setSuplinitorActiv] = useState(false);
  const [notifNecitite, setNotifNecitite] = useState(0);
  const [seIncarcaDate, setSeIncarcaDate] = useState(true);
  const [lunaOffset, setLunaOffset] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      const timer = setTimeout(() => router.push('/login'), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, session, router]);

  const incarcaDate = useCallback(async () => {
    const [ech, co, ab, setari] = await Promise.all([
      supabase.from('angajati').select('*').eq('activ', true).order('pozitie_rotatie'),
      supabase.from('concedii').select('*'),
      supabase.from('absente').select('*'),
      supabase.from('setari_echipa').select('*').single(),
    ]);
    if (ech.data) setEchipa(ech.data as Angajat[]);
    if (co.data) setConcedii(co.data as Concediu[]);
    if (ab.data) setAbsente(ab.data as Absenta[]);
    if (setari.data) setSuplinitorActiv(setari.data.suplinitor_activ);
    setSeIncarcaDate(false);
  }, []);

  useEffect(() => {
    if (session) incarcaDate();
  }, [session, incarcaDate]);

  useEffect(() => {
    if (!angajat) return;
    supabase
      .from('notificari')
      .select('id', { count: 'exact', head: true })
      .eq('destinatar_id', angajat.id)
      .eq('citita', false)
      .then(({ count }) => setNotifNecitite(count ?? 0));
  }, [angajat]);

  const lunaStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + lunaOffset, 1);
  }, [lunaOffset]);

  const zileLuna = useMemo(() => {
    const an = lunaStart.getFullYear();
    const luna = lunaStart.getMonth();
    const ultimaZi = new Date(an, luna + 1, 0).getDate();
    const primaZi = new Date(an, luna, 1);
    let primaZiSaptamana = primaZi.getDay();
    primaZiSaptamana = primaZiSaptamana === 0 ? 6 : primaZiSaptamana - 1;

    const zile: (Date | null)[] = [];
    for (let i = 0; i < primaZiSaptamana; i++) zile.push(null);
    for (let i = 1; i <= ultimaZi; i++) zile.push(new Date(an, luna, i));
    return zile;
  }, [lunaStart]);

  const azi = useMemo(() => new Date(), []);

  const turaPeZi = useMemo(() => {
    if (!angajat || echipa.length === 0) return new Map<number, { type: string; label: string }>();
    const map = new Map<number, { type: string; label: string }>();
    zileLuna.forEach(d => {
      if (!d) return;
      const t = getTura(d, angajat, echipa, concedii, absente, suplinitorActiv);
      map.set(d.getDate(), t);
    });
    return map;
  }, [zileLuna, angajat, echipa, concedii, absente, suplinitorActiv]);

  const totalOre = useMemo(() => {
    let total = 0;
    turaPeZi.forEach(t => {
      if (t.type === 'D' || t.type === 'S') total += 8;
    });
    return total;
  }, [turaPeZi]);

  if (loading || seIncarcaDate || !angajat) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-20">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={() => router.push('/')} className="w-8 h-8 flex items-center justify-center -ml-1.5">
          <ChevronLeft size={20} className="text-zinc-400" />
        </button>
        <span className="text-white text-[16px] font-semibold">Tura mea — luna</span>
      </div>

      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={() => setLunaOffset(o => o - 1)} className="w-7 h-7 flex items-center justify-center bg-white/[0.05] rounded-lg">
          <ChevronLeft size={15} className="text-zinc-400" />
        </button>
        <span className="text-white text-[14px] font-medium">{LUNI_NUME[lunaStart.getMonth()]} {lunaStart.getFullYear()}</span>
        <button onClick={() => setLunaOffset(o => o + 1)} className="w-7 h-7 flex items-center justify-center bg-white/[0.05] rounded-lg">
          <ChevronRight size={15} className="text-zinc-400" />
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {ZILE_INITIALE.map((z, i) => (
            <span key={i} className="text-center text-[10px] text-zinc-600 font-medium py-1">{z}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {zileLuna.map((d, i) => {
            if (!d) return <div key={i} />;
            const t = turaPeZi.get(d.getDate());
            const esteAzi = d.toDateString() === azi.toDateString();
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 ${CULOARE_CELULA[t?.type ?? 'L']} ${esteAzi ? 'ring-1 ring-[#60cdff]' : ''}`}
              >
                <span className="text-[10px] text-zinc-500">{d.getDate()}</span>
                <span className={`text-[10px] font-semibold ${CULOARE_TEXT[t?.type ?? 'L']}`}>{t?.label ?? ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3.5 px-5 pt-5 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-sky-950/50 border border-sky-500/30" />
          <span className="text-[10px] text-zinc-500">Dimineață</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-purple-950/40 border border-purple-500/30" />
          <span className="text-[10px] text-zinc-500">Seară</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.03] border border-white/10" />
          <span className="text-[10px] text-zinc-500">Liber</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-rose-950/40 border border-rose-500/30" />
          <span className="text-[10px] text-zinc-500">Concediu</span>
        </div>
      </div>

      <div className="px-5 pt-2">
        <div className="bg-white/[0.04] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-400 text-[12px]">Total ore luna asta</span>
          <span className="text-white text-[14px] font-semibold">{totalOre}h</span>
        </div>
      </div>

      <BottomNav notificariNecitite={notifNecitite} />
    </div>
  );
}
