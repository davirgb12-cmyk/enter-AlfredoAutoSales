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
  seller_name: string;
  seller_phone: string;
  seller_city: string;
  seller_state: string;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type CarFormData = Omit<Car, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const FUEL_OPTIONS = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido'];
export const TRANSMISSION_OPTIONS = ['Manual', 'Automático', 'CVT'];
export const COLOR_OPTIONS = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul',
  'Verde', 'Amarelo', 'Laranja', 'Marrom', 'Bege', 'Outro',
];
export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const APP_NAME = 'LeveMotors';
export const APP_TAGLINE = 'Compre e venda carros em Goiás';
export const APP_STATE = 'GO';
export const APP_STATE_LABEL = 'Goiás';

export function getWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return '55' + digits;
}

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

// Seller profile saved in localStorage between sessions
export const SELLER_PROFILE_KEY = 'levemotors_seller_profile';

export interface SellerProfile {
  seller_name: string;
  seller_phone: string;
  seller_city: string;
  seller_state: string;
}

export function loadSellerProfile(): SellerProfile {
  try {
    const raw = localStorage.getItem(SELLER_PROFILE_KEY);
    if (raw) return JSON.parse(raw) as SellerProfile;
  } catch {
    // ignore
  }
  return { seller_name: '', seller_phone: '', seller_city: '', seller_state: 'GO' };
}

export function saveSellerProfile(profile: SellerProfile): void {
  localStorage.setItem(SELLER_PROFILE_KEY, JSON.stringify(profile));
}
