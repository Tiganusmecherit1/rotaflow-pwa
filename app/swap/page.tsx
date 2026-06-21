'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { supabase, Angajat, Concediu, Absenta } from '@/lib/supabase';
import { getTura, fmtDateInput, fmtDate, TURA_LABEL } from '@/lib/rotatie';
import { ChevronLeft, Sun, Moon, Info } from 'lucide-react';

export default function CereSwapPage() {
  const { session, angajat, loading } = useAuth();
  const router = useRouter();

  const [echipa, setEchipa] = useState<Angajat[]>([]);
  const [concedii, setConcedii] = useState<Concediu[]>([]);
  const [absente, setAbsente] = useState<Absenta[]>([]);
  const [suplinitorActiv, setSuplinitorActiv] = useState(false);
  const [notifNecitite, setNotifNecitite] = useState(0);
  const [seIncarcaDate, setSeIncarcaDate] = useState(true);

  const [dataMea, setDataMea] = useState(fmtDateInput(new Date()));
  const [partenerId, setPartenerId] = useState<string>('');
  const [dataPartener, setDataPartener] = useState(fmtDateInput(new Date(Date.now() + 4 * 86400000)));
  const [nota, setNota] = useState('');
  const [seTrimite, setSeTrimite] = useState(false);
  const [trimis, setTrimis] = useState(false);
  const [eroare, setEroare] = useState('');

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

  const colegi = useMemo(() => echipa.filter(a => a.id !== angajat?.id && !a.este_sef), [echipa, angajat]);

  useEffect(() => {
    if (colegi.length > 0 && !partenerId) setPartenerId(colegi[0].id);
  }, [colegi, partenerId]);

  const turaMea = useMemo(() => {
    if (!angajat || echipa.length === 0) return null;
    return getTura(new Date(dataMea + 'T00:00:00'), angajat, echipa, concedii, absente, suplinitorActiv);
  }, [angajat, echipa, concedii, absente, suplinitorActiv, dataMea]);

  const partenerAngajat = useMemo(() => echipa.find(a => a.id === partenerId), [echipa, partenerId]);

  const turaPartener = useMemo(() => {
    if (!partenerAngajat || echipa.length === 0) return null;
    return getTura(new Date(dataPartener + 'T00:00:00'), partenerAngajat, echipa, concedii, absente, suplinitorActiv);
  }, [partenerAngajat, echipa, concedii, absente, suplinitorActiv, dataPartener]);

  const trimiteCererea = async () => {
    if (!angajat || !partenerId) return;
    setEroare('');
    setSeTrimite(true);

    const { error } = await supabase.from('swap_requests').insert({
      solicitant_id: angajat.id,
      solicitant_data: dataMea,
      partener_id: partenerId,
      partener_data: dataPartener,
      nota: nota.trim() || null,
      status: 'pending_coleg',
    });

    setSeTrimite(false);
    if (error) {
      setEroare('Nu am putut trimite cererea. Încearcă din nou.');
      console.error(error);
    } else {
      setTrimis(true);
      setTimeout(() => router.push('/notificari'), 1500);
    }
  };

  if (loading || seIncarcaDate || !angajat) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Se încarcă...</div>
      </div>
    );
  }

  if (trimis) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-center px-8">
        <div className="w-16 h-16 rounded-full bg-emerald-950/40 flex items-center justify-center mb-4">
          <span className="text-emerald-400 text-3xl">✓</span>
        </div>
        <p className="text-white text-[16px] font-semibold text-center">Cererea a fost trimisă!</p>
        <p className="text-zinc-500 text-[13px] text-center mt-1.5">{partenerAngajat?.nume} va primi o notificare.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-20">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={() => router.push('/')} className="w-8 h-8 flex items-center justify-center -ml-1.5">
          <ChevronLeft size={20} className="text-zinc-400" />
        </button>
        <span className="text-white text-[16px] font-semibold">Cere schimb de tură</span>
      </div>

      <div className="px-5 pt-3">
        <p className="text-zinc-500 text-[12px] font-medium mb-2">Tura ta de cedat</p>
        <input
          type="date"
          value={dataMea}
          onChange={e => setDataMea(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-[13px] mb-2.5 outline-none"
        />
        <div className={`rounded-xl p-4 flex items-center justify-between ${turaMea?.type === 'D' ? 'bg-sky-950/50' : turaMea?.type === 'S' ? 'bg-purple-950/40' : 'bg-white/[0.04]'}`}>
          <div>
            <p className="text-[11px] text-zinc-400 mb-0.5">{fmtDate(new Date(dataMea + 'T00:00:00'))}</p>
            <p className={`text-[15px] font-semibold ${turaMea?.type === 'D' ? 'text-sky-300' : turaMea?.type === 'S' ? 'text-purple-300' : 'text-zinc-400'}`}>
              {TURA_LABEL[turaMea?.type ?? 'L']}
            </p>
          </div>
          {turaMea?.type === 'D' && <Sun size={22} className="text-sky-300" />}
          {turaMea?.type === 'S' && <Moon size={22} className="text-purple-300" />}
        </div>
        {turaMea?.type !== 'D' && turaMea?.type !== 'S' && (
          <p className="text-amber-400/80 text-[11px] mt-1.5">Atenție — în această zi nu ai tură programată.</p>
        )}
      </div>

      <div className="px-5 pt-5">
        <p className="text-zinc-500 text-[12px] font-medium mb-2">Cu cine schimbi</p>
        <div className="grid grid-cols-2 gap-2">
          {colegi.map(c => (
            <button
              key={c.id}
              onClick={() => setPartenerId(c.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${partenerId === c.id ? 'border-[#0078d4] bg-[#0078d4]/15' : 'border-white/[0.08] bg-transparent'}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: c.avatar_culoare }}
              >
                {c.nume.substring(0, 2).toUpperCase()}
              </div>
              <span className={`text-[12px] font-medium ${partenerId === c.id ? 'text-[#60cdff]' : 'text-zinc-300'}`}>{c.nume}</span>
            </button>
          ))}
        </div>
      </div>

      {partenerAngajat && (
        <div className="px-5 pt-5">
          <p className="text-zinc-500 text-[12px] font-medium mb-2">Tura lui {partenerAngajat.nume} pe care o preiei</p>
          <input
            type="date"
            value={dataPartener}
            onChange={e => setDataPartener(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-[13px] mb-2.5 outline-none"
          />
          <div className={`rounded-xl p-4 flex items-center justify-between ${turaPartener?.type === 'D' ? 'bg-sky-950/50' : turaPartener?.type === 'S' ? 'bg-purple-950/40' : 'bg-white/[0.04]'}`}>
            <div>
              <p className="text-[11px] text-zinc-400 mb-0.5">{fmtDate(new Date(dataPartener + 'T00:00:00'))}</p>
              <p className={`text-[15px] font-semibold ${turaPartener?.type === 'D' ? 'text-sky-300' : turaPartener?.type === 'S' ? 'text-purple-300' : 'text-zinc-400'}`}>
                {TURA_LABEL[turaPartener?.type ?? 'L']}
              </p>
            </div>
            {turaPartener?.type === 'D' && <Sun size={22} className="text-sky-300" />}
            {turaPartener?.type === 'S' && <Moon size={22} className="text-purple-300" />}
          </div>
        </div>
      )}

      <div className="px-5 pt-5">
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Motiv (opțional) — ex: eveniment personal"
          className="w-full h-16 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-[12px] outline-none resize-none placeholder:text-zinc-600"
        />
      </div>

      <div className="px-5 pt-3">
        <div className="bg-white/[0.04] rounded-lg px-3.5 py-3 flex items-start gap-2.5">
          <Info size={15} className="text-zinc-500 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Schimbul devine valid doar după ce {partenerAngajat?.nume ?? 'colegul'} acceptă și șeful aprobă final.
          </p>
        </div>
      </div>

      {eroare && (
        <div className="px-5 pt-3">
          <div className="bg-red-950/40 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-red-300 text-[12px]">
            {eroare}
          </div>
        </div>
      )}

      <div className="px-5 pt-4">
        <button
          onClick={trimiteCererea}
          disabled={seTrimite || !partenerId}
          className="w-full bg-[#0078d4] hover:bg-[#0086ef] text-white font-semibold text-[14px] py-3.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {seTrimite ? 'Se trimite...' : 'Trimite cererea'}
        </button>
      </div>

      <BottomNav notificariNecitite={notifNecitite} />
    </div>
  );
}
