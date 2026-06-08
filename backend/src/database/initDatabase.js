const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

async function ensureUser({ username, name, role, password }) {
  const password_hash = await bcrypt.hash(password, 10);

  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('id,username')
    .eq('username', username)
    .maybeSingle();

  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase
      .from('users')
      .update({ name, role, password_hash, active: true })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('users')
    .insert({ username, name, role, password_hash, active: true });

  if (error) throw error;
}

async function initDatabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado. Usuários padrão não foram conferidos.');
    return;
  }

  try {
    console.log('🔎 Conferindo usuários padrão no Supabase...');

    await ensureUser({
      username: 'carcar',
      name: 'Carcar',
      role: 'adm_geral',
      password: '159753'
    });

    await ensureUser({
      username: 'policia',
      name: 'Polícia Rise',
      role: 'policia',
      password: '159753'
    });

    console.log('✅ Usuários padrão prontos: carcar/159753 e policia/159753');
  } catch (error) {
    console.error('❌ Erro ao conferir usuários padrão:', error.message);
    console.error('Confira se as tabelas users, records e history existem no Supabase e se a Secret Key está correta.');
  }
}

module.exports = initDatabase;
