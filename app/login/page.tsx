'use client';
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [eroare, setEroare] = useState('');
  const [seIncarca, setSeIncarca] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEroare('');
    setSeIncarca(true);
    const err = await signIn(email, parola);
    setSeIncarca(false);
    if (err) {
      setEroare('Email sau parolă greșită.');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1e] px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0078d4] flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-white text-xl font-semibold">RotaFlow</h1>
          <p className="text-zinc-500 text-sm mt-1">Conectează-te pentru a vedea tura ta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[15px] outline-none focus:border-[#0078d4]/60 transition-colors"
              placeholder="numele.tau@exemplu.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Parolă</label>
            <input
              type="password"
              required
              value={parola}
              onChange={e => setParola(e.target.value)}
              className="w-full bg-[#2c2c2e] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[15px] outline-none focus:border-[#0078d4]/60 transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {eroare && (
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-[13px]">
              {eroare}
            </div>
          )}

          <button
            type="submit"
            disabled={seIncarca}
            className="w-full bg-[#0078d4] hover:bg-[#0086ef] text-white font-semibold text-[15px] py-3.5 rounded-xl transition-colors disabled:opacity-60 mt-2"
          >
            {seIncarca ? 'Se conectează...' : 'Intră în cont'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Datele de acces le primești de la șeful tău de tură.
        </p>
      </div>
    </div>
  );
}
