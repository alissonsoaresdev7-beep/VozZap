import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: err } = await resetPassword(email);
    if (err) {
      setError(err);
    } else {
      setSent(true);
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
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao login
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-[#25D366]" />
              </div>
              <h2 className="font-semibold text-lg text-foreground">E-mail enviado!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <p className="text-xs text-muted-foreground mt-3">Enviado para: <strong>{email}</strong></p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-2">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Enviar link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
