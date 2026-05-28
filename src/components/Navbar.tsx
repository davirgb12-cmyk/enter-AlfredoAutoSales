import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Zap,
  Bell,
  ChevronDown,
  MapPin,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import { APP_NAME } from '@/lib/types';

export default function Navbar() {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch unread buyer message count for this seller
  const { data: msgCount = 0 } = useQuery({
    queryKey: ['msg-count-navbar', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: cars } = await supabase
        .from('cars')
        .select('id')
        .or(`user_id.eq.${user.id},user_id.is.null`);
      if (!cars?.length) return 0;
      const ids = cars.map((c) => c.id);
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('car_id', ids)
        .eq('sender_type', 'buyer');
      return count ?? 0;
    },
    enabled: !!user?.id && isAdmin,
    refetchInterval: 30_000,
  });

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">
      {/* ── Top identity bar ──────────────────────────────────────────────── */}
      <div className="bg-foreground text-background text-[11px] hidden md:block">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-background/70">
            <MapPin className="h-3 w-3" />
            <span>
              <span className="font-semibold text-background">GiroCar</span>
              {' '}— Marketplace de carros em{' '}
              <span className="font-semibold text-background">Goiás, Brasil</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-background/60">
            <span className="flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" />
              Anúncios 100% gratuitos
            </span>
            {!isAdmin && (
              <Link
                to="/admin"
                className="text-background/80 hover:text-background underline underline-offset-2 transition-colors"
              >
                Cadastre-se grátis
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main navbar ────────────────────────────────────────────────────── */}
      <nav className="bg-primary text-primary-foreground shadow-lg border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
            onClick={() => setMobileOpen(false)}
          >
            <div className="bg-gold rounded-lg p-1.5 shadow-sm">
              <Zap className="h-5 w-5 text-gold-foreground" />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg">{APP_NAME}</span>
                <span className="text-[9px] font-bold bg-gold/25 text-gold border border-gold/40 rounded px-1.5 py-0.5 tracking-wider">
                  GO
                </span>
              </div>
              <div className="text-[10px] text-primary-foreground/50 mt-0.5">
                Goiás · Compra e venda
              </div>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Desktop nav ─────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <>
                {/* Divider group: navigation */}
                <div className="flex items-center gap-1 pr-3 border-r border-primary-foreground/15">
                  <NavLink to="/" active={isActive('/')}>
                    Anúncios
                  </NavLink>
                </div>

                {/* Divider group: listings actions */}
                <div className="flex items-center gap-1 px-3 border-r border-primary-foreground/15">
                  <NavLink to="/admin/dashboard" active={isActive('/admin/dashboard')}>
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Meus Anúncios
                  </NavLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-gold hover:bg-primary-foreground/10 hover:text-gold font-semibold h-8 px-2.5 gap-1"
                  >
                    <Link to="/admin/adicionar">
                      <PlusCircle className="h-3.5 w-3.5" />
                      Anunciar
                    </Link>
                  </Button>
                </div>

                {/* Divider group: notifications + account */}
                <div className="flex items-center gap-1.5 pl-3">
                  {/* Messages badge */}
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="relative h-8 w-8 p-0 hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground"
                    title={`${msgCount} mensagens`}
                  >
                    <Link to="/admin/dashboard">
                      <MessageSquare className="h-4 w-4" />
                      {msgCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-0.5">
                          {msgCount > 9 ? '9+' : msgCount}
                        </span>
                      )}
                    </Link>
                  </Button>

                  {/* User dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1.5 hover:bg-primary-foreground/10 text-primary-foreground"
                      >
                        <div className="w-6 h-6 rounded-full bg-gold text-gold-foreground flex items-center justify-center text-[11px] font-bold shadow-sm">
                          {userInitial}
                        </div>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 mt-1">
                      <DropdownMenuLabel className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">
                              Minha conta
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Meus Anúncios
                          {msgCount > 0 && (
                            <Badge className="ml-auto text-[10px] h-4 px-1.5 bg-destructive text-destructive-foreground">
                              {msgCount}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/adicionar" className="cursor-pointer">
                          <PlusCircle className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Novo Anúncio
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-2" />
                        Sair da conta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/" active={isActive('/')}>
                  Anúncios
                </NavLink>
                <div className="w-px h-5 bg-primary-foreground/15 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8"
                >
                  <Link to="/admin">Entrar</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold gap-1.5 h-8"
                >
                  <Link to="/admin">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Anunciar Grátis
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* ── Mobile: hamburger ──────────────────────────────────────── */}
          <div className="md:hidden flex items-center gap-2">
            {isAdmin && msgCount > 0 && (
              <Link to="/admin/dashboard" className="relative">
                <Bell className="h-5 w-5 text-primary-foreground/70" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-1.5 text-primary-foreground/80 hover:text-primary-foreground"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-primary-foreground/15 bg-primary">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {/* Goiás identity on mobile */}
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/50 pb-2 border-b border-primary-foreground/10">
                <MapPin className="h-3 w-3" />
                GiroCar · Marketplace de carros em Goiás
              </div>

              <MobileLink to="/" onClick={() => setMobileOpen(false)}>
                Anúncios
              </MobileLink>

              {isAdmin ? (
                <>
                  <div className="pt-2 border-t border-primary-foreground/10">
                    <div className="text-[10px] text-primary-foreground/40 uppercase tracking-wide px-2 mb-1">
                      Meus Anúncios
                    </div>
                    <MobileLink to="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painel
                      {msgCount > 0 && (
                        <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-bold">
                          {msgCount} msg
                        </span>
                      )}
                    </MobileLink>
                    <MobileLink to="/admin/adicionar" onClick={() => setMobileOpen(false)}>
                      <PlusCircle className="h-4 w-4 mr-2 text-gold" />
                      <span className="text-gold font-semibold">Novo Anúncio</span>
                    </MobileLink>
                  </div>

                  <div className="pt-2 border-t border-primary-foreground/10">
                    <div className="text-[10px] text-primary-foreground/40 uppercase tracking-wide px-2 mb-1">
                      Conta
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-primary-foreground/60">
                      <div className="w-6 h-6 rounded-full bg-gold text-gold-foreground flex items-center justify-center text-[10px] font-bold">
                        {userInitial}
                      </div>
                      <span className="truncate text-primary-foreground/70">{user?.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-2 py-2 text-sm text-destructive w-full rounded-md hover:bg-primary-foreground/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da conta
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-2 border-t border-primary-foreground/10 space-y-1.5">
                  <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>
                    Entrar na conta
                  </MobileLink>
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-gold text-gold-foreground font-semibold text-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Anunciar Grátis
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={`h-8 px-3 gap-1.5 text-sm transition-all ${
        active
          ? 'bg-primary-foreground/15 text-primary-foreground font-semibold'
          : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
      }`}
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}

function MobileLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-2.5 text-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5 rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}
