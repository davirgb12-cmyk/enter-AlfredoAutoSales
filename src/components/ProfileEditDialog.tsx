import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileEditDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const currentName   = user?.user_metadata?.display_name as string | undefined;

  const [name, setName]       = useState(currentName ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state whenever dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName ?? '');
      setPreview(null);
      setFile(null);
    }
  }, [open, currentName]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const avatarSrc   = preview ?? currentAvatar;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast({
        title: 'Imagem muito grande',
        description: 'Selecione uma imagem de até 2 MB.',
        variant: 'destructive',
      });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let avatarUrl = currentAvatar;

      if (file) {
        const ext  = file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        data: {
          avatar_url:   avatarUrl,
          display_name: name.trim() || undefined,
        },
      });
      if (updateErr) throw updateErr;

      toast({ title: 'Perfil atualizado!' });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          {/* Avatar — input transparent overlay, works on iOS/Android */}
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold overflow-hidden ring-2 ring-border shadow-md">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            {/* Camera badge */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gold text-gold-foreground rounded-full flex items-center justify-center shadow-sm pointer-events-none z-10">
              <Camera className="h-4 w-4" />
            </div>
            {/* Transparent overlay input — most reliable on mobile */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
              style={{ fontSize: 0 }}
            />
          </div>

          {/* Display name */}
          <div className="w-full space-y-1.5">
            <Label htmlFor="display-name">Nome de exibição</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          {/* Email (read-only) */}
          <div className="w-full space-y-1">
            <Label className="text-muted-foreground text-xs">E-mail (não editável)</Label>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
