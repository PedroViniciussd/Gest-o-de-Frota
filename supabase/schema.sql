-- Extensões
create extension if not exists "pgcrypto";

-- Perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'funcionario')),
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  category text not null,
  brand text not null,
  model text not null,
  year int not null,
  status text not null check (status in ('em_operacao', 'em_manutencao', 'parado', 'indisponivel')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table if not exists public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  document_type text not null,
  status text not null,
  expires_at date not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.vehicle_maintenances (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  maintenance_type text not null,
  description text not null,
  workshop text not null,
  return_forecast date,
  status text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.vehicle_parts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  supplier text not null,
  installed_at date not null,
  warranty_until date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.vehicle_tires (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  old_serial text not null,
  new_serial text not null,
  position text not null,
  condition text not null,
  changed_at date not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.vehicle_observations (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  note text not null,
  status_snapshot text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid,
  vehicle_id uuid,
  user_id uuid references auth.users(id),
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_user_stamps()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then new.created_by = auth.uid(); end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.updated_by is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.audit_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_vehicle uuid;
  v_record uuid;
  v_name text;
begin
  if tg_op = 'DELETE' then
    v_vehicle := coalesce(old.vehicle_id, old.id);
    v_record := old.id;
  else
    v_vehicle := coalesce(new.vehicle_id, new.id);
    v_record := new.id;
  end if;

  select coalesce(full_name, email) into v_name
  from auth.users u left join public.profiles p on p.id = u.id
  where u.id = v_user;

  insert into public.audit_logs(table_name, action, record_id, vehicle_id, user_id, message, payload)
  values (
    tg_table_name,
    tg_op,
    v_record,
    v_vehicle,
    v_user,
    case tg_op
      when 'INSERT' then 'Criado pelo usuário ' || coalesce(v_name, 'N/A')
      when 'UPDATE' then 'Atualizado pelo usuário ' || coalesce(v_name, 'N/A')
      when 'DELETE' then 'Deletado pelo usuário ' || coalesce(v_name, 'N/A')
    end,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger trg_vehicle_updated_at before update on public.vehicles
for each row execute function public.handle_updated_at();

create trigger trg_vehicle_user before insert or update on public.vehicles
for each row execute function public.handle_user_stamps();

create trigger trg_audit_vehicles after insert or update or delete on public.vehicles
for each row execute function public.audit_changes();
create trigger trg_audit_vehicle_documents after insert or update or delete on public.vehicle_documents
for each row execute function public.audit_changes();
create trigger trg_audit_vehicle_maintenances after insert or update or delete on public.vehicle_maintenances
for each row execute function public.audit_changes();
create trigger trg_audit_vehicle_parts after insert or update or delete on public.vehicle_parts
for each row execute function public.audit_changes();
create trigger trg_audit_vehicle_tires after insert or update or delete on public.vehicle_tires
for each row execute function public.audit_changes();
create trigger trg_audit_vehicle_observations after insert or update or delete on public.vehicle_observations
for each row execute function public.audit_changes();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_documents enable row level security;
alter table public.vehicle_maintenances enable row level security;
alter table public.vehicle_parts enable row level security;
alter table public.vehicle_tires enable row level security;
alter table public.vehicle_observations enable row level security;
alter table public.audit_logs enable row level security;

create policy "authenticated_read_profiles" on public.profiles for select to authenticated using (true);
create policy "admin_write_profiles" on public.profiles for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "auth_read_vehicles" on public.vehicles for select to authenticated using (true);
create policy "auth_manage_vehicles" on public.vehicles for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

create policy "auth_access_docs" on public.vehicle_documents for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "auth_access_maintenances" on public.vehicle_maintenances for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "auth_access_parts" on public.vehicle_parts for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "auth_access_tires" on public.vehicle_tires for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "auth_access_observations" on public.vehicle_observations for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "auth_read_audits" on public.audit_logs for select to authenticated using (true);
