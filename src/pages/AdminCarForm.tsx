import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Car, CarFormData, FUEL_OPTIONS, TRANSMISSION_OPTIONS, COLOR_OPTIONS, formatCurrency } from '@/lib/types';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const defaultForm: CarFormData = {
  title: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  km: 0,
  color: 'Branco',
  fuel: 'Flex',
  transmission: 'Manual',
  description: '',
  selling_price: 0,
  cost_price: 0,
  images: [],
  status: 'available',
};

export default function AdminCarForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState<CarFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CarFormData, string>>>({});

  const { data: existingCar, isLoading } = useQuery({
    queryKey: ['car-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Car;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingCar) {
      const { id: _, created_at, updated_at, ...rest } = existingCar;
      setForm(rest as CarFormData);
    }
  }, [existingCar]);

  // Auto-generate title when brand/model/year change
  useEffect(() => {
    if (form.brand && form.model && form.year && !isEditing) {
      setForm((prev) => ({
        ...prev,
        title: `${form.brand} ${form.model} ${form.year}`,
      }));
    }
  }, [form.brand, form.model, form.year, isEditing]);

  const setField = <K extends keyof CarFormData>(key: K, value: CarFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CarFormData, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Título obrigatório';
    if (!form.brand.trim()) newErrors.brand = 'Marca obrigatória';
    if (!form.model.trim()) newErrors.model = 'Modelo obrigatório';
    if (!form.year || form.year < 1950 || form.year > new Date().getFullYear() + 1)
      newErrors.year = 'Ano inválido';
    if (form.km < 0) newErrors.km = 'KM inválido';
    if (!form.selling_price || form.selling_price <= 0)
      newErrors.selling_price = 'Preço de venda obrigatório';
    if (form.cost_price < 0) newErrors.cost_price = 'Custo inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrija os campos destacados');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description.trim(),
      };

      if (isEditing) {
        const { error } = await supabase.from('cars').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Veículo atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('cars').insert(payload);
        if (error) throw error;
        toast.success('Veículo adicionado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar veículo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const profit = form.selling_price - form.cost_price;
  const margin =
    form.cost_price > 0 ? ((profit / form.cost_price) * 100).toFixed(1) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <div className="w-px h-5 bg-border" />
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Editar Veículo' : 'Adicionar Veículo'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-semibold text-card-foreground mb-4">Fotos</h2>
            <ImageUpload
              images={form.images}
              onChange={(images) => setField('images', images)}
            />
          </div>

          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-card-foreground">Informações Básicas</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand">
                  Marca <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  placeholder="Ex: Volkswagen"
                  value={form.brand}
                  onChange={(e) => setField('brand', e.target.value)}
                  className={errors.brand ? 'border-destructive' : ''}
                />
                {errors.brand && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.brand}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model">
                  Modelo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  placeholder="Ex: Gol"
                  value={form.model}
                  onChange={(e) => setField('model', e.target.value)}
                  className={errors.model ? 'border-destructive' : ''}
                />
                {errors.model && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.model}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">
                Título do Anúncio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Volkswagen Gol 2018 - Excelente estado"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year">
                  Ano <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(e) => setField('year', Number(e.target.value))}
                  className={errors.year ? 'border-destructive' : ''}
                />
                {errors.year && (
                  <p className="text-xs text-destructive">{errors.year}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="km">Quilometragem</Label>
                <Input
                  id="km"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.km}
                  onChange={(e) => setField('km', Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Cor</Label>
                <Select value={form.color} onValueChange={(v) => setField('color', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Combustível</Label>
                <Select value={form.fuel} onValueChange={(v) => setField('fuel', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Câmbio</Label>
                <Select value={form.transmission} onValueChange={(v) => setField('transmission', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o estado do veículo, opcionais, histórico de revisões..."
                rows={4}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          {/* Pricing (Admin Only) */}
          <div className="bg-card rounded-xl border border-primary/20 p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <h2 className="font-semibold text-card-foreground">Valores</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                Apenas você vê o custo
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="selling_price">
                  Preço de Venda <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="selling_price"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    className={`pl-9 ${errors.selling_price ? 'border-destructive' : ''}`}
                    value={form.selling_price || ''}
                    onChange={(e) => setField('selling_price', Number(e.target.value))}
                  />
                </div>
                {errors.selling_price && (
                  <p className="text-xs text-destructive">{errors.selling_price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost_price" className="flex items-center gap-1.5">
                  Custo Total
                  <span className="text-xs text-muted-foreground font-normal">(privado)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="cost_price"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    className="pl-9"
                    value={form.cost_price || ''}
                    onChange={(e) => setField('cost_price', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Profit Preview */}
            {form.selling_price > 0 && form.cost_price > 0 && (
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  profit >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                  <span className="text-sm font-medium text-card-foreground">Lucro previsto</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(profit)}
                  </div>
                  {margin && (
                    <div className="text-xs text-muted-foreground">margem de {margin}%</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-card-foreground">Status do Veículo</h2>
            <div className="flex gap-3">
              {(['available', 'sold'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField('status', s)}
                  className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.status === s
                      ? s === 'available'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-muted-foreground bg-muted text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {s === 'available' ? 'Disponível para venda' : 'Vendido'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pb-8">
            <Button variant="outline" type="button" asChild>
              <Link to="/admin/dashboard">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving} className="gap-2 px-8">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Salvar Alterações' : 'Adicionar Carro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
