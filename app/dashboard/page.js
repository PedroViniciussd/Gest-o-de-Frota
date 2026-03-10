import { createClient } from '@/lib/supabase/server';

function AlertCard({ title, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    red: 'bg-red-50 text-red-900 border-red-200',
  };

  return (
    <article className={`card border p-4 ${tones[tone]}`}>
      <p className="text-sm">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ count: vehicles }, { count: inMaintenance }, { count: expiringDocs }, { count: waitingParts }] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'em_manutencao'),
    supabase.from('vehicle_documents').select('*', { count: 'exact', head: true }).lte('expires_at', new Date(Date.now() + 10 * 86400000).toISOString()),
    supabase.from('vehicle_maintenances').select('*', { count: 'exact', head: true }).eq('status', 'aguardando_pecas'),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard da Frota</h2>
        <p className="text-sm text-slate-600">Visão geral com alertas automáticos de vencimentos e status operacional.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AlertCard title="Total de veículos" value={vehicles ?? 0} />
        <AlertCard title="Veículos em manutenção" value={inMaintenance ?? 0} tone="amber" />
        <AlertCard title="Documentos vencendo (10 dias)" value={expiringDocs ?? 0} tone="red" />
        <AlertCard title="Aguardando peças" value={waitingParts ?? 0} tone="amber" />
      </div>
    </section>
  );
}
