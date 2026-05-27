import { Link } from 'react-router-dom';
import { Car } from '@/lib/types';
import { formatCurrency, formatKm, WHATSAPP_NUMBER } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, Calendar, Fuel, MessageCircle, Settings2 } from 'lucide-react';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const mainImage = car.images?.[0];
  const whatsappMsg = encodeURIComponent(
    `Olá Alfredo! Tenho interesse no ${car.title}. Ainda está disponível?`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return (
    <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group border-border bg-card shadow-card">
      <Link to={`/carro/${car.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-muted-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l3 2h3m10 0h-2m2 0l.5-2M7 16l.5-2M3 6h2l2.5 6h9L19 6h2" />
              </svg>
            </div>
          )}
          {car.status === 'sold' && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <div className="bg-destructive text-destructive-foreground text-sm font-bold px-5 py-2 rounded-lg rotate-[-12deg] shadow-lg">
                VENDIDO
              </div>
            </div>
          )}
          {car.images && car.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-foreground/60 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {car.images.length} fotos
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/carro/${car.id}`}>
          <h3 className="font-semibold text-card-foreground hover:text-primary transition-colors line-clamp-2 mb-1 leading-snug">
            {car.title}
          </h3>
        </Link>

        <div className="text-2xl font-bold text-gold mb-3">
          {formatCurrency(car.selling_price)}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatKm(car.km)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{car.fuel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{car.transmission}</span>
          </div>
        </div>

        {car.status === 'available' ? (
          <Button
            asChild
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground gap-2"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              Tenho Interesse
            </a>
          </Button>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            Vendido
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
