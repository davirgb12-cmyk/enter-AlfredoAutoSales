import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Car, APP_NAME, APP_TAGLINE, APP_STATE, APP_STATE_LABEL, formatCurrency } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CarCard from '@/components/CarCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Car as CarIcon, PlusCircle, MapPin, SlidersHorizontal } from 'lucide-react';

export default function Index() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [fuelFilter, setFuelFilter] = useState('all');

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'available')
        .eq('seller_state', APP_STATE)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Car[];
    },
  });

  const fuels = [...new Set(cars.map((c) => c.fuel))];

  const filtered = cars
    .filter((car) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        car.title.toLowerCase().includes(q) ||
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.seller_city?.toLowerCase().includes(q) ||
        String(car.year).includes(q);
      const matchesFuel = fuelFilter === 'all' || car.fuel === fuelFilter;
      return matchesSearch && matchesFuel;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price-asc') return a.selling_price - b.selling_price;
      if (sortBy === 'price-desc') return b.selling_price - a.selling_price;
      if (sortBy === 'km-asc') return a.km - b.km;
      return 0;
    });

  const minPrice = cars.length ? Math.min(...cars.map((c) => c.selling_price)) : 0;
  const maxPrice = cars.length ? Math.max(...cars.map((c) => c.selling_price)) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">

          {/* Location pill */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-medium text-white/70 mb-6">
            <MapPin className="h-3 w-3 text-gold" />
            Exclusivo para <span className="text-white font-semibold ml-0.5">{APP_STATE_LABEL}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-[3.25rem] lg:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight mb-4 max-w-2xl">
            Compre e venda<br />
            <span className="text-gold">carros em Goiás</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mb-10 max-w-md leading-relaxed">
            {cars.length > 0
              ? `${cars.length} veículos disponíveis. Anuncie grátis e venda mais rápido.`
              : `${APP_TAGLINE}. Anuncie o seu grátis.`}
          </p>

          {/* Search bar */}
          <div className="max-w-2xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Marca, modelo, cidade..."
                className="pl-10 bg-white/0 border-0 text-white placeholder:text-white/40 h-11 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="bg-gold hover:bg-gold/90 text-gold-foreground h-11 px-6 font-semibold text-sm rounded-xl shrink-0 shadow-none"
              onClick={() => {}}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Stats */}
          {cars.length > 0 && (
            <div className="flex items-center gap-6 mt-8 text-sm text-white/50 flex-wrap">
              <span>
                <strong className="text-white font-bold">{cars.length}</strong>{' '}
                anúncios em {APP_STATE_LABEL}
              </span>
              <span className="text-white/20">·</span>
              <span>
                De{' '}
                <strong className="text-gold font-semibold">{formatCurrency(minPrice)}</strong>
                {' '}até{' '}
                <strong className="text-gold font-semibold">{formatCurrency(maxPrice)}</strong>
              </span>
              <span className="text-white/20">·</span>
              <Link
                to="/admin"
                className="text-white/70 hover:text-gold underline underline-offset-4 transition-colors flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Anunciar grátis
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Listings ───────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-6 py-10 flex-1">

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isLoading ? 'Carregando...' : (
                <>
                  <strong>{filtered.length}</strong>{' '}
                  {filtered.length === 1 ? 'anúncio' : 'anúncios'}
                  {search && <span className="text-muted-foreground font-normal"> para "{search}"</span>}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fuels.length > 1 && (
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger className="h-8 text-xs w-32 bg-card border-border">
                  <SelectValue placeholder="Combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {fuels.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-40 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="km-asc">Menor KM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-card animate-pulse h-[320px] border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
              <CarIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum anúncio ainda'}
            </h3>
            <p className="text-sm text-muted-foreground mb-7 max-w-xs">
              {search
                ? `Não encontramos veículos para "${search}". Tente outro termo.`
                : 'Seja o primeiro a anunciar um carro em Goiás!'}
            </p>
            {search ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Limpar busca
              </Button>
            ) : (
              <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground gap-2 font-semibold">
                <Link to="/admin">
                  <PlusCircle className="h-4 w-4" />
                  Anunciar Grátis
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
