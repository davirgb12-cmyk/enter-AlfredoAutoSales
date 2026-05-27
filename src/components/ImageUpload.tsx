import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Upload, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length >= 6) {
      toast.error('Máximo de 6 imagens por carro');
      return;
    }
    setUploading(true);
    const newImages = [...images];

    for (const file of Array.from(files)) {
      if (newImages.length >= 6) break;
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }
      try {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filename, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filename);

        newImages.push(publicUrl);
      } catch (error) {
        toast.error('Erro ao enviar imagem');
        console.error(error);
      }
    }

    onChange(newImages);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveToFirst = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [item] = newImages.splice(index, 1);
    newImages.unshift(item);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {images.map((url, i) => (
          <div
            key={url + i}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted group"
          >
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => moveToFirst(i)}
                  className="bg-gold text-gold-foreground rounded-full p-0.5 hover:opacity-90 shadow"
                  title="Definir como principal"
                >
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-90 shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5 font-medium">
                Principal
              </div>
            )}
          </div>
        ))}

        {images.length < 6 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-border',
              'hover:border-primary transition-colors',
              'flex flex-col items-center justify-center gap-1',
              'text-muted-foreground hover:text-primary bg-muted/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-xs font-medium">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        Máximo 6 fotos. Passe o mouse sobre a foto para definir qual será a principal ou removê-la.
      </p>
    </div>
  );
}
