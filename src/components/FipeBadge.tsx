import { useFipePrice, fipeComparison, parseFipePrice } from '@/hooks/useFipePrice';
import { formatCurrency } from '@/lib/types';
import { TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react';

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
  const { data: fipe, isLoading } = useFipePrice(brand, model, year);

  if (isLoading) {
    return compact ? (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Consultando FIPE...</span>
      </div>
    ) : (
      <div className="p-4 rounded-lg bg-card border border-border flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Consultando tabela FIPE...
      </div>
    );
  }

  if (!fipe) return null;

  const fipePrice = parseFipePrice(fipe.price);
  const cmp = fipeComparison(sellingPrice, fipePrice);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5 border-t border-border mt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">FIPE</span>
          <span>{formatCurrency(fipePrice)}</span>
        </div>
        <ComparisonBadge cmp={cmp} size="xs" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground text-sm flex items-center gap-1.5">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
            FIPE
          </span>
          Tabela de referência
        </h3>
        <span className="text-xs text-muted-foreground">{fipe.codeFipe}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-md bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Preço FIPE</div>
          <div className="font-bold text-foreground">{formatCurrency(fipePrice)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{fipe.modelYear} · {fipe.fuelAcronym}</div>
        </div>
        <div className="p-2.5 rounded-md bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Preço anunciado</div>
          <div className="font-bold text-foreground">{formatCurrency(sellingPrice)}</div>
          <div className="flex justify-center mt-1">
            <ComparisonBadge cmp={cmp} size="sm" />
          </div>
        </div>
      </div>

      {cmp.pct > 0 && (
        <p className="text-xs text-muted-foreground text-center border-t border-border pt-2">
          {cmp.above
            ? `Este carro está ${formatCurrency(Math.abs(cmp.diff))} acima do preço médio FIPE`
            : `Este carro está ${formatCurrency(Math.abs(cmp.diff))} abaixo do preço médio FIPE — ótima oportunidade!`}
        </p>
      )}
    </div>
  );
}

function ComparisonBadge({
  cmp,
  size,
}: {
  cmp: ReturnType<typeof fipeComparison>;
  size: 'xs' | 'sm';
}) {
  const isNeutral = cmp.pct === 0;
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${textSize} bg-muted text-muted-foreground`}>
        <Minus className={iconSize} />
        Na FIPE
      </span>
    );
  }

  if (!cmp.above) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${textSize} bg-success/15 text-success`}>
        <TrendingDown className={iconSize} />
        {cmp.pct}% abaixo
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${textSize} bg-destructive/10 text-destructive`}>
      <TrendingUp className={iconSize} />
      {cmp.pct}% acima
    </span>
  );
}
