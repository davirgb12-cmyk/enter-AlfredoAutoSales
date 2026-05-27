import { useQuery } from '@tanstack/react-query';

const BASE = 'https://parallelum.com.br/fipe/api/v2/cars';

export interface FipeResult {
  price: string;          // "R$ 14.870,00"
  brand: string;
  model: string;
  modelYear: number;
  fuelAcronym: string;
  codeFipe: string;
  priceValue: number;     // parsed number
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fuzzyMatch(target: string, candidate: string): boolean {
  const t = normalize(target);
  const c = normalize(candidate);
  return c.includes(t) || t.includes(c) || c.split(' ').some((w) => t.includes(w) && w.length > 2);
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FIPE API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchFipePrice(
  brand: string,
  model: string,
  year: number
): Promise<FipeResult | null> {
  // 1. Find brand
  const brands = await get<{ code: string; name: string }[]>(`${BASE}/brands`);
  const brandMatch = brands.find((b) => fuzzyMatch(brand, b.name));
  if (!brandMatch) return null;

  // 2. Find model
  const modelsData = await get<{
    models: { code: number; name: string }[];
  }>(`${BASE}/brands/${brandMatch.code}/models`);

  const models = modelsData.models ?? [];
  let modelMatch = models.find((m) => normalize(m.name) === normalize(model));
  if (!modelMatch) {
    modelMatch = models.find((m) => fuzzyMatch(model, m.name));
  }
  if (!modelMatch) return null;

  // 3. Find year
  const years = await get<{ code: string; name: string }[]>(
    `${BASE}/brands/${brandMatch.code}/models/${modelMatch.code}/years`
  );

  const yearMatch =
    years.find((y) => y.code.startsWith(String(year))) ??
    years.find((y) => y.name.includes(String(year))) ??
    years[0];

  if (!yearMatch) return null;

  // 4. Get price
  const data = await get<{
    price: string;
    brand: string;
    model: string;
    modelYear: number;
    fuelAcronym: string;
    codeFipe: string;
  }>(
    `${BASE}/brands/${brandMatch.code}/models/${modelMatch.code}/years/${yearMatch.code}`
  );

  const priceValue = parseFipePrice(data.price);
  return { ...data, priceValue };
}

export function parseFipePrice(priceStr: string): number {
  return parseFloat(
    priceStr.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
  );
}

export interface FipeComparison {
  diff: number;        // positive = asking above FIPE, negative = below
  pct: number;         // abs percentage
  above: boolean;
  label: string;       // "12% abaixo da FIPE" etc.
}

export function fipeComparison(askingPrice: number, fipePrice: number): FipeComparison {
  const diff = askingPrice - fipePrice;
  const pct = Math.abs(Math.round((diff / fipePrice) * 100));
  const above = diff > 0;
  const label =
    pct === 0
      ? 'Na média da FIPE'
      : above
      ? `${pct}% acima da FIPE`
      : `${pct}% abaixo da FIPE`;
  return { diff, pct, above, label };
}

export function useFipePrice(brand: string, model: string, year: number) {
  return useQuery({
    queryKey: ['fipe', brand.toLowerCase(), model.toLowerCase(), year],
    queryFn: () => fetchFipePrice(brand, model, year),
    enabled: !!(brand && model && year),
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
