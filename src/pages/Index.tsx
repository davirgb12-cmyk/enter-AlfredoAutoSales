import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Car } from '@/lib/types';
import { formatCurrency, WHATSAPP_NUMBER } from '@/lib/types';
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
import { Search, Car as CarIcon, MessageCircle, Phone } from 'lucide-react';

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
        String(car.year).includes(q);
      const matchesFuel = fuelFilter === 'all' || car.fuel === fuelFilter;
      return matchesSearch && matchesFuel;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price-asc') return a.selling_price - b.selling_price;
      if (sortBy === 'price-desc') return b.selling_price - a.selling_price;
      if (sortBy === 'km-asc') return a.km - b.km;
      return 0;
    });

  const minPrice = cars.length ? Math.min(...cars.map((c) => c.selling_price)) : 0;
  const maxPrice = cars.length ? Math.max(...cars.map((c) => c.selling_price)) : 0;

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá%20Alfredo!%20Quero%20saber%20mais%20sobre%20os%20carros%20disponíveis.`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground py-16 md:py-24 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">
            Jussara, Goiás · (62) 98500-6082
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Seu próximo carro
            <br />
            <span className="text-gold">está aqui</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto">
            Carros usados selecionados com qualidade e preço justo. Fale direto com o Alfredo!
          </p>

          <div className="max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar marca, modelo ou ano..."
                className="pl-9 bg-card text-card-foreground border-border h-12 rounded-xl shadow-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-primary-foreground h-12 px-4 shadow-lg gap-2"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </Button>
          </div>

          {cars.length > 0 && (
            <div className="flex items-center justify-center gap-8 mt-10 text-sm text-primary-foreground/60">
              <div>
                <span className="text-2xl font-bold text-primary-foreground">{cars.length}</span>
                <span className="ml-1">veículos</span>
              </div>
              <div className="w-px h-6 bg-primary-foreground/20" />
              <div>
                <span className="text-sm">De </span>
                <span className="font-semibold text-gold">{formatCurrency(minPrice)}</span>
                <span className="text-sm"> a </span>
                <span className="font-semibold text-gold">{formatCurrency(maxPrice)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>(62) 98500-6082</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-10 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isLoading
              ? 'Carregando...'
              : `${filtered.length} veículo${filtered.length !== 1 ? 's' : ''} disponível${filtered.length !== 1 ? 'is' : ''}`}
          </h2>
          <div className="flex gap-2">
            {fuels.length > 0 && (
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger className="w-36 h-9 text-sm bg-card">
                  <SelectValue placeholder="Combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Combustível</SelectItem>
                  {fuels.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-sm bg-card">
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-card animate-pulse h-80 shadow-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <CarIcon className="h-20 w-20 mb-5 opacity-10" />
            <p className="text-xl font-semibold text-foreground">Nenhum veículo encontrado</p>
            <p className="text-sm mt-2 mb-6">
              {search ? 'Tente outro termo de busca' : 'Em breve novos veículos serão adicionados'}
            </p>
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-primary-foreground gap-2"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Consultar pelo WhatsApp
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
