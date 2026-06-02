import { Link } from 'react-router-dom';
import { Car, formatCurrency, formatKm } from '@/lib/types';
import { Gauge, Calendar, Fuel, MapPin, TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react';
import { usePopularPrice, popularPriceLabel } from '@/hooks/usePopularPrice';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const mainImage = car.images?.[0];

  const { data: popularPrice, isLoading: ppLoading } = usePopularPrice(
    car.brand,
    car.model,
    car.year,
    car.km,
    car.fuel,
  );

  const ppLabel = popularPrice
    ? popularPriceLabel(car.selling_price, popularPrice.popular_min, popularPrice.popular_max)
    : null;

  return (
    <Link to={`/carro/${car.id}`} className="group block">
      <article className="bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200">

        {/* Image */}
        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-muted-foreground/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l3 2h3m10 0h-2m2 0l.5-2M7 16l.5-2M3 6h2l2.5 6h9L19 6h2" />
              </svg>
            </div>
          )}

          {car.status === 'sold' && (
            <div className="absolute inset-0 bg-foreground/55 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground text-sm font-bold px-5 py-1.5 rounded-full rotate-[-8deg] shadow-lg tracking-wide">
                VENDIDO
              </span>
            </div>
          )}

          {car.images && car.images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              {car.images.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">

          {/* Location */}
          {(car.seller_city || car.seller_state) && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{[car.seller_city, car.seller_state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-[0.9rem] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
            {car.title}
          </h3>

          {/* Price */}
          <p className="text-[1.5rem] font-bold text-primary leading-none mb-2 tracking-tight">
            {formatCurrency(car.selling_price)}
          </p>

          {/* Popular price row */}
          <div className="flex items-center justify-between gap-2 mb-3 min-h-[22px]">
            {ppLoading ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                Consultando preço popular...
              </span>
            ) : popularPrice ? (
              <>
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">Popular</span>
                  {' '}{formatCurrency(popularPrice.popular_min)} – {formatCurrency(popularPrice.popular_max)}
                </span>
                {ppLabel && <PopularBadge color={ppLabel.color} text={ppLabel.text} />}
              </>
            ) : null}
          </div>

          {/* Specs row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap border-t border-border pt-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{car.year}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />{formatKm(car.km)}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3 w-3" />{car.fuel}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function PopularBadge({ color, text }: { color: 'success' | 'destructive' | 'muted'; text: string }) {
  if (color === 'success') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success shrink-0">
        <TrendingDown className="h-2.5 w-2.5" />{text}
      </span>
    );
  }
  if (color === 'destructive') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive shrink-0">
        <TrendingUp className="h-2.5 w-2.5" />{text}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
      <Minus className="h-2.5 w-2.5" />{text}
    </span>
  );
}
