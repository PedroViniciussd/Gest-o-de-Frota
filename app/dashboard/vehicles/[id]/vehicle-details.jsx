'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function SectionForm({ title, fields, onSubmit }) {
  const [values, setValues] = useState({});
  return (
    <form
      className="card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
        setValues({});
      }}
    >
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {fields.map((field) => (
          <input
            key={field.name}
            className="field"
            placeholder={field.label}
            type={field.type ?? 'text'}
            required={field.required ?? true}
            value={values[field.name] ?? ''}
            onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
          />
        ))}
      </div>
      <button className="btn-primary mt-3">Adicionar</button>
    </form>
  );
}

export function VehicleDetails({ id }) {
  const supabase = createClient();
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);

  const load = async () => {
    const [{ data: vehicleData }, { data: historyData }] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', id).single(),
      supabase.from('audit_logs').select('*').eq('vehicle_id', id).order('created_at', { ascending: false }).limit(20),
    ]);

    setVehicle(vehicleData);
    setHistory(historyData ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const addRow = async (table, payload) => {
    await supabase.from(table).insert({ ...payload, vehicle_id: id });
    await load();
  };

  if (!vehicle) return <p>Carregando ficha...</p>;

  return (
    <section className="space-y-4">
      <div className="card p-5">
        <h2 className="text-2xl font-bold">{vehicle.plate} · {vehicle.brand} {vehicle.model}</h2>
        <p className="text-sm text-slate-600">Categoria: {vehicle.category} | Status: {vehicle.status.replaceAll('_', ' ')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionForm
          title="Documentação"
          fields={[{ name: 'document_type', label: 'Tipo (Emplacamento/AGERBA/Tacógrafo)' }, { name: 'status', label: 'Status (em_dia/vencido)' }, { name: 'expires_at', label: 'Data de vencimento', type: 'date' }]}
          onSubmit={(v) => addRow('vehicle_documents', v)}
        />
        <SectionForm
          title="Manutenção"
          fields={[{ name: 'maintenance_type', label: 'Tipo de manutenção' }, { name: 'description', label: 'Descrição' }, { name: 'workshop', label: 'Oficina' }, { name: 'return_forecast', label: 'Previsão de retorno', type: 'date' }, { name: 'status', label: 'Status (em_manutencao/aguardando_pecas/parado)' }]}
          onSubmit={(v) => addRow('vehicle_maintenances', v)}
        />
        <SectionForm
          title="Peças"
          fields={[{ name: 'name', label: 'Nome da peça' }, { name: 'supplier', label: 'Fornecedor' }, { name: 'installed_at', label: 'Data da instalação', type: 'date' }, { name: 'warranty_until', label: 'Garantia até', type: 'date', required: false }]}
          onSubmit={(v) => addRow('vehicle_parts', v)}
        />
        <SectionForm
          title="Pneus"
          fields={[{ name: 'old_serial', label: 'Série antiga' }, { name: 'new_serial', label: 'Série nova' }, { name: 'position', label: 'Posição no veículo' }, { name: 'condition', label: 'Condição (novo/meia_vida/careca)' }, { name: 'changed_at', label: 'Data da troca', type: 'date' }]}
          onSubmit={(v) => addRow('vehicle_tires', v)}
        />
      </div>

      <SectionForm
        title="Observação do mecânico"
        fields={[{ name: 'note', label: 'Observação operacional' }, { name: 'status_snapshot', label: 'Status atual do veículo' }]}
        onSubmit={(v) => addRow('vehicle_observations', v)}
      />

      <article className="card p-5">
        <h3 className="mb-2 text-lg font-bold">Histórico de auditoria</h3>
        <ul className="space-y-2 text-sm">
          {history.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold">{item.message}</p>
              <p className="text-slate-500">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
