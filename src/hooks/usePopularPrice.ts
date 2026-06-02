import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopularPriceResult {
  popular_min: number;
  popular_max: number;
}

/** Rough bucket km so slight variations don't trigger extra AI calls */
function bucketKm(km: number) {
  return Math.round(km / 20_000) * 20_000;
}

export function usePopularPrice(
  brand: string,
  model: string,
  year: number,
  km: number,
  fuel: string,
) {
  return useQuery<PopularPriceResult>({
    queryKey: ['popular-price', brand, model, year, bucketKm(km), fuel],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('popular-price', {
        body: { brand, model, year, km, fuel },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as PopularPriceResult;
    },
    enabled: !!(brand?.trim() && model?.trim() && year > 0),
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 24,   // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function popularPriceLabel(
  sellingPrice: number,
  min: number,
  max: number,
): { text: string; color: 'success' | 'destructive' | 'muted' } {
  if (sellingPrice <= min) {
    return { text: 'Ótimo negócio', color: 'success' };
  }
  if (sellingPrice > max) {
    const pct = Math.round(((sellingPrice - max) / max) * 100);
    return { text: `${pct}% acima do popular`, color: 'destructive' };
  }
  return { text: 'Preço popular', color: 'muted' };
}
