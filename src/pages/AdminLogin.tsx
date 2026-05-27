import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, Loader2, Zap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/types';

export default function AdminLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error);
          }
        } else {
          toast.success('Bem-vindo de volta!');
          navigate('/admin/dashboard');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada! Agora adicione seu primeiro anúncio.');
          navigate('/admin/adicionar');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Ver anúncios
            </Link>
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold mb-4 shadow-lg">
            <Zap className="h-8 w-8 text-gold-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">{APP_NAME}</h1>
          <p className="text-primary-foreground/60 text-sm mt-1">
            {mode === 'signup' ? 'Crie sua conta e anuncie grátis' : 'Entre na sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-card-foreground mb-1">
            {mode === 'login' ? 'Entrar' : 'Criar conta grátis'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === 'login'
              ? 'Acesse seus anúncios'
              : 'Cadastre-se para anunciar seu carro'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground h-11 mt-2 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar conta e anunciar'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            {mode === 'signup' ? (
              <div className="text-sm text-muted-foreground">
                <span>Já tem conta? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary font-medium hover:underline"
                >
                  Entrar
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <span>Não tem conta? </span>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary font-medium hover:underline"
                >
                  Cadastrar grátis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
