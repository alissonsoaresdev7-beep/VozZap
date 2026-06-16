import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }
    if (!form.username.trim()) {
      setError('Username é obrigatório');
      return;
    }
    if (!form.email.trim()) {
      setError('E-mail é obrigatório');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error: err } = await signUp(form.email, form.password, form.username, form.fullName);
      if (err) {
        // Melhorar exibição de erro
        const errorMsg = typeof err === 'string' ? err : JSON.stringify(err);
        setError(
          errorMsg === '{}' 
            ? 'Erro ao conectar com o servidor. Verifique as credenciais do Supabase em .env' 
            : errorMsg.includes('already') 
            ? 'Este e-mail já está cadastrado' 
            : errorMsg.includes('duplicate')
            ? 'Este username já está em uso'
            : errorMsg || 'Erro ao criar conta. Tente novamente'
        );
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError('Erro ao criar conta: ' + message);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Conta criada!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Bem-vindo ao VozZap! Confirmação de e-mail enviada (se configurado no Supabase).
          </p>
          <p className="text-xs text-muted-foreground mt-4">Redirecionando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">🎙</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">VozZap</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie sua conta grátis</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-5">Cadastro</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              name="fullName"
              type="text"
              placeholder="Seu nome"
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <div className="relative">
              <Input
                label="Username"
                name="username"
                type="text"
                placeholder="seuusuario"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="E-mail"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div className="relative">
              <Input
                label="Senha"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Criar conta
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-[#25D366] font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
