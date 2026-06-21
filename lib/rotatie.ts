import { Angajat, Concediu, Absenta } from './supabase';

// ─── Aceeasi logica exacta ca in RotaFlow desktop ───

const SARBATORI_RAW = ['2026-01-01','2026-01-02','2026-01-24','2026-04-19','2026-04-20','2026-05-01','2026-06-01','2026-06-08','2026-08-15','2026-11-30','2026-12-01','2026-12-25','2026-12-26'];
const SARBATORI = SARBATORI_RAW.map(d => new Date(d + 'T00:00:00'));

export const isSarbatoare = (d: Date) => SARBATORI.some(s => s.toDateString() === d.toDateString());
export const parseD = (s: string) => new Date(s + 'T00:00:00');
export const fmtDateInput = (d: Date) => d.toISOString().split('T')[0];

export const DAY_SHORT = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du'];

export const fmtDate = (d: Date) => {
  const luni = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'];
  return `${d.getDate()} ${luni[d.getMonth()]}`;
};

export const getMonday = (d: Date) => {
  const r = new Date(d);
  const day = r.getDay();
  const diff = r.getDate() - day + (day === 0 ? -6 : 1);
  r.setDate(diff);
  r.setHours(0, 0, 0, 0);
  return r;
};

export interface TuraInfo {
  type: 'D' | 'S' | 'L' | 'CO' | 'CM' | 'AN';
  label: string;
}

const inInterval = (d: Date, start: string, end: string): boolean => {
  const s = parseD(start);
  const e = parseD(end);
  return d >= s && d <= e;
};

const inAbsenta = (d: Date, abs: Absenta): boolean => {
  const s = parseD(abs.data_start);
  const e = new Date(s.getTime() + (abs.zile - 1) * 86400000);
  e.setHours(23, 59, 59);
  return d >= s && d <= e;
};

// Calculeaza tura unui angajat intr-o zi data, tinand cont de toata echipa (pentru rotatie corecta)
export function getTura(
  d: Date,
  angajat: Angajat,
  toataEchipa: Angajat[],
  toateConcediile: Concediu[],
  toateAbsentele: Absenta[],
  suplinitorActiv: boolean
): TuraInfo {
  // Verifica CO
  const concediuActiv = toateConcediile.find(c => c.angajat_id === angajat.id && inInterval(d, c.data_start, c.data_sfarsit));
  if (concediuActiv) return { type: 'CO', label: 'CO' };

  // Verifica CM/AN
  const absentaActiva = toateAbsentele.find(a => a.angajat_id === angajat.id && inAbsenta(d, a));
  if (absentaActiva) return { type: absentaActiva.tip, label: absentaActiva.tip };

  // Echipa activa in ziua respectiva (fara cei in CO/CM/AN)
  const echipaNormala = toataEchipa.filter(a => !a.este_sef && a.activ);
  const activi = echipaNormala.filter(a => {
    const inCO = toateConcediile.some(c => c.angajat_id === a.id && inInterval(d, c.data_start, c.data_sfarsit));
    const inAbs = toateAbsentele.some(ab => ab.angajat_id === a.id && inAbsenta(d, ab));
    return !inCO && !inAbs;
  });

  const poz = activi.findIndex(a => a.id === angajat.id);
  if (poz === -1) return { type: 'L', label: 'L' };

  const ref = new Date(2026, 0, 1);
  const dayIdx = Math.floor((d.getTime() - ref.getTime()) / 86400000);
  const n = activi.length + (suplinitorActiv ? 1 : 0);
  const sec = ((dayIdx + poz) % n + n) % n;

  if (sec === 0 || sec === 1) return { type: 'D', label: 'D' };
  if (sec === 2) return { type: 'S', label: 'S' };
  return { type: 'L', label: 'L' };
}

export const TURA_LABEL: Record<string, string> = {
  D: 'Dimineață',
  S: 'Seară',
  L: 'Liber',
  CO: 'Concediu',
  CM: 'Concediu medical',
  AN: 'Absență nemotivată',
};

export const TURA_ORE: Record<string, string> = {
  D: '07:00 — 15:00',
  S: '15:00 — 23:00',
};
