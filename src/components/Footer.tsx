import { Link } from 'react-router-dom';
import { Zap, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE, APP_STATE_LABEL } from '@/lib/types';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gold rounded-lg p-1.5">
                <Zap className="h-4 w-4 text-gold-foreground" />
              </div>
              <h3 className="text-xl font-bold">{APP_NAME}</h3>
            </div>
            <p className="text-primary-foreground/60 text-sm max-w-xs">
              {APP_TAGLINE}. Anuncie seu carro gratuitamente e alcance compradores em todo o {APP_STATE_LABEL}.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary-foreground/70">
              Vendedores
            </h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li>
                <Link to="/admin" className="hover:text-primary-foreground transition-colors">
                  Criar conta grátis
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-primary-foreground transition-colors">
                  Entrar na minha conta
                </Link>
              </li>
              <li>
                <Link to="/admin/adicionar" className="hover:text-primary-foreground transition-colors">
                  Anunciar carro
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start md:items-end justify-start md:justify-center">
            <p className="text-sm text-primary-foreground/60 mb-3">
              Tem um carro para vender?
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-gold-foreground gap-2 font-semibold shadow-lg"
            >
              <Link to="/admin">
                <PlusCircle className="h-5 w-5" />
                Anunciar Grátis
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 mt-10 pt-5 text-center text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} {APP_NAME} · {APP_TAGLINE}
        </div>
      </div>
    </footer>
  );
}
