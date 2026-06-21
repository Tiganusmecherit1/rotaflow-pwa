'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { supabase, Angajat, Concediu, Absenta } from '@/lib/supabase';
import { getTura, getMonday, DAY_SHORT, fmtDate, TURA_LABEL, TURA_ORE } from '@/lib/rotatie';
import { Sun, Moon, Coffee, HeartPulse, Ban, ChevronRight, Bell } from 'lucide-react';

const ICON_TURA: Record<string, React.ReactNode> = {
  D: <Sun size={30} />,
  S: <Moon size={30} />,
  L: <Coffee size={30} />,
  CO: <Coffee size={30} />,
  CM: <HeartPulse size={30} />,
  AN: <Ban size={30} />,
};

const CULOARE_TURA: Record<string, string> = {
  D: 'bg-sky-950/50 text-sky-300',
  S: 'bg-purple-950/50 text-purple-300',
  L: 'bg-white/[0.04] text-zinc-500',
  CO: 'bg-rose-950/40 text-rose-300',
  CM: 'bg-orange-950/50 text-orange-300',
  AN: 'bg-red-950/60 text-red-300',
};

export default function TuraMeaPage() {
  const { session, angajat, loading } = useAuth();
  const router = useRouter();

  const [echipa, setEchipa] = useState<Angajat[]>([]);
  const [concedii, setConcedii] = useState<Concediu[]>([]);
  const [absente, setAbsente] = useState<Absenta[]>([]);
  const [suplinitorActiv, setSuplinitorActiv] = useState(false);
  const [notifNecitite, setNotifNecitite] = useState(0);
  const [seIncarcaDate, setSeIncarcaDate] = useState(true);

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

  const weekStart = useMemo(() => getMonday(new Date()), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000)), [weekStart]);
  const azi = useMemo(() => new Date(), []);

  const turaAzi = useMemo(() => {
    if (!angajat || echipa.length === 0) return null;
    return getTura(azi, angajat, echipa, concedii, absente, suplinitorActiv);
  }, [angajat, echipa, concedii, absente, suplinitorActiv, azi]);

  if (loading || seIncarcaDate || !angajat) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0078d4] flex items-center justify-center">
            <span className="text-white text-[12px] font-bold">R</span>
          </div>
          <span className="text-white text-[16px] font-semibold">RotaFlow</span>
        </div>
        <button onClick={() => router.push('/notificari')} className="relative w-9 h-9 flex items-center justify-center">
          <Bell size={20} className="text-zinc-400" />
          {notifNecitite > 0 && <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
        </button>
      </div>

      <div className="px-5 pt-2 pb-1">
        <p className="text-zinc-500 text-[13px]">Bună, {angajat.nume}</p>
        <p className="text-white text-[19px] font-semibold mt-0.5">Tura ta de azi</p>
      </div>

      {/* Card tura azi */}
      <div className="px-5 pt-3 pb-2">
        <div className={`rounded-2xl p-5 flex items-center justify-between ${CULOARE_TURA[turaAzi?.type ?? 'L']}`}>
          <div>
            <p className="text-[12px] opacity-80 mb-1">{fmtDate(azi)}</p>
            <p className="text-[21px] font-semibold">{TURA_LABEL[turaAzi?.type ?? 'L']}</p>
            {turaAzi?.type && TURA_ORE[turaAzi.type] && (
              <p className="text-[12px] opacity-80 mt-1">{TURA_ORE[turaAzi.type]}</p>
            )}
          </div>
          {ICON_TURA[turaAzi?.type ?? 'L']}
        </div>
      </div>

      {/* Saptamana */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-zinc-500 text-[12px] font-medium">Săptămâna asta</p>
        <button onClick={() => router.push('/luna')} className="text-[#60cdff] text-[12px] font-medium flex items-center gap-0.5">
          Vezi luna <ChevronRight size={14} />
        </button>
      </div>
      <div className="px-5 pb-3">
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const t = getTura(d, angajat, echipa, concedii, absente, suplinitorActiv);
            const esteAzi = d.toDateString() === azi.toDateString();
            return (
              <div key={i} className={`text-center rounded-xl py-2.5 px-0.5 ${esteAzi ? 'bg-[#0078d4]/20 border border-[#0078d4]/40' : 'bg-white/[0.04]'}`}>
                <p className="text-[9px] text-zinc-500 mb-1">{DAY_SHORT[i]}</p>
                <p className={`text-[12px] font-semibold ${t.type === 'D' ? 'text-sky-300' : t.type === 'S' ? 'text-purple-300' : t.type === 'CO' ? 'text-rose-400' : 'text-zinc-600'}`}>
                  {t.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Butoane */}
      <div className="px-5 pt-2 flex gap-2.5">
        <button
          onClick={() => router.push('/luna')}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] text-white text-[13px] font-medium py-3 rounded-xl flex items-center justify-center gap-1.5"
        >
          Tura mea — luna
        </button>
        <button
          onClick={() => router.push('/swap')}
          className="flex-1 bg-[#0078d4] text-white text-[13px] font-medium py-3 rounded-xl flex items-center justify-center gap-1.5"
        >
          Cere schimb
        </button>
      </div>

      <BottomNav notificariNecitite={notifNecitite} />
    </div>
  );
}
