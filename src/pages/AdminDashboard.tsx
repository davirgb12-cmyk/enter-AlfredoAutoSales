import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Car, formatCurrency } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  Car as CarIcon,
  CheckCircle,
  DollarSign,
  Loader2,
  ArrowUpDown,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Car[];
    },
  });

  const stats = useMemo(() => {
    const available = cars.filter((c) => c.status === 'available');
    const sold = cars.filter((c) => c.status === 'sold');
    return {
      total: cars.length,
      available: available.length,
      sold: sold.length,
      totalInvested: cars.reduce((s, c) => s + c.cost_price, 0),
      potentialProfit: available.reduce((s, c) => s + (c.selling_price - c.cost_price), 0),
      realizedProfit: sold.reduce((s, c) => s + (c.selling_price - c.cost_price), 0),
    };
  }, [cars]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir veículo');
    } else {
      toast.success('Veículo excluído');
      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
    }
    setDeletingId(null);
  };

  const handleToggleStatus = async (car: Car) => {
    setTogglingId(car.id);
    const newStatus = car.status === 'available' ? 'sold' : 'available';
    const { error } = await supabase
      .from('cars')
      .update({ status: newStatus })
      .eq('id', car.id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(newStatus === 'sold' ? 'Marcado como vendido' : 'Marcado como disponível');
      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
    }
    setTogglingId(null);
  };

  const statCards = [
    {
      icon: CarIcon,
      label: 'Total de Carros',
      value: stats.total,
      sub: `${stats.available} disponíveis`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: CheckCircle,
      label: 'Vendidos',
      value: stats.sold,
      sub: 'veículos vendidos',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: DollarSign,
      label: 'Lucro Potencial',
      value: formatCurrency(stats.potentialProfit),
      sub: 'em estoque atual',
      color: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      icon: TrendingUp,
      label: 'Lucro Realizado',
      value: formatCurrency(stats.realizedProfit),
      sub: 'em carros vendidos',
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerencie seus veículos e acompanhe os resultados
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/admin/adicionar">
              <PlusCircle className="h-4 w-4" />
              Adicionar Carro
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className="bg-card rounded-xl p-4 border border-border shadow-card">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-sm font-medium text-card-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>

        {/* Cars Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">
              Veículos ({cars.length})
            </h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3 w-3" />
              Mais recentes primeiro
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CarIcon className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-foreground">Nenhum veículo cadastrado</p>
              <p className="text-sm mt-1 mb-4">Adicione seu primeiro carro para começar</p>
              <Button asChild size="sm">
                <Link to="/admin/adicionar">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Adicionar Carro
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 pl-4 font-medium text-muted-foreground">Veículo</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Preço Venda</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-amber-600">Custo</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-green-600">Lucro</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Margem</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-3 pr-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => {
                    const profit = car.selling_price - car.cost_price;
                    const margin =
                      car.cost_price > 0
                        ? ((profit / car.cost_price) * 100).toFixed(1)
                        : '—';

                    return (
                      <tr
                        key={car.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {car.images?.[0] ? (
                                <img
                                  src={car.images[0]}
                                  alt={car.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <CarIcon className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-card-foreground line-clamp-1">
                                {car.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {car.year} · {car.km.toLocaleString('pt-BR')} km · {car.fuel}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold text-card-foreground">
                          {formatCurrency(car.selling_price)}
                        </td>
                        <td className="p-3 text-right text-amber-700 font-medium">
                          {formatCurrency(car.cost_price)}
                        </td>
                        <td className={`p-3 text-right font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(profit)}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              profit >= 0
                                ? 'bg-success/10 text-success'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {margin === '—' ? '—' : `${margin}%`}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={
                              car.status === 'available'
                                ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                                : 'bg-muted text-muted-foreground'
                            }
                            variant="outline"
                          >
                            {car.status === 'available' ? 'Disponível' : 'Vendido'}
                          </Badge>
                        </td>
                        <td className="p-3 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 hover:bg-muted"
                              title="Ver"
                            >
                              <Link to={`/carro/${car.id}`} target="_blank">
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 hover:bg-muted"
                              title="Editar"
                            >
                              <Link to={`/admin/editar/${car.id}`}>
                                <Edit className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 px-1.5 hover:bg-muted text-xs"
                              onClick={() => handleToggleStatus(car)}
                              disabled={togglingId === car.id}
                              title={car.status === 'available' ? 'Marcar como vendido' : 'Marcar como disponível'}
                            >
                              {togglingId === car.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="Excluir"
                              onClick={() => setDeletingId(car.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O veículo será removido permanentemente.
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
