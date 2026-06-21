'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { supabase, Angajat, SwapRequest, Notificare } from '@/lib/supabase';
import { fmtDate, parseD } from '@/lib/rotatie';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function NotificariPage() {
  const { session, angajat, loading } = useAuth();
  const router = useRouter();

  const [echipa, setEchipa] = useState<Angajat[]>([]);
  const [swapuri, setSwapuri] = useState<SwapRequest[]>([]);
  const [notificari, setNotificari] = useState<Notificare[]>([]);
  const [seIncarcaDate, setSeIncarcaDate] = useState(true);
  const [seProceseaza, setSeProceseaza] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      const timer = setTimeout(() => router.push('/login'), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, session, router]);

  const incarcaDate = useCallback(async () => {
    if (!angajat) return;
    const swapQuery = angajat.este_sef
      ? supabase.from('swap_requests').select('*').order('created_at', { ascending: false })
      : supabase.from('swap_requests').select('*').or(`solicitant_id.eq.${angajat.id},partener_id.eq.${angajat.id}`).order('created_at', { ascending: false });

    const [ech, sw, notif] = await Promise.all([
      supabase.from('angajati').select('*'),
      swapQuery,
      supabase.from('notificari').select('*').eq('destinatar_id', angajat.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (ech.data) setEchipa(ech.data as Angajat[]);
    if (sw.data) setSwapuri(sw.data as SwapRequest[]);
    if (notif.data) setNotificari(notif.data as Notificare[]);
    setSeIncarcaDate(false);
  }, [angajat]);

  useEffect(() => {
    if (angajat) incarcaDate();
  }, [angajat, incarcaDate]);

  // Marcheaza notificarile ca citite la deschiderea paginii
  useEffect(() => {
    if (!angajat) return;
    supabase.from('notificari').update({ citita: true }).eq('destinatar_id', angajat.id).eq('citita', false).then(() => {});
  }, [angajat]);

  const numeAngajat = useCallback((id: string) => echipa.find(a => a.id === id)?.nume ?? '...', [echipa]);

  const deRaspuns = useMemo(() => swapuri.filter(s => s.status === 'pending_coleg' && s.partener_id === angajat?.id), [swapuri, angajat]);
  const deAprobatSef = useMemo(() => angajat?.este_sef ? swapuri.filter(s => s.status === 'pending_sef') : [], [swapuri, angajat]);
  const inAsteptareSef = useMemo(() => !angajat?.este_sef ? swapuri.filter(s => s.status === 'pending_sef' && (s.solicitant_id === angajat?.id || s.partener_id === angajat?.id)) : [], [swapuri, angajat]);
  const recente = useMemo(() => swapuri.filter(s => s.status === 'aprobat' || s.status.startsWith('refuzat')).slice(0, 8), [swapuri]);

  const raspundeSwap = async (id: string, accepta: boolean) => {
    setSeProceseaza(id);
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: accepta ? 'pending_sef' : 'refuzat_coleg',
        partener_raspuns_at: new Date().toISOString(),
      })
      .eq('id', id);
    setSeProceseaza(null);
    if (!error) incarcaDate();
  };

  const aprobaFinalSef = async (id: string, aproba: boolean) => {
    setSeProceseaza(id);
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: aproba ? 'aprobat' : 'refuzat_sef',
        sef_raspuns_at: new Date().toISOString(),
        sef_id: angajat?.id,
      })
      .eq('id', id);
    setSeProceseaza(null);
    if (!error) incarcaDate();
  };

  if (loading || seIncarcaDate || !angajat) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Se încarcă...</div>
      </div>
    );
  }

  const areConinut = deRaspuns.length > 0 || deAprobatSef.length > 0 || inAsteptareSef.length > 0 || recente.length > 0;

  return (
    <div className="min-h-screen bg-[#1c1c1e] pb-20">
      <div className="px-5 pt-5 pb-3">
        <span className="text-white text-[16px] font-semibold">Notificări</span>
      </div>

      {!areConinut && (
        <div className="px-5 pt-10 text-center">
          <p className="text-zinc-600 text-[13px]">Nicio notificare momentan.</p>
        </div>
      )}

      {deAprobatSef.length > 0 && (
        <div className="px-5 pt-2 pb-1">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-2">Swap de aprobat</p>
          <div className="space-y-2">
            {deAprobatSef.map(sw => (
              <div key={sw.id} className="border border-white/[0.1] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#0078d4]/20 flex items-center justify-center text-[9px] font-semibold text-[#60cdff] flex-shrink-0">
                    {numeAngajat(sw.solicitant_id).substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-zinc-600 text-[11px]">↔</span>
                  <div className="w-6 h-6 rounded-full bg-[#0078d4]/20 flex items-center justify-center text-[9px] font-semibold text-[#60cdff] flex-shrink-0">
                    {numeAngajat(sw.partener_id).substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-white text-[13px] font-medium ml-1">{numeAngajat(sw.solicitant_id)} ↔ {numeAngajat(sw.partener_id)}</p>
                </div>
                <div className="bg-white/[0.04] rounded-lg px-3 py-2 mb-2.5 text-[11px] text-zinc-400 space-y-0.5">
                  <p>{numeAngajat(sw.solicitant_id)} cedează <strong className="text-zinc-200 font-medium">{fmtDate(parseD(sw.solicitant_data))}</strong></p>
                  <p>{numeAngajat(sw.partener_id)} cedează <strong className="text-zinc-200 font-medium">{fmtDate(parseD(sw.partener_data))}</strong></p>
                  <p className="text-emerald-400 flex items-center gap-1 pt-1"><CheckCircle2 size={11} /> Ambii au acceptat</p>
                </div>
                {sw.nota && <p className="text-zinc-500 text-[11px] mb-2.5 italic">&quot;{sw.nota}&quot;</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => aprobaFinalSef(sw.id, false)}
                    disabled={seProceseaza === sw.id}
                    className="flex-1 bg-white/[0.05] text-zinc-300 text-[12px] font-medium py-2 rounded-lg disabled:opacity-50"
                  >
                    Refuz
                  </button>
                  <button
                    onClick={() => aprobaFinalSef(sw.id, true)}
                    disabled={seProceseaza === sw.id}
                    className="flex-1 bg-emerald-900/40 text-emerald-300 text-[12px] font-medium py-2 rounded-lg disabled:opacity-50"
                  >
                    Aprob final
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deRaspuns.length > 0 && (
        <div className="px-5 pt-2 pb-1">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-2">Așteaptă răspunsul tău</p>
          <div className="space-y-2">
            {deRaspuns.map(sw => (
              <div key={sw.id} className="border border-white/[0.1] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0078d4]/20 flex items-center justify-center text-[10px] font-semibold text-[#60cdff] flex-shrink-0">
                    {numeAngajat(sw.solicitant_id).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-[13px] font-medium">{numeAngajat(sw.solicitant_id)} vrea să schimbați tura</p>
                  </div>
                </div>
                <div className="bg-white/[0.04] rounded-lg px-3 py-2 mb-2.5 text-[11px] text-zinc-400 space-y-0.5">
                  <p>El cedează <strong className="text-zinc-200 font-medium">{fmtDate(parseD(sw.solicitant_data))}</strong></p>
                  <p>Tu cedezi <strong className="text-zinc-200 font-medium">{fmtDate(parseD(sw.partener_data))}</strong></p>
                </div>
                {sw.nota && <p className="text-zinc-500 text-[11px] mb-2.5 italic">&quot;{sw.nota}&quot;</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => raspundeSwap(sw.id, false)}
                    disabled={seProceseaza === sw.id}
                    className="flex-1 bg-white/[0.05] text-zinc-300 text-[12px] font-medium py-2 rounded-lg disabled:opacity-50"
                  >
                    Refuz
                  </button>
                  <button
                    onClick={() => raspundeSwap(sw.id, true)}
                    disabled={seProceseaza === sw.id}
                    className="flex-1 bg-emerald-900/40 text-emerald-300 text-[12px] font-medium py-2 rounded-lg disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inAsteptareSef.length > 0 && (
        <div className="px-5 pt-5 pb-1">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-2">În așteptarea șefului</p>
          <div className="space-y-2">
            {inAsteptareSef.map(sw => (
              <div key={sw.id} className="border border-white/[0.07] rounded-xl p-3 opacity-90">
                <div className="flex items-center justify-between">
                  <p className="text-white text-[12px] font-medium">{numeAngajat(sw.solicitant_id)} ↔ {numeAngajat(sw.partener_id)}</p>
                  <span className="text-[10px] bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Clock size={10} /> În așteptare
                  </span>
                </div>
                <p className="text-zinc-500 text-[11px] mt-1">Ambii au acceptat. Aprobare șef în curs.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recente.length > 0 && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-2">Recente</p>
          <div className="space-y-0.5">
            {recente.map(sw => {
              const aprobat = sw.status === 'aprobat';
              const numeAlt = sw.solicitant_id === angajat.id ? numeAngajat(sw.partener_id) : numeAngajat(sw.solicitant_id);
              return (
                <div key={sw.id} className="flex items-center gap-2.5 py-2">
                  {aprobat ? <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={17} className="text-zinc-600 flex-shrink-0" />}
                  <p className={`text-[12px] ${aprobat ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    Schimb cu {numeAlt} {aprobat ? 'aprobat' : 'refuzat'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav notificariNecitite={0} />
    </div>
  );
}
