create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  name text not null,
  role text not null check (role in ('adm_geral','admin','policia','advogado','juiz')),
  password_hash text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  person_id text,
  nome text,
  telefone text,
  sexo text,
  status text default 'Pendente',
  data jsonb default '{}'::jsonb,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  role_label text not null,
  signature_url text,
  created_at timestamptz default now()
);

alter table users enable row level security;
alter table records enable row level security;
alter table history enable row level security;
alter table signatures enable row level security;

-- O backend usa SERVICE_ROLE_KEY, então ignora RLS com segurança no servidor.
