import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Car, formatCurrency, getWhatsAppNumber } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  SendHorizonal,
  User,
  MessageSquare,
  Car as CarIcon,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  car_id: string;
  content: string;
  sender_name: string;
  sender_type: 'buyer' | 'seller';
  user_id: string | null;
  created_at: string;
}

const BUYER_NAME_KEY = 'girocar_buyer_name';

export default function ChatPage() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [buyerName, setBuyerName] = useState(
    () => localStorage.getItem(BUYER_NAME_KEY) ?? ''
  );
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load car info
  const { data: car, isLoading: carLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .maybeSingle();
      if (error) throw error;
      return data as Car;
    },
    enabled: !!carId,
  });

  const isOwner = isAdmin && user?.id === car?.user_id;

  // Load messages
  useEffect(() => {
    if (!carId) return;
    setLoadingMsgs(true);
    supabase
      .from('messages')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoadingMsgs(false);
      });
  }, [carId]);

  // Realtime subscription
  useEffect(() => {
    if (!carId) return;
    const channel = supabase
      .channel(`chat-page-${carId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [carId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (!isOwner && !buyerName.trim()) {
      toast.error('Informe seu nome antes de enviar');
      return;
    }

    setSending(true);
    try {
      const payload: Partial<Message> = isOwner
        ? {
            car_id: carId,
            content: trimmed,
            sender_name: car?.seller_name || 'Vendedor',
            sender_type: 'seller',
            user_id: user!.id,
          }
        : {
            car_id: carId,
            content: trimmed,
            sender_name: buyerName.trim(),
            sender_type: 'buyer',
            user_id: null,
          };

      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw error;

      if (!isOwner) localStorage.setItem(BUYER_NAME_KEY, buyerName.trim());
      setContent('');
      textareaRef.current?.focus();
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (carLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-3">
        <p className="text-muted-foreground">Anúncio não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ir para os anúncios
        </Button>
      </div>
    );
  }

  const thumbnail = car.images?.[0];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground shrink-0 shadow-md">
        {/* Back row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-0">
          <button
            onClick={() => navigate(`/carro/${car.id}`)}
            className="flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao anúncio
          </button>
        </div>

        {/* Car info row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={car.title}
              className="w-12 h-12 rounded-lg object-cover shrink-0 ring-2 ring-primary-foreground/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
              <CarIcon className="h-6 w-6 text-primary-foreground/40" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-base leading-tight truncate">{car.title}</div>
            <div className="text-sm text-gold font-semibold">{formatCurrency(car.selling_price)}</div>
            {(car.seller_name || car.seller_city) && (
              <div className="flex items-center gap-1 text-[11px] text-primary-foreground/50 mt-0.5">
                {car.seller_name && <span>{car.seller_name}</span>}
                {car.seller_name && car.seller_city && <span>·</span>}
                {car.seller_city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {car.seller_city}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp shortcut */}
          {car.status === 'available' && getWhatsAppNumber(car.seller_phone) && (
            <a
              href={`https://wa.me/${getWhatsAppNumber(car.seller_phone)}?text=${encodeURIComponent(
                `Olá ${car.seller_name || ''}! Vi seu anúncio do ${car.title} no GiroCar. Ainda está disponível?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded-full px-3 py-1.5 font-semibold transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>

        {/* Divider with label */}
        <div className="flex items-center gap-3 px-4 pb-2.5">
          <MessageSquare className="h-3.5 w-3.5 text-primary-foreground/40" />
          <span className="text-[11px] text-primary-foreground/40 uppercase tracking-wide">
            {isOwner ? 'Mensagens recebidas' : 'Chat com o vendedor'}
          </span>
          {messages.length > 0 && (
            <span className="text-[11px] bg-primary-foreground/10 text-primary-foreground/60 rounded-full px-2 py-0.5">
              {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingMsgs ? (
          <div className="flex justify-center pt-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-16 gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-8 w-8 opacity-30" />
            </div>
            <p className="font-medium">Nenhuma mensagem ainda</p>
            {!isOwner && (
              <p className="text-sm text-center max-w-xs">
                Envie uma mensagem para o vendedor diretamente pelo chat abaixo.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">Conversa</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {messages.map((msg) => {
              const isSeller = msg.sender_type === 'seller';
              const isMe = isSeller ? isOwner : !isOwner;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                      isSeller
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {msg.sender_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[60%] ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] font-semibold text-foreground">
                        {isMe ? 'Você' : msg.sender_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card text-card-foreground border border-border rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 space-y-2.5">
        {car.status === 'sold' ? (
          <p className="text-center text-sm text-muted-foreground py-1">
            Este veículo já foi vendido.
          </p>
        ) : (
          <>
            {!isOwner && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Seu nome"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder={isOwner ? 'Responder ao comprador...' : 'Enviar mensagem ao vendedor...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="text-sm resize-none flex-1 min-h-0"
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSend}
                disabled={sending || !content.trim()}
                title="Enviar (Enter)"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-right">
              Enter para enviar · Shift+Enter nova linha
            </p>
          </>
        )}
      </div>
    </div>
  );
}
