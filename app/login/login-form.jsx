'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InstallAppButton } from './install-app-button';

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  };

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="mb-2 text-2xl font-bold text-blue-900">RCX Locações e Serviços LTDA</h1>
      <p className="mb-6 text-sm text-slate-600">Gestão de Frota Privada</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input className="field" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar com segurança'}
        </button>
      </form>

      <div className="mt-4">
        <InstallAppButton />
      </div>
    </div>
  );
}
