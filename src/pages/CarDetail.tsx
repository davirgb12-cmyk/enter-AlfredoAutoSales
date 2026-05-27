import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Car, formatCurrency, formatKm, getWhatsAppNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FipeBadge from '@/components/FipeBadge';
import ChatPanel from '@/components/ChatPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Palette,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
} from 'lucide-react';

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  const { data: car, isLoading, error } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Car;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground text-lg">Veículo não encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para os anúncios
          </Link>
        </Button>
      </div>
    );
  }

  const images = car.images?.length ? car.images : [];
  const whatsappNumber = getWhatsAppNumber(car.seller_phone);
  const whatsappMsg = encodeURIComponent(
    `Olá ${car.seller_name || ''}! Vi seu anúncio do ${car.title} (${formatCurrency(car.selling_price)}) no GiroCar. Ainda está disponível?`
  );
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`
    : null;
  const phoneLink = whatsappNumber ? `tel:+${whatsappNumber}` : null;

  const isOwner = isAdmin && user?.id === car.user_id;
  const canEdit = isOwner || (isAdmin && !car.user_id);

  const specs = [
    { icon: Calendar, label: 'Ano', value: String(car.year) },
    { icon: Gauge, label: 'Quilometragem', value: formatKm(car.km) },
    { icon: Fuel, label: 'Combustível', value: car.fuel },
    { icon: Settings2, label: 'Câmbio', value: car.transmission },
    { icon: Palette, label: 'Cor', value: car.color },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/editar/${car.id}`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImage]}
                    alt={car.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImage((p) => (p - 1 + images.length) % images.length)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-primary-foreground rounded-full p-1.5 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setActiveImage((p) => (p + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-primary-foreground rounded-full p-1.5 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`h-1.5 rounded-full transition-all ${
                              i === activeImage
                                ? 'w-5 bg-primary-foreground'
                                : 'w-1.5 bg-primary-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <p className="text-muted-foreground">Sem fotos</p>
                </div>
              )}

              {car.status === 'sold' && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <div className="bg-destructive text-destructive-foreground text-xl font-bold px-8 py-3 rounded-lg rotate-[-10deg] shadow-xl">
                    VENDIDO
                  </div>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      i === activeImage
                        ? 'border-primary'
                        : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {car.title}
                </h1>
                <Badge
                  className={
                    car.status === 'available'
                      ? 'bg-success text-success-foreground flex-shrink-0'
                      : 'bg-destructive text-destructive-foreground flex-shrink-0'
                  }
                >
                  {car.status === 'available' ? 'Disponível' : 'Vendido'}
                </Badge>
              </div>
              <div className="text-4xl font-bold text-gold">
                {formatCurrency(car.selling_price)}
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {specs.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-semibold text-card-foreground text-sm">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FIPE */}
            <FipeBadge
              brand={car.brand}
              model={car.model}
              year={car.year}
              sellingPrice={car.selling_price}
            />

            {/* Description */}
            {car.description && (
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-card-foreground mb-2">Descrição</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {car.description}
                </p>
              </div>
            )}

            {/* Seller info */}
            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <h3 className="font-semibold text-card-foreground text-sm">Vendedor</h3>
              {car.seller_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">{car.seller_name}</span>
                </div>
              )}
              {(car.seller_city || car.seller_state) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{[car.seller_city, car.seller_state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Contact CTAs */}
            {car.status === 'available' && (
              <div className="space-y-3">
                {whatsappLink ? (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground gap-2 h-12 text-base"
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-5 w-5" />
                        Falar no WhatsApp
                      </a>
                    </Button>
                    {phoneLink && (
                      <Button asChild variant="outline" size="lg" className="w-full gap-2 h-12">
                        <a href={phoneLink}>
                          <Phone className="h-4 w-4" />
                          Ligar para o vendedor
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Contato do vendedor não informado
                  </p>
                )}
              </div>
            )}

            {/* Chat with seller */}
            <ChatPanel car={car} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
