export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  color: string;
  fuel: string;
  transmission: string;
  description: string;
  selling_price: number;
  cost_price: number;
  images: string[];
  status: 'available' | 'sold';
  created_at: string;
  updated_at: string;
}

export type CarFormData = Omit<Car, 'id' | 'created_at' | 'updated_at'>;

export const FUEL_OPTIONS = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido'];
export const TRANSMISSION_OPTIONS = ['Manual', 'Automático', 'CVT'];
export const COLOR_OPTIONS = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul',
  'Verde', 'Amarelo', 'Laranja', 'Marrom', 'Bege', 'Outro'
];

export const WHATSAPP_NUMBER = '5562985006082';

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function formatKm(value: number): string {
  return value.toLocaleString('pt-BR') + ' km';
}
