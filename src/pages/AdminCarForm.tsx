import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Car,
  CarFormData,
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
  COLOR_OPTIONS,
  VEHICLE_TYPES,
  ENGINE_POWER_OPTIONS,
  STEERING_OPTIONS,
  OPTIONALS_LIST,
  APP_STATE,
  APP_STATE_LABEL,
  formatCurrency,
  loadSellerProfile,
  saveSellerProfile,
} from '@/lib/types';
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
import { ArrowLeft, Save, TrendingUp, Loader2, AlertCircle, AlertTriangle, Gavel } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const defaultForm = (): CarFormData => {
  const profile = loadSellerProfile();
  return {
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
    seller_name: profile.seller_name,
    seller_phone: profile.seller_phone,
    seller_city: profile.seller_city,
    seller_state: profile.seller_state || 'GO',
    vehicle_type: '',
    engine_power: '',
    doors: 0,
    steering: '',
    optionals: [],
    auction_history: false,
    sinistro: false,
  };
};

export default function AdminCarForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
      const { selling_price, cost_price, images, status, title, brand, model,
        year, km, color, fuel, transmission, description,
        seller_name, seller_phone, seller_city, seller_state,
        vehicle_type, engine_power, doors, steering, optionals,
        auction_history, sinistro } = existingCar;
      setForm({
        selling_price, cost_price, images, status, title, brand, model,
        year, km, color, fuel, transmission, description,
        seller_name, seller_phone, seller_city, seller_state,
        vehicle_type: vehicle_type ?? '',
        engine_power: engine_power ?? '',
        doors: doors ?? 0,
        steering: steering ?? '',
        optionals: optionals ?? [],
        auction_history: auction_history ?? false,
        sinistro: sinistro ?? false,
      });
    }
  }, [existingCar]);

  // Auto-generate title from brand/model/year (only when adding new car)
  useEffect(() => {
    if (!isEditing && form.brand && form.model && form.year) {
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

  const toggleOptional = (opt: string) => {
    setForm((prev) => ({
      ...prev,
      optionals: prev.optionals?.includes(opt)
        ? prev.optionals.filter((o) => o !== opt)
        : [...(prev.optionals ?? []), opt],
    }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CarFormData, string>> = {};
    if (!form.title.trim()) e.title = 'Título obrigatório';
    if (!form.brand.trim()) e.brand = 'Marca obrigatória';
    if (!form.model.trim()) e.model = 'Modelo obrigatório';
    if (!form.year || form.year < 1950 || form.year > new Date().getFullYear() + 1)
      e.year = 'Ano inválido';
    if (form.km < 0) e.km = 'KM inválido';
    if (!form.selling_price || form.selling_price <= 0)
      e.selling_price = 'Preço de venda obrigatório';
    if (!form.seller_name.trim()) e.seller_name = 'Nome obrigatório';
    if (!form.seller_phone.trim()) e.seller_phone = 'Telefone obrigatório';
    if (!form.seller_city.trim()) e.seller_city = 'Cidade obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
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
        seller_name: form.seller_name.trim(),
        seller_phone: form.seller_phone.trim(),
        seller_city: form.seller_city.trim(),
        seller_state: APP_STATE,
        user_id: user?.id ?? null,
      };

      if (isEditing) {
        const { error } = await supabase.from('cars').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Anúncio atualizado!');
      } else {
        const { error } = await supabase.from('cars').insert(payload);
        if (error) throw error;
        toast.success('Anúncio publicado com sucesso!');
      }

      // Save seller profile for next time
      saveSellerProfile({
        seller_name: form.seller_name,
        seller_phone: form.seller_phone,
        seller_city: form.seller_city,
        seller_state: APP_STATE,
      });

      queryClient.invalidateQueries({ queryKey: ['cars-admin'] });
      queryClient.invalidateQueries({ queryKey: ['cars-public'] });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar anúncio. Tente novamente.');
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
              Meus Anúncios
            </Link>
          </Button>
          <div className="w-px h-5 bg-border" />
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Editar Anúncio' : 'Novo Anúncio'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-semibold text-card-foreground mb-4">Fotos do Veículo</h2>
            <ImageUpload
              images={form.images}
              onChange={(images) => setField('images', images)}
            />
          </div>

          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-card-foreground">Informações do Veículo</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Marca" required error={errors.brand}>
                <Input
                  placeholder="Ex: Volkswagen"
                  value={form.brand}
                  onChange={(e) => setField('brand', e.target.value)}
                  className={errors.brand ? 'border-destructive' : ''}
                />
              </Field>
              <Field label="Modelo" required error={errors.model}>
                <Input
                  placeholder="Ex: Gol"
                  value={form.model}
                  onChange={(e) => setField('model', e.target.value)}
                  className={errors.model ? 'border-destructive' : ''}
                />
              </Field>
            </div>

            <Field label="Título do Anúncio" required error={errors.title}>
              <Input
                placeholder="Ex: Volkswagen Gol 2018 - Excelente estado"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={errors.title ? 'border-destructive' : ''}
              />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Ano" required error={errors.year}>
                <Input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(e) => setField('year', Number(e.target.value))}
                  className={errors.year ? 'border-destructive' : ''}
                />
              </Field>
              <Field label="Quilometragem">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.km}
                  onChange={(e) => setField('km', Number(e.target.value))}
                />
              </Field>
              <Field label="Cor">
                <Select value={form.color} onValueChange={(v) => setField('color', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Combustível">
                <Select value={form.fuel} onValueChange={(v) => setField('fuel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUEL_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Câmbio">
                <Select value={form.transmission} onValueChange={(v) => setField('transmission', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Descrição">
              <Textarea
                placeholder="Descreva o estado do veículo, opcionais, revisões..."
                rows={4}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="resize-none"
              />
            </Field>
          </div>

          {/* Characteristics */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-5">
            <h2 className="font-semibold text-card-foreground">Características do Veículo</h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Tipo de Veículo">
                <Select value={form.vehicle_type || ''} onValueChange={(v) => setField('vehicle_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Potência do Motor">
                <Select value={form.engine_power || ''} onValueChange={(v) => setField('engine_power', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {ENGINE_POWER_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Portas">
                <Select value={form.doors ? String(form.doors) : ''} onValueChange={(v) => setField('doors', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 portas</SelectItem>
                    <SelectItem value="4">4 portas</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Direção">
              <Select value={form.steering || ''} onValueChange={(v) => setField('steering', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {STEERING_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* Optionals */}
            <div className="space-y-3">
              <Label>Opcionais</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                {OPTIONALS_LIST.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      checked={form.optionals?.includes(opt) ?? false}
                      onCheckedChange={() => toggleOptional(opt)}
                      id={`opt-${opt}`}
                    />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors select-none">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle History */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-card-foreground">Histórico do Veículo</h2>
            <p className="text-xs text-muted-foreground -mt-1">
              Informe honestamente — isso ajuda compradores e protege você de disputas futuras.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors group">
                <Checkbox
                  id="auction"
                  checked={form.auction_history ?? false}
                  onCheckedChange={(v) => setField('auction_history', !!v)}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Gavel className="h-3.5 w-3.5 text-amber-500" />
                    Passagem por leilão
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O veículo foi vendido em leilão em algum momento.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors">
                <Checkbox
                  id="sinistro"
                  checked={form.sinistro ?? false}
                  onCheckedChange={(v) => setField('sinistro', !!v)}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    Histórico de sinistro
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O veículo sofreu colisão, alagamento ou outro sinistro registrado.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Seller Contact */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-card-foreground">Seus Dados de Contato</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Essas informações aparecem no anúncio para que compradores entrem em contato direto com você.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Seu Nome" required error={errors.seller_name}>
                <Input
                  placeholder="Ex: João Silva"
                  value={form.seller_name}
                  onChange={(e) => setField('seller_name', e.target.value)}
                  className={errors.seller_name ? 'border-destructive' : ''}
                />
              </Field>
              <Field label="WhatsApp / Telefone" required error={errors.seller_phone}>
                <Input
                  placeholder="Ex: (62) 98500-0000"
                  value={form.seller_phone}
                  onChange={(e) => setField('seller_phone', e.target.value)}
                  className={errors.seller_phone ? 'border-destructive' : ''}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cidade" required error={errors.seller_city}>
                <Input
                  placeholder="Ex: Jussara"
                  value={form.seller_city}
                  onChange={(e) => setField('seller_city', e.target.value)}
                  className={errors.seller_city ? 'border-destructive' : ''}
                />
              </Field>
              <Field label="Estado">
                <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted text-sm text-muted-foreground gap-1.5">
                  <span className="font-semibold text-foreground">{APP_STATE}</span>
                  <span>– {APP_STATE_LABEL}</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card rounded-xl border border-primary/20 p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <h2 className="font-semibold text-card-foreground">Valores</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                Custo visível só para você
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Preço de Venda" required error={errors.selling_price}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    className={`pl-9 ${errors.selling_price ? 'border-destructive' : ''}`}
                    value={form.selling_price || ''}
                    onChange={(e) => setField('selling_price', Number(e.target.value))}
                  />
                </div>
              </Field>
              <Field label="Custo Total (privado)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    className="pl-9"
                    value={form.cost_price || ''}
                    onChange={(e) => setField('cost_price', Number(e.target.value))}
                  />
                </div>
              </Field>
            </div>

            {form.selling_price > 0 && form.cost_price > 0 && (
              <div className={`flex items-center justify-between p-3 rounded-lg ${profit >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                  <span className="text-sm font-medium text-card-foreground">Lucro previsto</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(profit)}
                  </div>
                  {margin && <div className="text-xs text-muted-foreground">margem de {margin}%</div>}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-card-foreground">Status</h2>
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
            <Button type="submit" disabled={saving} className="gap-2 px-8 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Salvar Alterações' : 'Publicar Anúncio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper component for labeled fields
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
