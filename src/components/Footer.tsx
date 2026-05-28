import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { APP_NAME, APP_STATE_LABEL } from '@/lib/types';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-gold-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg">{APP_NAME}</span>
              <span className="text-[9px] font-bold border border-gold/40 text-gold rounded-md px-1.5 py-[2px] tracking-wider">GO</span>
            </div>
            <p className="text-sm text-primary-foreground/50 max-w-xs">
              Marketplace de carros em {APP_STATE_LABEL}. Anúncios 100% gratuitos.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-primary-foreground/50">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Ver anúncios</Link>
            <Link to="/admin" className="hover:text-primary-foreground transition-colors">Entrar</Link>
            <Link to="/admin" className="hover:text-primary-foreground transition-colors">Anunciar grátis</Link>
          </nav>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-5 text-[11px] text-primary-foreground/30 text-center">
          © {new Date().getFullYear()} {APP_NAME} · Goiás, Brasil
        </div>
      </div>
    </footer>
  );
}
