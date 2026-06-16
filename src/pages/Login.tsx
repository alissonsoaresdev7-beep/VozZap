import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err.includes('Invalid') ? 'E-mail ou senha incorretos' : err);
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">🎙</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">VozZap</h1>
          <p className="text-muted-foreground text-sm mt-1">Sua voz, seu mundo</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-5">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 mt-3" />
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 mt-3" />
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Entrar
            </Button>
          </form>

          <Link
            to="/esqueci-senha"
            className="block text-center text-sm text-[#25D366] hover:underline mt-4"
          >
            Esqueci minha senha
          </Link>
        </div>

        {/* Registro */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-[#25D366] font-semibold hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
