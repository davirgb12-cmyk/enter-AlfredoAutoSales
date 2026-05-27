import { useQuery } from '@tanstack/react-query';

const BASE = 'https://parallelum.com.br/fipe/api/v2/cars';

export interface FipeResult {
  price: string;        // "R$ 14.870,00"
  brand: string;
  model: string;
  modelYear: number;
  fuelAcronym: string;
  codeFipe: string;
  priceValue: number;   // parsed number
}

// ── normalisation helpers ────────────────────────────────────────────────────

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** strip everything except letters and digits */
function normAlpha(s: string) {
  return norm(s).replace(/[^a-z0-9]/g, '');
}

/** score: 100 = exact, 0 = no match.  threshold = 25 */
function score(target: string, candidate: string): number {
  const t = normAlpha(target);
  const c = normAlpha(candidate);
  if (!t || !c) return 0;
  if (c === t) return 100;
  if (c.startsWith(t)) return 90;
  if (c.includes(t)) return 80;
  if (t.length >= 3 && t.includes(c)) return 70;
  // word-level fallback
  const tWords = norm(target).split(/\s+/).filter((w) => w.length >= 2);
  const cWords = norm(candidate).split(/\s+/).filter((w) => w.length >= 2);
  const hits = tWords.filter((tw) =>
    cWords.some((cw) => cw === tw || cw.startsWith(tw) || tw.startsWith(cw))
  ).length;
  return hits > 0 ? 30 + (hits / Math.max(tWords.length, 1)) * 30 : 0;
}

function pick<T extends { name: string }>(query: string, items: T[]): T | null {
  let best: T | null = null;
  let best_score = 0;
  for (const item of items) {
    const s = score(query, item.name);
    if (s > best_score) { best_score = s; best = item; }
  }
  return best_score >= 25 ? best : null;
}

// ── api helpers ──────────────────────────────────────────────────────────────

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`FIPE ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

type Brand  = { code: string; name: string };
type Model  = { code: number; name: string };
type Year   = { code: string; name: string };
type Price  = { price: string; brand: string; model: string; modelYear: number; fuelAcronym: string; codeFipe: string };

async function getModels(brandCode: string): Promise<Model[]> {
  // The v2 API may return either [{code,name}] or {models:[{code,name}],years:[...]}
  const raw = await get<Model[] | { models: Model[] }>(
    `${BASE}/brands/${brandCode}/models`
  );
  return Array.isArray(raw) ? raw : (raw?.models ?? []);
}

async function getYears(brandCode: string, modelCode: number): Promise<Year[]> {
  const raw = await get<Year[] | { years: Year[] }>(
    `${BASE}/brands/${brandCode}/models/${modelCode}/years`
  );
  return Array.isArray(raw) ? raw : (raw?.years ?? []);
}

// ── main fetch ───────────────────────────────────────────────────────────────

export async function fetchFipePrice(
  brand: string,
  model: string,
  year: number
): Promise<FipeResult | null> {
  const brands = await get<Brand[]>(`${BASE}/brands`);
  const brandMatch = pick(brand, brands);
  if (!brandMatch) return null;

  const models = await getModels(brandMatch.code);
  const modelMatch = pick(model, models);
  if (!modelMatch) return null;

  const years = await getYears(brandMatch.code, modelMatch.code);
  if (!years.length) return null;

  // prefer exact year, else closest
  const yearMatch =
    years.find((y) => y.code.startsWith(String(year))) ??
    years.find((y) => y.name.includes(String(year))) ??
    years.reduce((prev, cur) => {
      const py = parseInt(prev.name);
      const cy = parseInt(cur.name);
      return Math.abs(cy - year) < Math.abs(py - year) ? cur : prev;
    });

  const data = await get<Price>(
    `${BASE}/brands/${brandMatch.code}/models/${modelMatch.code}/years/${yearMatch.code}`
  );

  return { ...data, priceValue: parseFipePrice(data.price) };
}

export function parseFipePrice(priceStr: string): number {
  return parseFloat(
    priceStr.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
  );
}

export interface FipeComparison {
  diff: number;
  pct: number;
  above: boolean;
  label: string;
  color: 'success' | 'destructive' | 'muted';
}

export function fipeComparison(askingPrice: number, fipePrice: number): FipeComparison {
  const diff = askingPrice - fipePrice;
  const pct = Math.round(Math.abs((diff / fipePrice) * 100));
  const above = diff > 0;
  const color =
    pct === 0 ? 'muted' : above ? 'destructive' : 'success';
  const label =
    pct === 0
      ? 'Na média da FIPE'
      : above
      ? `${pct}% acima da FIPE`
      : `${pct}% abaixo da FIPE`;
  return { diff, pct, above, label, color };
}

export function useFipePrice(brand: string, model: string, year: number) {
  return useQuery({
    queryKey: ['fipe-v3', normAlpha(brand), normAlpha(model), year],
    queryFn: () => fetchFipePrice(brand, model, year),
    enabled: !!(brand?.trim() && model?.trim() && year > 0),
    staleTime: 1000 * 60 * 60, // 1 h
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
