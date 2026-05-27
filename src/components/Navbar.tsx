import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Car, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';

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
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="bg-gold rounded-lg p-1.5">
            <Car className="h-5 w-5 text-gold-foreground" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">Alfredo Junior Veículos</div>
            <div className="text-xs text-primary-foreground/60">Jussara, Goiás</div>
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
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/admin/adicionar">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Adicionar</span>
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/10 text-xs"
            >
              <Link to="/admin">Admin</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
