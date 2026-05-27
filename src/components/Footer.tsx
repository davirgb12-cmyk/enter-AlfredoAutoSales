import { Phone, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WHATSAPP_NUMBER } from '@/lib/types';

export default function Footer() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá%20Alfredo!%20Vi%20seus%20carros%20no%20site%20e%20tenho%20interesse.`;

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gold rounded-lg p-1.5">
                <MessageCircle className="h-4 w-4 text-gold-foreground" />
              </div>
              <h3 className="text-xl font-bold">Alfredo Junior Veículos</h3>
            </div>
            <p className="text-primary-foreground/60 text-sm mb-5 max-w-sm">
              Carros usados selecionados com qualidade e transparência. Entre em contato e venha conhecer os nossos veículos.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Jussara, Goiás</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                <span>(62) 98500-6082</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center">
            <p className="text-sm text-primary-foreground/60 mb-3">
              Tem interesse em algum veículo?
            </p>
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-primary-foreground gap-2 shadow-lg"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 mt-10 pt-5 text-center text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Alfredo Junior Veículos · Jussara, GO · (62) 98500-6082
        </div>
      </div>
    </footer>
  );
}
