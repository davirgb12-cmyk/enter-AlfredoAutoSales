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
  ChevronDown,
  MapPin,
  Menu,
  X,
  MessageSquare,
  UserRound,
} from 'lucide-react';
import { APP_NAME } from '@/lib/types';
import ProfileEditDialog from '@/components/ProfileEditDialog';

export default function Navbar() {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const avatarUrl    = user?.user_metadata?.avatar_url as string | undefined;
  const displayName  = user?.user_metadata?.display_name as string | undefined;

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

  const userInitial  = (displayName?.charAt(0) ?? user?.email?.charAt(0) ?? '?').toUpperCase();
  const userName     = displayName || user?.email || '';
  const at = (path: string) => location.pathname === path;

  /** Reusable avatar circle */
  function AvatarCircle({ size = 'sm' }: { size?: 'sm' | 'md' }) {
    const dim = size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
    return (
      <div className={`${dim} rounded-full bg-gold text-gold-foreground flex items-center justify-center font-bold shadow-sm overflow-hidden shrink-0`}>
        {avatarUrl
          ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          : userInitial}
      </div>
    );
  }

  return (
    <>
    <header className="sticky top-0 z-50">
      <nav className="navbar-bg">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center gap-6">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-gold/40 transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full">
                <rect width="200" height="200" fill="#002d54"/>
                <circle cx="100" cy="100" r="90" fill="none" stroke="#003d70" strokeWidth="4" strokeDasharray="8 4"/>
                <g transform="translate(20, 65) scale(0.65)">
                  <path d="M10,10 L40,50 L10,90 L25,90 L55,50 L25,10 Z" fill="#E1A624"/>
                  <path d="M35,10 L65,50 L35,90 L50,90 L80,50 L50,10 Z" fill="#1d4461"/>
                </g>
                <text x="80" y="105" fontFamily="'Montserrat', sans-serif" fontWeight="800" fontSize="25" fill="#E1A624">Leve</text>
                <text x="80" y="130" fontFamily="'Montserrat', sans-serif" fontWeight="800" fontSize="25" fill="#FFFFFF">Motors</text>
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[1.15rem] text-primary-foreground tracking-tight">
                {APP_NAME}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-gold border border-gold/40 rounded-md px-1.5 py-[2px] leading-none">
                GO
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-0.5 ml-2">
            <NavLink to="/" active={at('/')}>Anúncios</NavLink>
            {isAdmin && (
              <NavLink to="/admin/dashboard" active={at('/admin/dashboard')}>
                Painel
              </NavLink>
            )}
          </div>

          <div className="flex-1" />

          {/* ── Desktop right actions ────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <>
                {/* Messages */}
                <Link
                  to="/admin/dashboard"
                  title="Mensagens"
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/8 transition-all"
                >
                  <MessageSquare className="h-[18px] w-[18px]" />
                  {msgCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-gold text-gold-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {msgCount > 9 ? '9+' : msgCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 h-9 rounded-lg hover:bg-white/8 transition-colors group outline-none">
                      <AvatarCircle />
                      <ChevronDown className="h-3.5 w-3.5 text-primary-foreground/50 group-hover:text-primary-foreground/80 transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5">
                    <DropdownMenuLabel className="px-2 py-2 mb-1">
                      <div className="flex items-center gap-2.5">
                        <AvatarCircle size="md" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{userName || 'Minha conta'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer gap-2.5 py-2">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Meus Anúncios</span>
                        {msgCount > 0 && (
                          <Badge className="ml-auto text-[10px] h-4 px-1.5 bg-gold text-gold-foreground">
                            {msgCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/adicionar" className="cursor-pointer gap-2.5 py-2">
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                        Novo Anúncio
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setProfileOpen(true)}
                      className="cursor-pointer gap-2.5 py-2"
                    >
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      Editar Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer gap-2.5 py-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Anunciar CTA */}
                <Button
                  size="sm"
                  asChild
                  className="bg-gold hover:bg-gold/90 text-gold-foreground font-semibold gap-1.5 h-9 px-4 shadow-md hover:shadow-gold/30 transition-all"
                >
                  <Link to="/admin/adicionar">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Anunciar
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/8 h-9"
                >
                  <Link to="/admin">Entrar</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gold hover:bg-gold/90 text-gold-foreground font-semibold gap-1.5 h-9 px-4 shadow-md hover:shadow-gold/30 transition-all"
                >
                  <Link to="/admin">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Anunciar Grátis
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile right ─────────────────────────────────────────────── */}
          <div className="md:hidden flex items-center gap-1.5 ml-auto">
            {isAdmin && msgCount > 0 && (
              <Link
                to="/admin/dashboard"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-primary-foreground/70"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-gold text-gold-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/8 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ───────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="container mx-auto px-4 pt-3 pb-4 space-y-1">

              {/* Location pill */}
              <div className="flex items-center gap-1.5 text-[11px] text-primary-foreground/40 pb-3">
                <MapPin className="h-3 w-3" />
                <span>Goiás, Brasil · Anúncios 100% gratuitos</span>
              </div>

              {/* Nav */}
              <MobileItem to="/" onClick={() => setMobileOpen(false)}>
                Anúncios
              </MobileItem>

              {isAdmin ? (
                <>
                  <div className="pt-3 pb-1">
                    <p className="text-[10px] text-primary-foreground/35 uppercase tracking-widest font-semibold px-3 mb-2">
                      Conta
                    </p>
                    <MobileItem to="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 opacity-70" />
                      Painel
                      {msgCount > 0 && (
                        <span className="ml-auto text-[10px] bg-gold text-gold-foreground rounded-full px-1.5 py-0.5 font-bold leading-none">
                          {msgCount}
                        </span>
                      )}
                    </MobileItem>
                    <MobileItem to="/admin/adicionar" onClick={() => setMobileOpen(false)}>
                      <PlusCircle className="h-4 w-4 text-gold" />
                      <span className="font-semibold">Novo Anúncio</span>
                    </MobileItem>

                    <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl bg-white/5">
                      <AvatarCircle />
                      <span className="text-sm text-primary-foreground/70 truncate flex-1">{userName || user?.email}</span>
                      <button
                        onClick={handleSignOut}
                        className="text-primary-foreground/40 hover:text-destructive transition-colors"
                        title="Sair"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pt-3 space-y-2">
                  <MobileItem to="/admin" onClick={() => setMobileOpen(false)}>
                    Entrar na conta
                  </MobileItem>
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-gold-foreground font-semibold text-sm"
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

    <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
  </>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function NavLink({ to, active, children }: { to: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative px-3 h-9 flex items-center text-sm font-medium rounded-lg transition-all gap-1.5 ${
        active
          ? 'bg-white/12 text-primary-foreground'
          : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/8'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gold rounded-full" />
      )}
    </Link>
  );
}

function MobileItem({ to, onClick, children }: { to: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-primary-foreground/75 hover:text-primary-foreground hover:bg-white/8 transition-colors"
    >
      {children}
    </Link>
  );
}
