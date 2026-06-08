const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

function sign(user){
  return jwt.sign({ id:user.id, username:user.username, name:user.name, role:user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn:'12h' });
}

function allowed(role, module){
  if(role === 'adm_geral' || role === 'admin') return true;
  if(role === 'policia') return ['processos','mandados','porte_armas'].includes(module);
  if(role === 'advogado') return ['troca_nome','registro_familiar','patente_nome','certidao_nascimento','certidao_adocao','alvara_funcionamento','documentos_diversos'].includes(module);
  if(role === 'juiz') return true;
  return false;
}

async function requireAuth(req,res,next){
  try{
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '');
    if(!token) return res.status(401).json({ error:'Token ausente' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const { data:user, error } = await supabase.from('users').select('id,username,name,role,active').eq('id', payload.id).single();
    if(error || !user || !user.active) return res.status(401).json({ error:'Usuário inválido' });
    req.user = user;
    next();
  }catch(e){ return res.status(401).json({ error:'Sessão expirada' }); }
}

function requireModule(module){
  return (req,res,next)=>{
    if(!allowed(req.user.role, module)) return res.status(403).json({ error:'Sem permissão para esta área' });
    next();
  }
}

function requireAdmin(req,res,next){
  if(!['adm_geral','admin'].includes(req.user.role)) return res.status(403).json({error:'Apenas ADM Geral'});
  next();
}

module.exports = { sign, requireAuth, requireModule, requireAdmin, allowed };
