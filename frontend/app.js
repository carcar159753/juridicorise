const API = 'https://juridicorise.onrender.com';
const pretty={processos:'Processos',mandados:'Mandados',porte_armas:'Porte de Armas',troca_nome:'Troca de Nome',registro_familiar:'Registro Familiar',alvaras:'Alvarás de Funcionamento',nascimentos:'Certidão de Nascimento',adocoes:'Certidão de Adoção',patentes:'Patente de Nome Familiar',obitos:'Registro de Óbito',documentos_diversos:'Documentos Diversos',quebra_blocklist:'Quebra de Blocklist',audiencias:'Audiências',profissionais:'Advogados/Juízes',users:'Usuários',history:'Histórico',search:'Busca Geral',backup:'Backup',dashboard:'Dashboard'};
const allMods=['dashboard','processos','mandados','porte_armas','troca_nome','registro_familiar','alvaras','nascimentos','adocoes','patentes','obitos','documentos_diversos','quebra_blocklist','audiencias','profissionais','search','history','users','backup'];
const policeMods=['processos','mandados','porte_armas'];
let state={token:localStorage.token||'',user:null,page:'dashboard',data:[],edit:null};
function el(s){return document.querySelector(s)} function auth(){return {Authorization:'Bearer '+state.token,'Content-Type':'application/json'}}
async function request(url,opt={}){const r=await fetch(API+url,{...opt,headers:{...(opt.headers||{}),...auth()}}); const j=await r.json().catch(()=>({})); if(!r.ok)throw Error(j.error||'Erro'); return j;}
async function boot(){ if(!state.token) return login(); try{const r=await request('/api/me'); state.user=r.user; render();}catch{localStorage.removeItem('token'); login();}}
function login(){document.body.innerHTML='<div id="app"></div>';el('#app').innerHTML=`<div class="login"><div class="orb o1"></div><div class="orb o2"></div><form class="login-card" onsubmit="doLogin(event)"><div class="brand">⚖️ Sistema Jurídico Rise</div><p class="muted">Portal oficial do Departamento de Justiça</p><label>Usuário</label><input id="u" autocomplete="username" placeholder="Digite seu usuário"><label>Senha</label><input id="p" type="password" autocomplete="current-password" placeholder="Digite sua senha"><button style="width:100%;margin-top:20px">Entrar</button><p id="err" class="muted"></p></form></div>`}
async function doLogin(e){e.preventDefault();try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:el('#u').value,password:el('#p').value})}).then(x=>x.json().then(j=>{if(!x.ok)throw Error(j.error);return j}));state.token=r.token;state.user=r.user;localStorage.token=r.token;render()}catch(err){el('#err').textContent=err.message}}
function allowed(){return state.user?.role==='policia'?['dashboard',...policeMods]:allMods}
function render(){const pages=allowed(); if(!pages.includes(state.page))state.page='dashboard'; document.body.innerHTML='<div id="app"></div>';el('#app').innerHTML=`<div class="app"><aside class="side no-print"><div class="logo">⚖️ Rise</div><div class="nav">${pages.map(p=>`<button class="${state.page===p?'active':''}" onclick="go('${p}')">${pretty[p]}</button>`).join('')}<button class="logout" onclick="logout()">Sair</button></div></aside><main class="main"><div class="top no-print"><div><h1>${pretty[state.page]}</h1><p class="muted">${subTitle()}</p></div><div class="userbox"><b>${state.user.name}</b><div class="role">${state.user.role}</div></div></div><div id="content"></div></main></div>`; loadPage();}
function subTitle(){return state.page==='dashboard'?'Dados reais salvos no banco local.':state.page==='search'?'Pesquise por ID, nome, telefone, status ou número.':state.page==='history'?'Ações feitas no sistema.':state.page==='users'?'ADM Geral cria acessos por cargo.':'Cadastre, edite, apague e gere documentos oficiais.'}
function go(p){state.page=p;state.edit=null;render()} async function logout(){await request('/api/logout',{method:'POST'}).catch(()=>{}); localStorage.removeItem('token'); state={token:'',user:null,page:'dashboard'}; login()}
async function loadPage(){ if(state.page==='dashboard') return dashboard(); if(state.page==='search') return searchPage(); if(state.page==='history') return historyPage(); if(state.page==='users') return usersPage(); if(state.page==='backup') return backupPage(); return modulePage(state.page);}
async function dashboard(){const r=await request('/api/summary'); const keys=Object.keys(r.summary); el('#content').innerHTML=`<div class="grid">${keys.map(k=>`<div class="card"><div class="muted">${pretty[k]}</div><div class="stat">${r.summary[k]}</div></div>`).join('')}</div><div class="card"><h3>Últimas movimentações</h3>${table(r.history,['date','user','action','module','details'])}</div>`}
function fields(mod){const base=[['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo','select',['Masculino','Feminino','Outro']],['status','Status','select',['Pendente','Em análise','Aprovado','Negado','Arquivado']]];
const map={processos:[['numero','Número do Processo'],...base,['acusacao','Acusação/Descrição','textarea'],['responsavel','Responsável judicial']],mandados:[['numero','Número do Mandado'],...base,['motivo','Motivo','textarea'],['autoridade','Autoridade Judicial']],porte_armas:base.concat([['tipo_arma','Tipo da arma'],['validade','Validade'],['autoridade','Autoridade Judicial']]),troca_nome:[...base,['nome_antigo','Nome antigo'],['nome_novo','Nome novo'],['advogado','Advogado'],['autoridade','Autoridade Judicial']],registro_familiar:[['familia','Nome da família'],...base,['responsavel','Responsável da família'],['advogado','Advogado'],['autoridade','Autoridade Judicial']],alvaras:[['estabelecimento','Nome do estabelecimento'],['endereco','Endereço'],...base,['proprietario','Proprietário'],['id_proprietario','ID do proprietário'],['emissao','Data de emissão'],['validade','Validade'],['autoridade','Autoridade Judicial']],nascimentos:[['nome_crianca','Nome da criança'],['data_nascimento','Data de nascimento'],['pai','Nome do pai'],['id_pai','ID do pai'],['mae','Nome da mãe'],['id_mae','ID da mãe'],['advogado','Advogado'],['autoridade','Autoridade Judicial'],['emissao','Data de emissão']],adocoes:[['nome_adotado','Nome do adotado'],['id_adotado','ID do adotado'],['adotante1','Adotante 1'],['id_adotante1','ID adotante 1'],['adotante2','Adotante 2'],['id_adotante2','ID adotante 2'],['responsavel','Responsável'],['autoridade','Autoridade Judicial'],['emissao','Data de emissão']],patentes:[['familia','Nome da família'],['responsavel','Responsável pela família'],['id_responsavel','ID do responsável'],['advogado','Advogado'],['autoridade','Autoridade Judicial'],['emissao','Data de emissão']],obitos:[...base,['data_obito','Data do óbito'],['causa','Causa','textarea'],['autoridade','Autoridade Judicial']],documentos_diversos:[['titulo','Título'],...base,['descricao','Descrição','textarea'],['autoridade','Autoridade Judicial']],quebra_blocklist:[...base,['motivo','Motivo da quebra','textarea'],['autoridade','Autoridade Judicial']],audiencias:[['numero','Número'],...base,['data','Data da audiência'],['descricao','Descrição','textarea'],['autoridade','Autoridade Judicial']],profissionais:[['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo','select',['Masculino','Feminino','Outro']],['cargo','Cargo','select',['Advogado','Juiz','Senador','Autoridade Judicial']],['assinatura','Nome para assinatura']]}; return map[mod]||base;}
async function modulePage(mod){const r=await request('/api/'+mod); state.data=r.items; const canDoc=['alvaras','nascimentos','adocoes','patentes','troca_nome','obitos','porte_armas','mandados','processos','registro_familiar'].includes(mod); el('#content').innerHTML=`<div class="card">${formHtml(mod)}</div><div class="card"><div class="searchbar"><input id="localSearch" oninput="drawList('${mod}')" placeholder="Pesquisar nesta aba..."><button onclick="exportCSV('${mod}')">Exportar CSV</button></div><div id="list"></div></div>`; drawList(mod,canDoc)}
function formHtml(mod){const item=state.edit||{};return `<h3>${state.edit?'Editar':'Cadastrar'} ${pretty[mod]}</h3><form onsubmit="saveItem(event,'${mod}')"><div class="row3">${fields(mod).map(f=>field(f,item[f[0]]||'')).join('')}</div><div class="actions"><button>${state.edit?'Salvar edição':'Cadastrar'}</button>${state.edit?`<button type="button" class="secondary" onclick="state.edit=null;modulePage('${mod}')">Cancelar</button>`:''}</div></form>`}
function field(f,val){let [name,label,type,opts]=f;if(type==='textarea')return `<div><label>${label}</label><textarea name="${name}">${val}</textarea></div>`; if(type==='select')return `<div><label>${label}</label><select name="${name}">${opts.map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('')}</select></div>`; return `<div><label>${label}</label><input name="${name}" value="${val||''}" placeholder="${label}"></div>`}
async function saveItem(e,mod){e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());try{if(state.edit)await request('/api/'+mod+'/'+state.edit.id,{method:'PUT',body:JSON.stringify(data)});else await request('/api/'+mod,{method:'POST',body:JSON.stringify(data)});state.edit=null;modulePage(mod)}catch(err){alert(err.message)}}
function drawList(mod,canDoc=true){const q=(el('#localSearch')?.value||'').toLowerCase(); const items=state.data.filter(x=>JSON.stringify(x).toLowerCase().includes(q)); if(!items.length)return el('#list').innerHTML='<div class="empty">Nenhum registro cadastrado.</div>'; const cols=[...new Set(items.flatMap(x=>Object.keys(x).filter(k=>!['createdAt','updatedAt','createdBy','updatedBy'].includes(k))))].slice(0,8); el('#list').innerHTML=`<table class="table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${items.map(it=>`<tr>${cols.map(c=>`<td>${it[c]??''}</td>`).join('')}<td><div class="actions"><button class="secondary" onclick='editItem("${mod}","${it.id}")'>Editar</button><button class="danger" onclick='delItem("${mod}","${it.id}")'>Apagar</button>${canDoc?`<button onclick='doc("${mod}","${it.id}")'>Gerar PDF</button>`:''}</div></td></tr>`).join('')}</tbody></table>`}
function editItem(mod,id){state.edit=state.data.find(x=>x.id===id);modulePage(mod)} async function delItem(mod,id){if(confirm('Apagar este registro?')){await request('/api/'+mod+'/'+id,{method:'DELETE'});modulePage(mod)}}

function today(){return new Date().toLocaleDateString('pt-BR')}
function nowYear(){return new Date().getFullYear()}
function safe(v,d='Não informado'){v=String(v??'').trim(); return v?v:d}
function val(x,k,d='Não informado'){return safe(x[k],d)}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function niceDate(v){if(!v)return today(); const d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString('pt-BR')}
function docNum(prefix,x){const n=String(x.id||Math.floor(Math.random()*9999)).replace(/\D/g,'').slice(-6).padStart(6,'0'); return `${prefix}-${nowYear()}-${n}`}
function statusText(x){return safe(x.status,'Aprovado').toUpperCase()}
function signBlock(name,role){return `<div class="signature"><div class="signature-name">${escapeHtml(safe(name,'Assinatura'))}</div><div class="signature-line"></div><div class="signature-role">${escapeHtml(role)}</div></div>`}
function sealHtml(){return `<div class="seal"><div class="seal-icon">⚖</div><small>JUSTIÇA RISE</small></div>`}
function info(label,value){return `<div class="info-line"><span>${escapeHtml(label)}</span><b>${escapeHtml(safe(value))}</b></div>`}
function fieldsTable(x,labels){return `<div class="field-grid">${labels.map(([k,l])=>info(l,val(x,k))).join('')}</div>`}
function authCode(prefix,x){return `RISE-${prefix}-${nowYear()}-${String(x.id||'000000').replace(/\D/g,'').slice(-6).padStart(6,'0')}`}
function certShell(kind,subtitle,docId,emissao,body,signs,status='APROVADO'){
 return `<section class="paper certificate">
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div class="watermark">JUSTIÇA RISE</div>
  <div class="doc-meta"><span>Nº ${escapeHtml(docId)}</span><span>Status: ${escapeHtml(status)}</span></div>
  <div class="doc-head"><div class="mini-seal">⚖</div><div><div class="dept">DEPARTAMENTO DE JUSTIÇA • CIDADE RISE</div><h1>${kind}</h1><h2>${subtitle}</h2></div></div>
  <div class="doc-body">${body}</div>
  <div class="date-row">Rise, ${escapeHtml(emissao)}</div>
  <div class="sign-row">${signs}</div>${sealHtml()}
  <div class="auth">Código de autenticação: ${escapeHtml(docId.replaceAll('-',''))}</div>
 </section>`
}
function legalShell(kind,subtitle,docId,emissao,body,signs,status='APROVADO'){
 return `<section class="paper legal">
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div class="watermark">JUSTIÇA RISE</div>
  <div class="doc-meta"><span>Nº ${escapeHtml(docId)}</span><span>Status: ${escapeHtml(status)}</span></div>
  <div class="legal-top"><div class="mini-seal big">⚖</div><div class="dept">DEPARTAMENTO DE JUSTIÇA • CIDADE RISE</div><h1>${kind}</h1><h2>${subtitle}</h2></div>
  <div class="legal-body">${body}</div>
  <div class="date-row">Rise, ${escapeHtml(emissao)}</div>
  <div class="sign-row">${signs}</div>${sealHtml()}
  <div class="auth">Código de autenticação: ${escapeHtml(docId.replaceAll('-',''))}</div>
 </section>`
}
function doc(mod,id){
 const x=state.data.find(a=>a.id===id); if(!x)return alert('Registro não encontrado.');
 const emissao=niceDate(x.emissao || x.createdAt || new Date());
 const st=statusText(x);
 let content='', docId='';
 if(mod==='nascimentos'){
  docId=docNum('CN',x);
  const body=`<p>O Poder Judiciário, por meio da Autoridade Judicial Responsável, no exercício de sua competência, <b>RECONHECE E DECLARA</b> que a criança</p>
  <div class="principal-name">${escapeHtml(val(x,'nome_crianca'))}</div>
  <p>Nascido(a) em <b>${escapeHtml(val(x,'data_nascimento'))}</b>, filho(a) legítimo(a) de <b>${escapeHtml(val(x,'pai'))}</b> ID <b>${escapeHtml(val(x,'id_pai'))}</b> e <b>${escapeHtml(val(x,'mae'))}</b> ID <b>${escapeHtml(val(x,'id_mae'))}</b>, conferindo os direitos e deveres estabelecidos pelas leis desta cidade.</p>
  <p class="small-text">Concede-se todos os direitos e deveres legais de paternidade/maternidade aos genitores, conforme normas aplicáveis da Cidade Rise.</p>`;
  content=certShell('CERTIDÃO','DE NASCIMENTO',docId,emissao,body,signBlock(x.advogado,'Advogado')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='adocoes'){
  docId=docNum('CA',x);
  const body=`<p>O Poder Judiciário, por meio da Autoridade Judicial Responsável, <b>RECONHECE E DECLARA</b> que</p>
  <div class="principal-name wide">${escapeHtml(val(x,'nome_adotado'))}</div>
  <p>portador(a) do ID <b>${escapeHtml(val(x,'id_adotado'))}</b>, foi legalmente adotado(a) por <b>${escapeHtml(val(x,'adotante1'))}</b> ID <b>${escapeHtml(val(x,'id_adotante1'))}</b> e <b>${escapeHtml(val(x,'adotante2'))}</b> ID <b>${escapeHtml(val(x,'id_adotante2'))}</b>, conforme estabelecido pela legislação vigente.</p>
  <p class="small-text">Concede-se todos os direitos e deveres legais de paternidade/maternidade aos adotantes, assegurando o melhor interesse do adotado.</p>`;
  content=certShell('CERTIDÃO','DE ADOÇÃO',docId,emissao,body,signBlock(x.responsavel,'Responsável')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='patentes' || mod==='registro_familiar'){
  docId=docNum('PT',x);
  const familia=safe(x.familia||x.nome,'Nome Familiar');
  const responsavel=safe(x.responsavel||x.nome||x.createdBy,'Responsável');
  const rid=safe(x.id_responsavel||x.id_cidadao,'ID não informado');
  const tel=safe(x.telefone,'Telefone não informado');
  const body=`<p>O Departamento de Justiça da Cidade Rise, por meio da Autoridade Judicial Responsável, <b>CONCEDE</b> à família</p>
  <div class="principal-name wide">${escapeHtml(familia)}</div>
  <p>o direito de uso exclusivo do referido sobrenome, conforme estabelecido pela Lei de Registro e Patenteamento de Nomes.</p>
  <div class="premium-box"><b>Responsável legal:</b><br>${escapeHtml(responsavel)}<br>ID: ${escapeHtml(rid)}<br>Telefone: ${escapeHtml(tel)}</div>
  <p>O uso do sobrenome é restrito aos membros da família e a quem for autorizado pelo responsável designado.</p>`;
  content=certShell('PATENTE DE NOME','NOME FAMILIAR',docId,emissao,body,signBlock(x.advogado,'Advogado')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='troca_nome'){
  docId=docNum('TN',x);
  const body=`<p>O Departamento de Justiça da Cidade Rise declara oficialmente a alteração de nome do(a) cidadão(ã):</p>
  ${fieldsTable(x,[['nome','Nome atual'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo'],['nome_antigo','Nome antigo'],['nome_novo','Nome novo'],['status','Status']])}
  <p>A alteração passa a valer após emissão deste documento e registro nos arquivos oficiais da Justiça Rise.</p>`;
  content=legalShell('CERTIDÃO','TROCA DE NOME',docId,emissao,body,signBlock(x.advogado,'Advogado')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='alvaras'){
  docId=docNum('ALV',x);
  const body=`<p>O Poder Judiciário certifica que o estabelecimento abaixo atende aos requisitos necessários para funcionamento conforme normas da Cidade Rise.</p>
  ${fieldsTable(x,[['estabelecimento','Estabelecimento'],['endereco','Endereço'],['proprietario','Proprietário'],['id_proprietario','ID do proprietário'],['telefone','Telefone'],['validade','Validade'],['status','Status']])}
  <div class="rules"><b>Observações:</b><ul><li>Presença de equipamentos de segurança.</li><li>Condições operacionais adequadas.</li><li>Conformidade com as exigências legais da cidade.</li></ul></div>`;
  content=legalShell('ALVARÁ','DE FUNCIONAMENTO',docId,emissao,body,signBlock(x.proprietario,'Proprietário')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='porte_armas'){
  docId=docNum('PA',x);
  const body=`<p>O Departamento de Justiça autoriza o porte abaixo, respeitando as normas legais da Cidade Rise.</p>
  ${fieldsTable(x,[['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo'],['tipo_arma','Tipo da arma'],['validade','Validade'],['status','Status']])}
  <p>Documento pessoal e intransferível, podendo ser suspenso por decisão judicial.</p>`;
  content=legalShell('AUTORIZAÇÃO OFICIAL','PORTE DE ARMAS',docId,emissao,body,signBlock(x.nome,'Portador')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='mandados'){
  docId=docNum('MD',x);
  const body=`${fieldsTable(x,[['numero','Número do mandado'],['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo'],['status','Status']])}
  <div class="reason"><b>Motivo:</b><br>${escapeHtml(val(x,'motivo'))}</div>
  <p>Mandado emitido para cumprimento pelas autoridades competentes da Cidade Rise.</p>`;
  content=legalShell('MANDADO JUDICIAL','ORDEM OFICIAL',docId,emissao,body,signBlock(x.createdBy,'Responsável')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='processos'){
  docId=docNum('PJ',x);
  const body=`${fieldsTable(x,[['numero','Número do processo'],['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo'],['status','Status'],['responsavel','Responsável judicial']])}
  <div class="reason"><b>Descrição/Acusação:</b><br>${escapeHtml(val(x,'acusacao'))}</div>
  <p>Processo registrado para acompanhamento e deliberação do Departamento de Justiça da Rise.</p>`;
  content=legalShell('PROCESSO JUDICIAL','REGISTRO OFICIAL',docId,emissao,body,signBlock(x.responsavel,'Responsável Judicial')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else if(mod==='obitos'){
  docId=docNum('OB',x);
  const body=`${fieldsTable(x,[['nome','Nome'],['id_cidadao','ID'],['telefone','Telefone'],['sexo','Sexo'],['data_obito','Data do óbito'],['status','Status']])}
  <div class="reason"><b>Causa:</b><br>${escapeHtml(val(x,'causa'))}</div>
  <p>O Departamento de Justiça registra oficialmente o óbito conforme informações declaradas.</p>`;
  content=legalShell('CERTIDÃO','REGISTRO DE ÓBITO',docId,emissao,body,signBlock(x.createdBy,'Responsável')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 } else {
  docId=docNum('DOC',x);
  const body=`${fieldsTable(x,Object.keys(x).filter(k=>!['id','createdAt','updatedAt','createdBy','updatedBy'].includes(k)).map(k=>[k,k.replaceAll('_',' ')]))}`;
  content=legalShell((pretty[mod]||'DOCUMENTO').toUpperCase(),'DOCUMENTO OFICIAL',docId,emissao,body,signBlock(x.responsavel||x.advogado||x.createdBy,'Responsável')+signBlock(x.autoridade,'Autoridade Judicial'),st);
 }
 const docCss=`
 @page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9edf5;color:#15120d;font-family:Georgia,'Times New Roman',serif}.toolbar{position:sticky;top:0;z-index:10;background:#070b16;color:#fff;padding:14px;text-align:center;font-family:Arial,sans-serif;box-shadow:0 8px 24px #0004}.toolbar button{border:0;border-radius:12px;padding:12px 18px;margin:0 6px;background:linear-gradient(135deg,#f6d86a,#a27109);font-weight:900;cursor:pointer}.paper{background:#fffdf8;position:relative;overflow:hidden;box-shadow:0 16px 65px #0003}.certificate{width:1123px;min-height:794px;margin:28px auto;padding:56px 78px;border:12px double #b99431}.legal{width:794px;min-height:1123px;margin:28px auto;padding:64px 70px;border:10px double #b99431}.paper:before{content:'';position:absolute;inset:27px;border:2px solid #d9c27a;pointer-events:none}.paper:after{content:'';position:absolute;inset:44px;border:1px solid #eee0af;pointer-events:none}.corner{position:absolute;width:110px;height:110px;border-color:#14121a}.tl{top:0;left:0;border-top:4px solid;border-left:4px solid}.tr{top:0;right:0;border-top:4px solid;border-right:4px solid}.bl{bottom:0;left:0;border-bottom:4px solid;border-left:4px solid}.br{bottom:0;right:0;border-bottom:4px solid;border-right:4px solid}.watermark{position:absolute;inset:0;display:grid;place-items:center;font-size:132px;font-weight:900;color:#b99431;opacity:.07;transform:rotate(-18deg);pointer-events:none;white-space:nowrap}.doc-meta{position:relative;z-index:2;display:flex;justify-content:space-between;font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;color:#7b5a00;font-weight:900;letter-spacing:.8px;margin-bottom:12px}.doc-head,.legal-top{text-align:center;position:relative;z-index:2}.doc-head{display:flex;justify-content:center;align-items:center;gap:20px}.dept{font-family:Arial,sans-serif;font-size:12px;font-weight:900;letter-spacing:1.2px;color:#8a6812;margin-bottom:6px}.doc-head h1,.legal-top h1{font-size:62px;line-height:.92;margin:0;color:#7b5a00;letter-spacing:2px}.doc-head h2,.legal-top h2{font-size:26px;font-weight:500;margin:8px 0 0;color:#8a6812;letter-spacing:1px}.legal-top h1{font-size:42px}.legal-top h2{font-size:25px}.mini-seal{width:74px;height:74px;border:5px solid #d5ab23;border-radius:50%;display:grid;place-items:center;background:#050812;color:#f6d66c;font-size:34px;box-shadow:0 0 0 4px #1b1b1b}.mini-seal.big{margin:0 auto 14px}.doc-body,.legal-body{position:relative;z-index:2;text-align:center}.doc-body{font-size:21px;line-height:1.42;margin-top:30px}.legal-body{font-size:18px;line-height:1.45;margin-top:26px;text-align:left}.principal-name{font-family:'Brush Script MT','Segoe Script',cursive;font-size:62px;color:#806000;border-bottom:2px solid #777;margin:8px auto 12px;padding:0 42px;display:inline-block;line-height:1.05;max-width:920px}.principal-name.wide{font-size:58px}.small-text{font-size:15px;font-style:italic;margin-top:20px}.date-row{text-align:center;font-size:20px;margin:24px 0 0;position:relative;z-index:2}.sign-row{display:flex;justify-content:space-between;align-items:flex-end;gap:64px;margin-top:46px;position:relative;z-index:3}.signature{width:315px;text-align:center}.signature-name{font-family:'Brush Script MT','Segoe Script',cursive;font-size:34px;color:#111;min-height:44px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.signature-line{border-top:1.8px solid #555;margin-top:0}.signature-role{font-size:17px;margin-top:6px}.seal{position:absolute;left:50%;bottom:45px;transform:translateX(-50%);width:96px;height:96px;border-radius:50%;background:#060a16;color:#f4cc46;border:6px solid #d0a420;display:grid;place-items:center;text-align:center;box-shadow:0 0 0 4px #866307;font-family:Arial,sans-serif;z-index:2}.legal .seal{bottom:70px}.seal-icon{font-size:32px}.seal small{font-size:9px;letter-spacing:1px}.auth{position:absolute;left:0;right:0;bottom:18px;text-align:center;font-family:Arial,sans-serif;font-size:10px;color:#7b5a00;font-weight:900;letter-spacing:.8px}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin:20px 0}.info-line{border-bottom:1px solid #c8b46d;padding:8px 0}.info-line span{display:block;text-transform:uppercase;font-family:Arial,sans-serif;font-size:11px;color:#7b5a00;font-weight:900;letter-spacing:.8px}.info-line b{font-size:18px}.premium-box,.rules,.reason{background:#fff8df;border:1.5px solid #d9c27a;border-radius:14px;padding:14px 18px;margin:18px auto;max-width:720px;text-align:center;box-shadow:inset 0 0 18px #d2b75b22}.rules,.reason{text-align:left}.rules ul{margin:8px 0 0 20px}@media print{body{background:#fff}.toolbar{display:none}.paper{margin:0;box-shadow:none}.certificate{width:297mm;height:210mm}.legal{width:210mm;min-height:297mm}}`;
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(pretty[mod]||'Documento')}</title><style>${docCss}</style></head><body><div class="toolbar"><button onclick="window.print()">Baixar em PDF / Imprimir</button><button onclick="window.close()">Fechar</button></div>${content}</body></html>`;
 const blob=new Blob([html],{type:'text/html'}); const url=URL.createObjectURL(blob); window.open(url,'_blank');
}
async function searchPage(){el('#content').innerHTML=`<div class="card"><div class="searchbar"><input id="q" placeholder="Digite nome, ID, telefone, status..."><button onclick="doSearch()">Buscar</button></div><div id="results"></div></div>`} async function doSearch(){const r=await request('/api/search?q='+encodeURIComponent(el('#q').value));el('#results').innerHTML=r.items.length?table(r.items.map(i=>({modulo:pretty[i._module],nome:i.nome||i.nome_crianca||i.estabelecimento||i.familia||i.numero,status:i.status,id:i.id})),['modulo','nome','status','id']):'<div class="empty">Nada encontrado.</div>'}
async function historyPage(){const r=await request('/api/history');el('#content').innerHTML=`<div class="card">${table(r.items,['date','user','role','action','module','details'])}</div>`}
async function usersPage(){try{const r=await request('/api/users'); el('#content').innerHTML=`<div class="card"><h3>Criar usuário</h3><form onsubmit="createUser(event)"><div class="row3"><div><label>Nome</label><input name="name"></div><div><label>Usuário</label><input name="username"></div><div><label>Senha</label><input name="password"></div><div><label>Cargo</label><select name="role"><option value="policia">Polícia</option><option value="admin">Admin</option><option value="adm_geral">ADM Geral</option></select></div></div><button style="margin-top:14px">Criar</button></form></div><div class="card">${table(r.items,['name','username','role','id'])}</div>`}catch(e){el('#content').innerHTML='<div class="empty">Sem permissão.</div>'}} async function createUser(e){e.preventDefault();await request('/api/users',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))});usersPage()}
async function backupPage(){el('#content').innerHTML=`<div class="card"><h3>Backup</h3><p class="muted">Baixe o banco local completo.</p><button onclick="downloadBackup()">Baixar backup JSON</button></div>`} async function downloadBackup(){const r=await request('/api/backup'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'})); a.download='backup-rise-juridico.json'; a.click()}
function table(items,cols){if(!items||!items.length)return '<div class="empty">Nenhum registro.</div>'; return `<table class="table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${items.map(it=>`<tr>${cols.map(c=>`<td>${c==='date'&&it[c]?new Date(it[c]).toLocaleString('pt-BR'):it[c]??''}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function exportCSV(mod){const rows=state.data; const cols=[...new Set(rows.flatMap(Object.keys))]; const csv=[cols.join(';'),...rows.map(r=>cols.map(c=>`"${String(r[c]??'').replaceAll('"','""')}"`).join(';'))].join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=mod+'.csv'; a.click()}
boot();
