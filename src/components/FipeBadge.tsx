import { useFipePrice, fipeComparison } from '@/hooks/useFipePrice';
import { formatCurrency } from '@/lib/types';
import { TrendingDown, TrendingUp, Minus, Loader2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FipeBadgeProps {
  brand: string;
  model: string;
  year: number;
  sellingPrice: number;
  compact?: boolean;
}

export default function FipeBadge({
  brand,
  model,
  year,
  sellingPrice,
  compact = false,
}: FipeBadgeProps) {
  const { data: fipe, isLoading, isError } = useFipePrice(brand, model, year);

  // ── compact mode (for cards) ───────────────────────────────────────────────
  if (compact) {
    if (isLoading) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground py-1.5 border-t border-border mt-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin flex-shrink-0" />
          <span>Consultando FIPE...</span>
        </div>
      );
    }
    if (isError || !fipe) return null;
    const cmp = fipeComparison(sellingPrice, fipe.priceValue);
    return (
      <div className="flex items-center justify-between gap-2 border-t border-border mt-1 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">FIPE</span>
          {' '}{formatCurrency(fipe.priceValue)}
        </span>
        <CmpBadge cmp={cmp} size="xs" />
      </div>
    );
  }

  // ── full mode (for car detail page) ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-card border border-border flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span>Consultando tabela FIPE...</span>
      </div>
    );
  }

  if (isError || !fipe) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground flex items-center gap-2">
        <Info className="h-3.5 w-3.5 flex-shrink-0" />
        Não foi possível consultar a tabela FIPE para este veículo.
      </div>
    );
  }

  const cmp = fipeComparison(sellingPrice, fipe.priceValue);

  // "preço popular" — typical market range: 5–20% below FIPE
  const popLow  = fipe.priceValue * 0.80;
  const popHigh = fipe.priceValue * 0.95;

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">
            FIPE
          </span>
          <span className="text-sm font-semibold text-card-foreground">
            Tabela de Referência
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{fipe.codeFipe}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Price row */}
        <div className="grid grid-cols-3 gap-2">
          {/* FIPE price */}
          <div className="col-span-1 text-center p-2.5 rounded-md bg-muted/60">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Tabela FIPE
            </div>
            <div className="font-bold text-foreground text-sm">
              {formatCurrency(fipe.priceValue)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {fipe.modelYear} · {fipe.fuelAcronym}
            </div>
          </div>

          {/* Market range */}
          <div className="col-span-1 text-center p-2.5 rounded-md bg-muted/60">
            <div className="flex items-center justify-center gap-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                Preço Popular
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-2.5 w-2.5 text-muted-foreground mb-0.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  Faixa onde a maioria das pessoas realmente vende esse modelo (5–20% abaixo da FIPE).
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-semibold text-foreground text-[11px]">
              {formatCurrency(popLow)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              a {formatCurrency(popHigh)}
            </div>
          </div>

          {/* Asking price */}
          <div className="col-span-1 text-center p-2.5 rounded-md bg-muted/60">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Preço anunciado
            </div>
            <div className="font-bold text-gold text-sm">
              {formatCurrency(sellingPrice)}
            </div>
            <div className="flex justify-center mt-1">
              <CmpBadge cmp={cmp} size="sm" />
            </div>
          </div>
        </div>

        {/* Summary sentence */}
        <div className={`text-xs text-center py-2 px-3 rounded-md font-medium ${
          cmp.color === 'success'
            ? 'bg-success/10 text-success'
            : cmp.color === 'destructive'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground'
        }`}>
          {cmp.pct === 0
            ? 'Este carro está sendo vendido na média da tabela FIPE.'
            : cmp.above
            ? `Anunciado ${formatCurrency(Math.abs(cmp.diff))} acima da tabela FIPE.`
            : `Anunciado ${formatCurrency(Math.abs(cmp.diff))} abaixo da tabela FIPE — ótimo negócio!`}
        </div>
      </div>
    </div>
  );
}

// ── shared badge ─────────────────────────────────────────────────────────────

function CmpBadge({
  cmp,
  size,
}: {
  cmp: ReturnType<typeof fipeComparison>;
  size: 'xs' | 'sm';
}) {
  const text  = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const icon  = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const px    = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';

  if (cmp.color === 'muted') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${px} rounded-full font-medium ${text} bg-muted text-muted-foreground`}>
        <Minus className={icon} /> Na FIPE
      </span>
    );
  }
  if (cmp.color === 'success') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${px} rounded-full font-medium ${text} bg-success/15 text-success`}>
        <TrendingDown className={icon} /> {cmp.pct}% abaixo
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 ${px} rounded-full font-medium ${text} bg-destructive/10 text-destructive`}>
      <TrendingUp className={icon} /> {cmp.pct}% acima
    </span>
  );
}
