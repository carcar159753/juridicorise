require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');

async function upsertUser(username, name, role, password){
  const password_hash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('users').upsert({ username, name, role, password_hash, active:true }, { onConflict:'username' });
  if(error) throw error;
  console.log(`✅ Usuário pronto: ${username} / ${password} (${role})`);
}

(async()=>{
  await upsertUser('carcar','Carcar','adm_geral','159753');
  await upsertUser('policia','Polícia Rise','policia','159753');
  console.log('Seed finalizado.');
})().catch(e=>{ console.error(e); process.exit(1); });
