'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const categories = ['Ônibus', 'Compactadores', 'Cesto Aéreo', 'Picapes', 'Variados'];

export function VehicleList() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ plate: '', category: categories[0], brand: '', model: '', year: '', status: 'em_operacao' });

  const load = async () => {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    setVehicles(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return vehicles.filter((vehicle) =>
      [vehicle.plate, vehicle.category, vehicle.status].join(' ').toLowerCase().includes(filter.toLowerCase()),
    );
  }, [vehicles, filter]);

  const addVehicle = async (event) => {
    event.preventDefault();
    const { error } = await supabase.from('vehicles').insert({
      plate: form.plate.toUpperCase(),
      category: form.category,
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      status: form.status,
    });

    if (!error) {
      setForm({ plate: '', category: categories[0], brand: '', model: '', year: '', status: 'em_operacao' });
      load();
    }
  };

  return (
    <section className="space-y-6">
      <div className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Cadastro rápido de veículo</h2>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={addVehicle}>
          <input className="field" placeholder="Placa" value={form.plate} onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value }))} required />
          <select className="field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <input className="field" placeholder="Marca" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} required />
          <input className="field" placeholder="Modelo" value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} required />
          <input className="field" placeholder="Ano" type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} required />
          <select className="field" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="em_operacao">Em operação</option>
            <option value="em_manutencao">Em manutenção</option>
            <option value="parado">Parado</option>
            <option value="indisponivel">Indisponível</option>
          </select>
          <button className="btn-primary md:col-span-3">Salvar veículo</button>
        </form>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Veículos cadastrados</h2>
          <input className="field max-w-sm" placeholder="Buscar por placa, categoria ou status" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Placa</th><th className="p-2">Categoria</th><th className="p-2">Modelo</th><th className="p-2">Status</th><th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-100">
                  <td className="p-2 font-semibold">{vehicle.plate}</td>
                  <td className="p-2">{vehicle.category}</td>
                  <td className="p-2">{vehicle.brand} {vehicle.model}</td>
                  <td className="p-2">{vehicle.status.replaceAll('_', ' ')}</td>
                  <td className="p-2"><Link className="text-blue-700 hover:underline" href={`/dashboard/vehicles/${vehicle.id}`}>Abrir ficha</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
