const API = 'https://juridicorise.onrender.com';
let token = localStorage.getItem('rise_token');
let me = null;
let current = 'dashboard';
const labels = {dashboard:'Dashboard',processos:'Processos',mandados:'Mandados',porte_armas:'Porte de Armas',troca_nome:'Troca de Nome',registro_familiar:'Registro Familiar',patente_nome:'Patente de Nome',certidao_nascimento:'Certidão de Nascimento',certidao_adocao:'Certidão de Adoção',alvara_funcionamento:'Alvará de Funcionamento',documentos_diversos:'Documentos Diversos',obito:'Registro de Óbito',audiencias:'Audiências',usuarios:'Usuários',historico:'Histórico',backup:'Backup'};
const schemas = {
 processos:['nome','person_id','telefone','sexo','status','descricao'], mandados:['nome','person_id','telefone','sexo','status','descricao'], porte_armas:['nome','person_id','telefone','sexo','status','validade'], troca_nome:['nome','person_id','telefone','sexo','status','novo_nome'], registro_familiar:['nome','person_id','telefone','sexo','status','familia'], patente_nome:['nome_familia','responsavel','responsavel_id','telefone','status'], certidao_nascimento:['nome','person_id','sexo','data_nascimento','pai','pai_id','mae','mae_id','status'], certidao_adocao:['nome','person_id','sexo','adotante_1','adotante_1_id','adotante_2','adotante_2_id','status'], alvara_funcionamento:['estabelecimento','proprietario','proprietario_id','telefone','endereco','validade','status'], documentos_diversos:['nome','person_id','telefone','sexo','status','descricao'], obito:['nome','person_id','telefone','sexo','data_obito','status'], audiencias:['nome','person_id','telefone','sexo','data_audiencia','status']
};
function headers(){return {'Content-Type':'application/json','Authorization':'Bearer '+token}}
async function api(path, opts={}){const r=await fetch(API+path,{...opts,headers:{...headers(),...(opts.headers||{})}}); if(!r.ok){let e={};try{e=await r.json()}catch{} throw new Error(e.error||'Erro no servidor')} return r.json()}
async function login(ev){
  ev.preventDefault();
  loginMsg.textContent='Entrando...';
  try{
    const r=await fetch(API+'/api/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:username.value.trim(),password:password.value})
    });
    const txt=await r.text();
    let j;
    try{ j=JSON.parse(txt); }catch{ throw new Error('API retornou HTML ao invés de JSON. Confira a URL do backend.'); }
    if(!r.ok) throw new Error(j.error||'Login inválido');
    token=j.token;
    localStorage.setItem('rise_token',token);
    localStorage.setItem('rise_user',JSON.stringify(j.user));
    await boot();
    loginMsg.textContent='';
  }catch(e){
    console.error(e);
    loginMsg.textContent=e.message;
  }
}
function logout(){localStorage.removeItem('rise_token');location.reload()}
async function boot(){if(!token)return;try{const r=await api('/api/me');me=r.user;login.classList.add('hidden');app.classList.remove('hidden');profileName.textContent=me.name;profileRole.textContent=me.role==='adm_geral'?'ADM Geral':me.role;renderMenu(r.modules);openPage('dashboard')}catch(e){localStorage.removeItem('rise_token')}}
function renderMenu(mods){let all=['dashboard',...mods]; if(['adm_geral','admin'].includes(me.role)) all.push('usuarios','historico','backup'); menu.innerHTML=all.map(m=>`<button id="m_${m}" onclick="openPage('${m}')">${labels[m]}</button>`).join('')}
function setTitle(t,s=''){pageTitle.textContent=labels[t]||t;pageSub.textContent=s||'Cadastre, edite, apague e gere documentos oficiais.';document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));let bt=document.getElementById('m_'+t);if(bt)bt.classList.add('active')}
async function openPage(p){current=p;setTitle(p); if(p==='dashboard') return dashboard(); if(p==='usuarios') return users(); if(p==='historico') return history(); if(p==='backup') return backup(); return records(p)}
async function dashboard(){const d=await api('/api/dashboard');content.innerHTML=`<div class="grid"><div class="card"><h3>Total real</h3><div class="stat">${d.total}</div><p>Registros no Supabase</p></div><div class="card"><h3>Tipos</h3><div class="stat">${Object.keys(d.byType).length}</div><p>Módulos com dados</p></div><div class="card"><h3>Status</h3><div class="stat">${Object.keys(d.byStatus).length}</div><p>Status usados</p></div><div class="card"><h3>Banco</h3><div class="stat">24h</div><p>Supabase online</p></div></div><br><div class="card"><h3>Gráfico real por módulo</h3><canvas id="chart"></canvas></div>`;drawChart(d.byType)}
function drawChart(obj){const c=document.getElementById('chart'),ctx=c.getContext('2d');c.width=c.offsetWidth*2;c.height=520;ctx.scale(2,2);const entries=Object.entries(obj);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#d7b541';ctx.font='14px Inter';if(!entries.length){ctx.fillText('Sem dados cadastrados ainda.',20,40);return}const max=Math.max(...entries.map(e=>e[1]));entries.forEach(([k,v],i)=>{const y=35+i*38,w=(c.offsetWidth-220)*(v/max);ctx.fillStyle='#18233b';ctx.fillRect(150,y-18,c.offsetWidth-180,24);ctx.fillStyle='#d7b541';ctx.fillRect(150,y-18,w,24);ctx.fillStyle='#f8fafc';ctx.fillText(labels[k]||k,12,y);ctx.fillText(v,160+w,y)})}
function formHtml(type,row={}){const vals={...(row.data||{}),...row};return `<form class="form" onsubmit="saveRecord(event,'${type}','${row.id||''}')">${(schemas[type]||[]).map(f=>field(f,vals[f]||'')).join('')}<input name="advogado" placeholder="Advogado / responsável" value="${vals.advogado||me.name||''}"><input name="autoridade" placeholder="Autoridade judicial" value="${vals.autoridade||'Carcar'}"><button class="gold full">${row.id?'Salvar edição':'Cadastrar'}</button></form>`}
function field(f,v){const ph=f.replaceAll('_',' '); if(f==='sexo') return `<select name="sexo"><option value="">Sexo</option><option ${v==='Masculino'?'selected':''}>Masculino</option><option ${v==='Feminino'?'selected':''}>Feminino</option></select>`; if(f==='status') return `<select name="status"><option ${v==='Pendente'?'selected':''}>Pendente</option><option ${v==='Em análise'?'selected':''}>Em análise</option><option ${v==='Aprovado'?'selected':''}>Aprovado</option><option ${v==='Negado'?'selected':''}>Negado</option><option ${v==='Arquivado'?'selected':''}>Arquivado</option></select>`; if(f.includes('descricao')) return `<textarea name="${f}" placeholder="${ph}">${v||''}</textarea>`; return `<input name="${f}" placeholder="${ph}" value="${v||''}">`}
async function records(type){content.innerHTML=`<div class="card"><h3>Novo cadastro</h3>${formHtml(type)}</div><br><div class="card"><div class="toolbar"><input id="q" placeholder="Pesquisar por ID, nome, telefone ou status"><button class="btn gold" onclick="loadRecords('${type}')">Buscar</button></div><div id="list"></div></div>`;loadRecords(type)}
async function loadRecords(type){const rows=await api(`/api/records/${type}?search=${encodeURIComponent(q?.value||'')}`);list.innerHTML=`<table class="table"><thead><tr><th>Nome/Título</th><th>ID</th><th>Telefone</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.nome||r.title||'-'}</td><td>${r.person_id||'-'}</td><td>${r.telefone||'-'}</td><td><span class="badge">${r.status}</span></td><td><button class="btn" onclick='editRecord(${JSON.stringify(r).replaceAll("'","&#39;")})'>Editar</button> <button class="btn green" onclick="pdf('${type}','${r.id}')">PDF</button> <button class="btn red" onclick="delRecord('${type}','${r.id}')">Apagar</button></td></tr>`).join('')}</tbody></table>`}
function editRecord(r){document.querySelector('.card').innerHTML=`<h3>Editando registro</h3>${formHtml(r.type,r)}`;scrollTo(0,0)}
async function saveRecord(ev,type,id){ev.preventDefault();const fd=new FormData(ev.target);const data=Object.fromEntries(fd.entries());const payload={...data,title:data.nome||data.nome_familia||data.estabelecimento||data.responsavel||labels[type],nome:data.nome||data.responsavel||data.proprietario||'',person_id:data.person_id||data.responsavel_id||data.proprietario_id||'',telefone:data.telefone||'',sexo:data.sexo||'',status:data.status||'Pendente',data};await api(`/api/records/${type}${id?'/'+id:''}`,{method:id?'PUT':'POST',body:JSON.stringify(payload)});openPage(type)}
async function delRecord(type,id){if(confirm('Apagar este registro?')){await api(`/api/records/${type}/${id}`,{method:'DELETE'});loadRecords(type)}}
function pdf(type,id){window.open(`${API}/api/records/${type}/${id}/pdf?token=${token}`,'_blank');fetch(`${API}/api/records/${type}/${id}/pdf`,{headers:{Authorization:'Bearer '+token}}).then(r=>r.blob()).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`rise-${type}.pdf`;a.click()})}
async function users(){const rows=await api('/api/users');content.innerHTML=`<div class="card"><h3>Criar usuário</h3><form class="form" onsubmit="createUser(event)"><input name="username" placeholder="Usuário"><input name="name" placeholder="Nome"><select name="role"><option value="policia">Polícia</option><option value="advogado">Advogado</option><option value="juiz">Juiz</option><option value="admin">Admin</option><option value="adm_geral">ADM Geral</option></select><input name="password" placeholder="Senha" value="159753"><button class="gold full">Criar</button></form></div><br><div class="card"><table class="table"><tbody>${rows.map(u=>`<tr><td>${u.name}</td><td>${u.username}</td><td>${u.role}</td><td>${u.active?'Ativo':'Desativado'}</td><td><button class="btn red" onclick="deleteUser('${u.id}')">Desativar</button></td></tr>`).join('')}</tbody></table></div>`}
async function createUser(ev){ev.preventDefault();await api('/api/users',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(ev.target).entries()))});users()}
async function deleteUser(id){if(confirm('Desativar usuário?')){await api('/api/users/'+id,{method:'DELETE'});users()}}
async function history(){const rows=await api('/api/history');content.innerHTML=`<div class="card"><table class="table"><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Área</th></tr></thead><tbody>${rows.map(h=>`<tr><td>${new Date(h.created_at).toLocaleString('pt-BR')}</td><td>${h.users?.name||'-'}</td><td>${h.action}</td><td>${h.table_name}</td></tr>`).join('')}</tbody></table></div>`}
function backup(){content.innerHTML=`<div class="card"><h3>Backup Supabase</h3><p>Baixe uma cópia JSON dos registros, usuários e histórico.</p><button class="gold" onclick="downloadBackup()">Baixar backup</button></div>`}
async function downloadBackup(){const r=await fetch(API+'/api/backup',{headers:{Authorization:'Bearer '+token}});const b=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup-rise-juridico.json';a.click()}
boot();
