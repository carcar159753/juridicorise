const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

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

async function ensureDefaultUsersWithSupabaseApi() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado. Usuários padrão não foram conferidos.');
    return;
  }

  console.log('🔎 Conferindo usuários padrão no Supabase...');

  const adminHash = await bcrypt.hash('159753', 10);
  const policeHash = await bcrypt.hash('159753', 10);

  const { error: adminError } = await supabase
    .from('users')
    .upsert({
      username: 'carcar',
      name: 'Carcar',
      role: 'adm_geral',
      password_hash: adminHash,
      active: true
    }, { onConflict: 'username' });

  if (adminError) throw adminError;

  const { error: policeError } = await supabase
    .from('users')
    .upsert({
      username: 'policia',
      name: 'Polícia Rise',
      role: 'policia',
      password_hash: policeHash,
      active: true
    }, { onConflict: 'username' });

  if (policeError) throw policeError;

  console.log('✅ Usuários padrão prontos: carcar/159753 e policia/159753');
}

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
      console.log('🔎 Verificando/criando tabelas do Supabase...');
      await client.connect();
      await client.query(schemaSql);
      console.log('✅ Tabelas conferidas via DATABASE_URL.');
    } catch (error) {
      console.error('❌ Erro ao inicializar banco via DATABASE_URL:', error.message);
      console.error('Se não usar DATABASE_URL, rode supabase/schema.sql manualmente no Supabase.');
    } finally {
      await client.end().catch(() => {});
    }
  } else {
    console.log('ℹ️ DATABASE_URL não configurado. Pulando criação automática de tabelas.');
    console.log('ℹ️ Se as tabelas ainda não existirem, rode supabase/schema.sql no Supabase.');
  }

  try {
    await ensureDefaultUsersWithSupabaseApi();
  } catch (error) {
    console.error('❌ Erro ao conferir usuários padrão:', error.message);
    console.error('Confira se as tabelas users, records e history existem no Supabase e se a Secret Key está correta.');
  }
}

module.exports = initDatabase;
