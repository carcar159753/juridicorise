require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const { sign, requireAuth, requireModule, requireAdmin, allowed } = require('./auth');
const { generatePremiumPDF } = require('./pdf');
const initDatabase = require('./database/initDatabase');

const app = express();
const PORT = process.env.PORT || 3000;
const modules = ['processos','mandados','porte_armas','troca_nome','registro_familiar','patente_nome','certidao_nascimento','certidao_adocao','alvara_funcionamento','documentos_diversos','obito','audiencias'];

app.use(cors({ origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true, credentials:true }));
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname, '../public')));

async function log(user, action, table_name, record_id, details={}){
  await supabase.from('history').insert({ user_id:user?.id, action, table_name, record_id, details });
}

app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body;

  console.log('LOGIN TENTANDO:', username);

  const { data:user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('active', true)
    .single();

  console.log('ERRO SUPABASE:', error);
  console.log('USUARIO ACHADO:', user?.username, user?.role, user?.active);
  console.log('HASH:', user?.password_hash);

  if(error || !user) {
    return res.status(401).json({ error:'Usuário não encontrado ou inativo' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);

  console.log('SENHA CONFERE:', ok);

  if(!ok) {
    return res.status(401).json({ error:'Senha incorreta' });
  }

  await log(user,'LOGIN','users',user.id,{username:user.username});

  res.json({
    token: sign(user),
    user:{
      id:user.id,
      username:user.username,
      name:user.name,
      role:user.role
    }
  });
});

app.get('/api/me', requireAuth, (req,res)=> res.json({ user:req.user, modules: modules.filter(m=>allowed(req.user.role,m)) }));

app.get('/api/dashboard', requireAuth, async (req,res)=>{
  let query = supabase.from('records').select('type,status,created_at');
  const { data=[] } = await query;
  const visible = data.filter(r => allowed(req.user.role, r.type));
  const byType = {}, byStatus = {}, byMonth = {};
  visible.forEach(r=>{
    byType[r.type]=(byType[r.type]||0)+1; byStatus[r.status]=(byStatus[r.status]||0)+1;
    const m = new Date(r.created_at).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'}); byMonth[m]=(byMonth[m]||0)+1;
  });
  res.json({ total:visible.length, byType, byStatus, byMonth });
});

app.get('/api/records/:type', requireAuth, async (req,res)=>{
  const { type } = req.params; if(!modules.includes(type)) return res.status(404).json({error:'Módulo inválido'});
  if(!allowed(req.user.role,type)) return res.status(403).json({error:'Sem permissão'});
  let q = supabase.from('records').select('*').eq('type', type).order('created_at',{ascending:false});
  if(req.query.search){
    const s = `%${req.query.search}%`;
    q = q.or(`title.ilike.${s},nome.ilike.${s},telefone.ilike.${s},person_id.ilike.${s},status.ilike.${s}`);
  }
  const { data, error } = await q;
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});

app.post('/api/records/:type', requireAuth, async (req,res)=>{
  const { type } = req.params; if(!allowed(req.user.role,type)) return res.status(403).json({error:'Sem permissão'});
  const body = req.body || {};
  const row = { type, title: body.title || body.nome || body.nome_familia || 'Registro', person_id:body.person_id||body.id_cidadao||'', nome:body.nome||'', telefone:body.telefone||'', sexo:body.sexo||'', status:body.status||'Pendente', data:body.data || body, created_by:req.user.id, updated_by:req.user.id };
  const { data, error } = await supabase.from('records').insert(row).select().single();
  if(error) return res.status(500).json({error:error.message});
  await log(req.user,'CRIAR','records',data.id,{type,title:row.title});
  res.json(data);
});

app.put('/api/records/:type/:id', requireAuth, async (req,res)=>{
  const { type,id } = req.params; if(!allowed(req.user.role,type)) return res.status(403).json({error:'Sem permissão'});
  const body = req.body || {};
  const row = { title: body.title || body.nome || body.nome_familia || 'Registro', person_id:body.person_id||body.id_cidadao||'', nome:body.nome||'', telefone:body.telefone||'', sexo:body.sexo||'', status:body.status||'Pendente', data:body.data || body, updated_by:req.user.id, updated_at:new Date().toISOString() };
  const { data, error } = await supabase.from('records').update(row).eq('id',id).eq('type',type).select().single();
  if(error) return res.status(500).json({error:error.message});
  await log(req.user,'EDITAR','records',id,{type,title:row.title});
  res.json(data);
});

app.delete('/api/records/:type/:id', requireAuth, async (req,res)=>{
  const { type,id } = req.params; if(!allowed(req.user.role,type)) return res.status(403).json({error:'Sem permissão'});
  const { error } = await supabase.from('records').delete().eq('id',id).eq('type',type);
  if(error) return res.status(500).json({error:error.message});
  await log(req.user,'APAGAR','records',id,{type});
  res.json({ok:true});
});

app.get('/api/records/:type/:id/pdf', requireAuth, async (req,res)=>{
  const { type,id } = req.params; if(!allowed(req.user.role,type)) return res.status(403).send('Sem permissão');
  const { data:record, error } = await supabase.from('records').select('*').eq('id',id).eq('type',type).single();
  if(error || !record) return res.status(404).send('Registro não encontrado');
  const pdf = await generatePremiumPDF(record, req.user);
  await log(req.user,'GERAR_PDF','records',id,{type});
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="rise-${type}-${id}.pdf"`);
  res.send(pdf);
});

app.get('/api/history', requireAuth, requireAdmin, async (req,res)=>{
  const { data, error } = await supabase.from('history').select('*, users(name,username,role)').order('created_at',{ascending:false}).limit(200);
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});

app.get('/api/users', requireAuth, requireAdmin, async (req,res)=>{
  const { data, error } = await supabase.from('users').select('id,username,name,role,active,created_at').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message}); res.json(data);
});
app.post('/api/users', requireAuth, requireAdmin, async (req,res)=>{
  const { username,name,role,password } = req.body;
  const password_hash = await bcrypt.hash(password || '159753',10);
  const { data,error } = await supabase.from('users').insert({username,name,role,password_hash,active:true}).select('id,username,name,role,active').single();
  if(error) return res.status(500).json({error:error.message}); await log(req.user,'CRIAR_USUARIO','users',data.id,{username}); res.json(data);
});
app.delete('/api/users/:id', requireAuth, requireAdmin, async (req,res)=>{
  const { error } = await supabase.from('users').update({active:false}).eq('id',req.params.id);
  if(error) return res.status(500).json({error:error.message}); res.json({ok:true});
});

app.get('/api/backup', requireAuth, requireAdmin, async (req,res)=>{
  const records = await supabase.from('records').select('*');
  const users = await supabase.from('users').select('id,username,name,role,active,created_at');
  const history = await supabase.from('history').select('*');
  res.setHeader('Content-Disposition','attachment; filename="backup-rise-juridico.json"');
  res.json({ exported_at:new Date().toISOString(), records:records.data, users:users.data, history:history.data });
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../public/index.html')));

async function startServer(){
  await initDatabase();
  app.listen(PORT,()=>console.log(`✅ Rise Jurídico online em http://localhost:${PORT}`));
}

startServer();
