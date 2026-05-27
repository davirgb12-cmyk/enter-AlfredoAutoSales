import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  SendHorizonal,
  Loader2,
  User,
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

interface Props {
  car: Car;
}

const BUYER_NAME_KEY = 'girocar_buyer_name';

export default function ChatPanel({ car }: Props) {
  const { isAdmin, user } = useAuth();
  const isOwner = isAdmin && user?.id === car.user_id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [buyerName, setBuyerName] = useState(
    () => localStorage.getItem(BUYER_NAME_KEY) ?? ''
  );
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!open) return;
    setLoadingMsgs(true);
    supabase
      .from('messages')
      .select('*')
      .eq('car_id', car.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoadingMsgs(false);
      });
  }, [car.id, open]);

  // Realtime subscription
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`chat-${car.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `car_id=eq.${car.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates from optimistic update
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [car.id, open]);

  // Auto-scroll
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
            car_id: car.id,
            content: trimmed,
            sender_name: car.seller_name || 'Vendedor',
            sender_type: 'seller',
            user_id: user!.id,
          }
        : {
            car_id: car.id,
            content: trimmed,
            sender_name: buyerName.trim(),
            sender_type: 'buyer',
            user_id: null,
          };

      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw error;

      if (!isOwner) localStorage.setItem(BUYER_NAME_KEY, buyerName.trim());
      setContent('');
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

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="font-semibold text-card-foreground text-sm">
            {isOwner ? 'Mensagens recebidas' : 'Falar com o vendedor'}
          </span>
          {messages.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              {messages.length}
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {open ? 'Fechar ▲' : 'Abrir ▼'}
        </span>
      </button>

      {open && (
        <div className="border-t border-border flex flex-col" style={{ maxHeight: 420 }}>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
            {loadingMsgs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <MessageCircle className="h-8 w-8 opacity-20" />
                <p>Nenhuma mensagem ainda.</p>
                {!isOwner && <p className="text-xs">Envie uma mensagem para o vendedor!</p>}
              </div>
            ) : (
              messages.map((msg) => {
                const isSeller = msg.sender_type === 'seller';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isSeller ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      isSeller
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${isSeller ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium ${isSeller ? 'text-primary' : 'text-muted-foreground'}`}>
                          {isSeller ? msg.sender_name : msg.sender_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <div className={`px-3 py-2 rounded-xl text-sm leading-snug ${
                        isSeller
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted text-foreground rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          {car.status === 'available' && (
            <div className="border-t border-border p-3 space-y-2 bg-muted/30">
              {!isOwner && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Seu nome"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder={isOwner ? 'Responder...' : 'Sua mensagem...'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="text-sm resize-none flex-1 min-h-0"
                />
                <Button
                  size="sm"
                  className="self-end gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-3"
                  onClick={handleSend}
                  disabled={sending || !content.trim()}
                >
                  {sending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <SendHorizonal className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-right">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
