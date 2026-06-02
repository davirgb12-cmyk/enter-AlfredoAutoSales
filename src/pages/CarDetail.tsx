import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Car, formatCurrency, formatKm, getWhatsAppNumber } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FipeBadge from '@/components/FipeBadge';
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
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  Check,
  Car as CarIcon,
  Zap,
  DoorOpen,
  RotateCcw,
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
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground">Veículo não encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver anúncios
          </Link>
        </Button>
      </div>
    );
  }

  const images = car.images?.length ? car.images : [];
  const whatsappNumber = getWhatsAppNumber(car.seller_phone);
  const whatsappMsg = encodeURIComponent(
    `Olá ${car.seller_name || ''}! Vi seu anúncio do ${car.title} (${formatCurrency(car.selling_price)}) no LeveMotors. Ainda está disponível?`
  );
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null;
  const phoneLink = whatsappNumber ? `tel:+${whatsappNumber}` : null;

  const isOwner = isAdmin && user?.id === car.user_id;
  const canEdit = isOwner || (isAdmin && !car.user_id);

  const specs = [
    { icon: Calendar,  label: 'Ano',         value: String(car.year) },
    { icon: Gauge,     label: 'Quilometragem', value: formatKm(car.km) },
    { icon: Fuel,      label: 'Combustível',  value: car.fuel },
    { icon: Settings2, label: 'Câmbio',       value: car.transmission },
    { icon: Palette,   label: 'Cor',          value: car.color },
    ...(car.vehicle_type ? [{ icon: CarIcon,  label: 'Tipo', value: car.vehicle_type }] : []),
    ...(car.engine_power ? [{ icon: Zap,      label: 'Motor', value: car.engine_power }] : []),
    ...(car.doors       ? [{ icon: DoorOpen,  label: 'Portas', value: `${car.doors} portas` }] : []),
    ...(car.steering    ? [{ icon: RotateCcw,  label: 'Direção', value: car.steering }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 py-6 flex-1">

        {/* Back + Edit */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/editar/${car.id}`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 xl:gap-12">

          {/* ── Left: Gallery ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted relative">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImage]}
                    alt={car.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImage((p) => (p - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setActiveImage((p) => (p + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`rounded-full transition-all ${
                              i === activeImage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Sem fotos</p>
                </div>
              )}

              {car.status === 'sold' && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="bg-destructive text-white text-xl font-bold px-8 py-3 rounded-full rotate-[-8deg] shadow-xl tracking-widest">
                    VENDIDO
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeImage ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description — below gallery on desktop */}
            {car.description && (
              <div className="pt-2">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Descrição do vendedor</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {car.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Info sidebar ──────────────────────────────────── */}
          <div className="space-y-5">

            {/* Title + Price */}
            <div>
              <div className="flex items-start gap-2 justify-between mb-1.5">
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight flex-1">
                  {car.title}
                </h1>
                <Badge
                  className={`shrink-0 mt-0.5 text-[11px] font-semibold ${
                    car.status === 'available'
                      ? 'bg-success/15 text-success border-success/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  } border`}
                  variant="outline"
                >
                  {car.status === 'available' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" />Disponível</>
                  ) : 'Vendido'}
                </Badge>
              </div>
              <p className="text-3xl font-extrabold text-primary tracking-tight">
                {formatCurrency(car.selling_price)}
              </p>
            </div>

            {/* FIPE */}
            <FipeBadge
              brand={car.brand}
              model={car.model}
              year={car.year}
              sellingPrice={car.selling_price}
            />

            {/* Specs */}
            <div className="grid grid-cols-2 gap-2">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{label}</p>
                    <p className="font-semibold text-sm text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vehicle history warnings */}
            {(car.auction_history || car.sinistro) && (
              <div className="space-y-2">
                {car.auction_history && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
                    <Gavel className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Passagem por leilão</p>
                      <p className="text-xs opacity-80">Este veículo foi vendido em leilão anteriormente.</p>
                    </div>
                  </div>
                )}
                {car.sinistro && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Histórico de sinistro</p>
                      <p className="text-xs opacity-80">Este veículo possui histórico de sinistro registrado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optionals */}
            {car.optionals && car.optionals.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Opcionais</p>
                <div className="flex flex-wrap gap-2">
                  {car.optionals.map((opt) => (
                    <span key={opt} className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium">
                      <Check className="h-2.5 w-2.5" />{opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller card */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Anunciante</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {car.seller_name && (
                    <p className="font-semibold text-sm text-foreground">{car.seller_name}</p>
                  )}
                  {(car.seller_city || car.seller_state) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {[car.seller_city, car.seller_state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact CTAs */}
            {car.status === 'available' && (
              <div className="space-y-2.5">
                {whatsappLink ? (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white gap-2 h-12 font-semibold"
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-5 w-5" />
                        Falar no WhatsApp
                      </a>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      {phoneLink && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5 h-10">
                          <a href={phoneLink}>
                            <Phone className="h-4 w-4" />
                            Ligar
                          </a>
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 h-10 ${!phoneLink ? 'col-span-2' : ''}`}
                      >
                        <Link to={`/chat/${car.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          Chat no site
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button asChild variant="outline" size="lg" className="w-full gap-2 h-12">
                    <Link to={`/chat/${car.id}`}>
                      <MessageSquare className="h-5 w-5" />
                      Chat com o vendedor
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
