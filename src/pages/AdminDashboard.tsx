import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Car, formatCurrency } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PlusCircle,
  Edit,
  Trash2,
  Car as CarIcon,
  Loader2,
  Eye,
  MessageCircle,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Car[];
    },
    enabled: !!user?.id,
  });

  const carIds = cars.map((c) => c.id);
  const { data: messages = [] } = useQuery({
    queryKey: ['messages-admin', carIds.join(',')],
    queryFn: async () => {
      if (!carIds.length) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('car_id', carIds)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as { id: string; car_id: string; content: string; sender_name: string; sender_type: string; created_at: string }[];
    },
    enabled: carIds.length > 0,
    refetchInterval: 15000,
  });

  const stats = useMemo(() => ({
    available: cars.filter((c) => c.status === 'available').length,
    sold: cars.filter((c) => c.status === 'sold').length,
    msgs: messages.filter((m) => m.sender_type === 'buyer').length,
  }), [cars, messages]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir anúncio');
    } else {
      toast.success('Anúncio excluído');
      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
    }
    setDeletingId(null);
  };

  const handleToggleStatus = async (car: Car) => {
    setTogglingId(car.id);
    const newStatus = car.status === 'available' ? 'sold' : 'available';
    const { error } = await supabase.from('cars').update({ status: newStatus }).eq('id', car.id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(newStatus === 'sold' ? 'Marcado como vendido' : 'Marcado como disponível');
      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
    }
    setTogglingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Meus Anúncios</h1>
          <Button asChild className="gap-2 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold h-9 text-sm">
            <Link to="/admin/adicionar">
              <PlusCircle className="h-4 w-4" />
              Novo
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="text-2xl font-bold text-primary">{stats.available}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Disponíveis</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="text-2xl font-bold text-success">{stats.sold}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Vendidos</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center relative">
            <div className="text-2xl font-bold text-primary">{stats.msgs}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Mensagens</div>
            {stats.msgs > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold" />
            )}
          </div>
        </div>

        {/* Car list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CarIcon className="h-12 w-12 mb-3 text-muted-foreground/20" />
            <p className="font-medium text-foreground">Nenhum anúncio ainda</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Publique seu primeiro carro agora</p>
            <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Link to="/admin/adicionar"><PlusCircle className="h-4 w-4 mr-1.5" />Novo Anúncio</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {cars.map((car) => (
              <CarRow
                key={car.id}
                car={car}
                toggling={togglingId === car.id}
                onToggle={() => handleToggleStatus(car)}
                onDelete={() => setDeletingId(car.id)}
              />
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Mensagens</span>
              <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                {messages.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {messages.map((msg) => {
                const car = cars.find((c) => c.id === msg.car_id);
                return (
                  <div key={msg.id} className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium">{msg.sender_name}</span>
                        {car && (
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">· {car.title}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{msg.content}</p>
                    </div>
                    {car && (
                      <Button asChild variant="outline" size="sm" className="shrink-0 h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5">
                        <Link to={`/chat/${msg.car_id}`}>
                          <MessageCircle className="h-3 w-3" />
                          Responder
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CarRow({
  car,
  toggling,
  onToggle,
  onDelete,
}: {
  car: Car;
  toggling: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isSold = car.status === 'sold';

  return (
    <div className={`bg-card rounded-xl border border-border overflow-hidden flex gap-0 ${isSold ? 'opacity-70' : ''}`}>
      {/* Thumbnail */}
      <div className="w-24 sm:w-32 shrink-0 bg-muted">
        {car.images?.[0] ? (
          <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center min-h-[80px]">
            <CarIcon className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-foreground line-clamp-1 leading-tight">{car.title}</p>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isSold
                ? 'bg-muted text-muted-foreground'
                : 'bg-success/15 text-success'
            }`}>
              {isSold ? 'Vendido' : 'Ativo'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {car.year} · {car.km.toLocaleString('pt-BR')} km{car.seller_city ? ` · ${car.seller_city}` : ''}
          </p>
          <p className="text-base font-bold text-primary mt-1">{formatCurrency(car.selling_price)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs gap-1.5">
            <Link to={`/carro/${car.id}`} target="_blank">
              <Eye className="h-3.5 w-3.5" />
              Ver
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs gap-1.5">
            <Link to={`/admin/editar/${car.id}`}>
              <Edit className="h-3.5 w-3.5" />
              Editar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5"
            onClick={onToggle}
            disabled={toggling}
            title={isSold ? 'Marcar como disponível' : 'Marcar como vendido'}
          >
            {toggling
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : isSold
                ? <Circle className="h-3.5 w-3.5" />
                : <CheckCheck className="h-3.5 w-3.5" />}
            {isSold ? 'Reativar' : 'Vendido'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 ml-auto hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
