import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-slate-500">Sistema Privado</p>
            <h1 className="text-lg font-bold text-blue-900">RCX Gestão de Frota</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
            <Link href="/dashboard/vehicles" className="btn-secondary">Veículos</Link>
            <form action="/login" className="inline">
              <button
                formAction={async () => {
                  'use server';
                  const supabaseServer = await createClient();
                  await supabaseServer.auth.signOut();
                }}
                className="btn-primary"
              >
                Sair ({user?.email})
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
