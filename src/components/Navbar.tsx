import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, PlusCircle, Zap } from 'lucide-react';
import { APP_NAME } from '@/lib/types';

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="bg-gold rounded-lg p-1.5">
            <Zap className="h-5 w-5 text-gold-foreground" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">{APP_NAME}</div>
            <div className="text-xs text-primary-foreground/60 leading-none">Compre e venda carros</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {isAdmin ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/admin/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Meus Anúncios</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-gold hover:bg-primary-foreground/10 font-semibold"
              >
                <Link to="/admin/adicionar">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Anunciar</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                asChild
                className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold gap-1.5"
              >
                <Link to="/admin">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Anunciar Grátis
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
