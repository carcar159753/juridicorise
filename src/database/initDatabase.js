const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const schemaSql = `
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

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  filename text not null,
  mime_type text,
  url text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_records_type on records(type);
create index if not exists idx_records_status on records(status);
create index if not exists idx_records_nome on records(nome);
create index if not exists idx_records_person_id on records(person_id);

alter table users enable row level security;
alter table records enable row level security;
alter table history enable row level security;
alter table signatures enable row level security;
alter table attachments enable row level security;
`;

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('ℹ️ DATABASE_URL não configurado. Auto-criação do banco ignorada.');
    console.log('ℹ️ Para criar tabelas automaticamente no deploy, adicione DATABASE_URL do Supabase no Render.');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔎 Verificando/criando tabelas do Supabase...');
    await client.connect();
    await client.query(schemaSql);

    const adminHash = await bcrypt.hash('159753', 10);
    const policeHash = await bcrypt.hash('159753', 10);

    await client.query(
      `insert into users (username, name, role, password_hash, active)
       values ($1,$2,$3,$4,true)
       on conflict (username) do update set
         name = excluded.name,
         role = excluded.role,
         password_hash = excluded.password_hash,
         active = true`,
      ['carcar', 'Carcar', 'adm_geral', adminHash]
    );

    await client.query(
      `insert into users (username, name, role, password_hash, active)
       values ($1,$2,$3,$4,true)
       on conflict (username) do update set
         name = excluded.name,
         role = excluded.role,
         password_hash = excluded.password_hash,
         active = true`,
      ['policia', 'Polícia Rise', 'policia', policeHash]
    );

    console.log('✅ Banco pronto e usuários padrão conferidos.');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    console.error('Confira DATABASE_URL do Supabase no Render.');
  } finally {
    await client.end().catch(() => {});
  }
}

module.exports = initDatabase;
