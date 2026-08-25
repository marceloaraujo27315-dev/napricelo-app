let clienteFichaCache={equip:[],manut:[],analises:[]};
const CLIENTE_FICHA_OFFLINE_KEY='napricelo_cliente_ficha_offline_v1';
function lerFichaOffline(){try{return JSON.parse(localStorage.getItem(CLIENTE_FICHA_OFFLINE_KEY)||'{}')}catch{return {}}}
function salvarFichaOffline(clienteId,dados){try{const all=lerFichaOffline();all[String(clienteId)]={...dados,salvo_em:new Date().toISOString()};localStorage.setItem(CLIENTE_FICHA_OFFLINE_KEY,JSON.stringify(all))}catch(e){console.warn('Não foi possível atualizar cache offline do prontuário',e)}}
function obterFichaOffline(clienteId){return lerFichaOffline()[String(clienteId)]||null}

async function buscarRest(path){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

function fmtData(v){
  if(!v)return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[a,m,d]=v.split("-");return `${d}/${m}/${a}`;}
  const dt=new Date(v);return Number.isNaN(dt.getTime())?v:dt.toLocaleDateString("pt-BR");
}

const renderClientesUnidadesBase=renderClientesUnidades;
renderClientesUnidades=function(){
  const el=document.getElementById("listaClientesUnidades");
  if(!el)return;
  if(!clientesCache.length){el.innerHTML="<p>Nenhum cliente cadastrado ainda.</p>";return;}
  el.innerHTML=clientesCache.map(c=>{
    const us=unidadesCache.filter(u=>Number(u.cliente_id)===Number(c.id));
    return `<div class="record client-record"><div class="record-head"><div><b>${escHtml(c.nome)}</b><small>${escHtml(c.documento||"")}${c.municipio?" • "+escHtml(c.municipio):""}</small>${c.responsavel?`<small>Contato: ${escHtml(c.responsavel)}</small>`:""}</div><div class="mini-actions"><button class="open-client" onclick="abrirFichaCliente(${c.id})">Abrir ficha</button><button onclick="editarCliente(${c.id})">Editar</button><button class="danger" onclick="excluirCliente(${c.id})">Excluir</button></div></div>${us.length?`<div class="unit-list">${us.map(u=>`<div class="autobox unit-card"><div><b>${escHtml(u.nome)}</b><br>${escHtml(u.municipio||"")}${u.endereco?" • "+escHtml(u.endereco):""}</div><div class="mini-actions"><button onclick="abrirFichaCliente(${c.id},${u.id})">Ver unidade</button><button onclick="editarUnidade(${u.id})">Editar</button><button class="danger" onclick="excluirUnidade(${u.id})">Excluir</button></div></div>`).join("")}</div>`:'<small>Nenhuma unidade cadastrada.</small>'}</div>`;
  }).join("");
};

async function abrirFichaCliente(clienteId,unidadeInicial){
  const c=clientesCache.find(x=>Number(x.id)===Number(clienteId));if(!c)return;
  let modal=document.getElementById("clientProfileModal");
  if(!modal){modal=document.createElement("div");modal.id="clientProfileModal";modal.className="detail-modal";modal.innerHTML='<div class="detail-sheet client-profile-sheet"><button class="detail-close" onclick="fecharFichaCliente()">×</button><div id="clientProfileContent"></div></div>';document.body.appendChild(modal)}
  modal.classList.add("open");document.body.style.overflow="hidden";
  const content=document.getElementById("clientProfileContent");content.innerHTML='<p>Carregando prontuário do cliente...</p>';
  try{
    if(!navigator.onLine)throw new Error('offline');
    const equipamentos=await buscarRest(`equipamentos?select=*&cliente_id=eq.${Number(clienteId)}&order=codigo.asc`);
    const ids=equipamentos.map(e=>Number(e.id)).filter(Boolean);let manut=[],analises=[];
    if(ids.length){const lista=ids.join(",");[manut,analises]=await Promise.all([buscarRest(`manutencoes?select=*&equipamento_id=in.(${lista})&order=created_at.desc`),buscarRest(`analises?select=*&equipamento_id=in.(${lista})&order=created_at.desc`)])}
    clienteFichaCache={equip:equipamentos,manut,analises};salvarFichaOffline(clienteId,clienteFichaCache);renderFichaCliente(c,equipamentos,manut,analises,unidadeInicial,false);
  }catch(err){
    console.warn('Prontuário online indisponível, tentando cache local',err);
    const local=obterFichaOffline(clienteId);
    if(local){clienteFichaCache={equip:local.equip||[],manut:local.manut||[],analises:local.analises||[]};renderFichaCliente(c,clienteFichaCache.equip,clienteFichaCache.manut,clienteFichaCache.analises,unidadeInicial,true)}
    else content.innerHTML='<p><b>Prontuário ainda não preparado para uso offline.</b><br>Abra este cliente uma vez com internet antes de ir para o campo.</p>';
  }
}

function fecharFichaCliente(){const m=document.getElementById("clientProfileModal");if(m)m.classList.remove("open");document.body.style.overflow="";}

function renderFichaCliente(c,equipamentos,manut,analises,unidadeInicial,offline=false){
  const unidades=unidadesCache.filter(u=>Number(u.cliente_id)===Number(c.id));const totalManut=manut.length,totalAnalises=analises.length;
  const htmlUnidades=unidades.length?unidades.map(u=>{const eqs=equipamentos.filter(e=>Number(e.unidade_id)===Number(u.id));return `<section class="profile-unit ${Number(unidadeInicial)===Number(u.id)?'unit-focus':''}"><div class="profile-unit-head"><div><h3>${escHtml(u.nome)}</h3><small>${escHtml(u.municipio||"")}${u.endereco?" • "+escHtml(u.endereco):""}</small>${u.responsavel?`<small>Responsável local: ${escHtml(u.responsavel)}</small>`:""}</div><span>${eqs.length} equipamento(s)</span></div>${eqs.length?eqs.map(e=>cartaoEquipCliente(e,manut,analises)).join(""):'<p class="muted">Nenhum equipamento vinculado a esta unidade.</p>'}</section>`}).join(""):'<p class="muted">Nenhuma unidade cadastrada para este cliente.</p>';
  const semUnidade=equipamentos.filter(e=>!e.unidade_id);const content=document.getElementById("clientProfileContent");
  content.innerHTML=`<div class="detail-head"><small>PRONTUÁRIO AMBIENTAL${offline?' • OFFLINE':''}</small><h2>${escHtml(c.nome)}</h2><p>${escHtml(c.documento||"")}</p></div>${offline?'<div class="autobox"><b>Modo offline:</b> exibindo a última cópia salva neste aparelho.</div>':''}<div class="profile-info-grid"><div><b>Município</b><span>${escHtml(c.municipio||"—")}</span></div><div><b>Responsável / contato</b><span>${escHtml(c.responsavel||"—")}</span></div><div><b>Telefone</b><span>${escHtml(c.telefone||"—")}</span></div><div><b>E-mail</b><span>${escHtml(c.email||"—")}</span></div><div class="wide"><b>Endereço</b><span>${escHtml(c.endereco||"—")}</span></div></div><div class="profile-stats"><div><b>${unidades.length}</b><span>Unidades</span></div><div><b>${equipamentos.length}</b><span>Equipamentos</span></div><div><b>${totalManut}</b><span>Manutenções</span></div><div><b>${totalAnalises}</b><span>Análises</span></div></div><h3>Unidades e equipamentos</h3>${htmlUnidades}${semUnidade.length?`<section class="profile-unit"><div class="profile-unit-head"><div><h3>Sem unidade vinculada</h3></div><span>${semUnidade.length} equipamento(s)</span></div>${semUnidade.map(e=>cartaoEquipCliente(e,manut,analises)).join("")}</section>`:""}<h3>Atividades recentes</h3>${atividadesRecentes(manut,analises)}${c.observacoes?`<h3>Observações do cliente</h3><div class="detail-note">${escHtml(c.observacoes)}</div>`:""}`;
  if(unidadeInicial)setTimeout(()=>document.querySelector('.unit-focus')?.scrollIntoView({behavior:'smooth',block:'start'}),150);
}

function cartaoEquipCliente(e,manut,analises){const ms=manut.filter(x=>Number(x.equipamento_id)===Number(e.id));const as=analises.filter(x=>Number(x.equipamento_id)===Number(e.id));const ultimaM=ms[0],ultimaA=as[0];return `<div class="profile-equip"><div class="profile-equip-main"><b>${escHtml(e.codigo||"Sem código")}</b><span>${escHtml(e.tipo||"")}${e.capacidade?" • "+escHtml(e.capacidade):""}</span><small>${escHtml(e.localizacao||"")}${e.modelo?" • "+escHtml(e.modelo):""}</small></div><div class="profile-equip-meta"><span>${ms.length} manut.</span><span>${as.length} análises</span></div><div class="profile-last">${ultimaM?`Última manutenção: <b>${fmtData(ultimaM.data||ultimaM.created_at)}</b>`:"Sem manutenção registrada"}${ultimaA?`<br>Última análise: <b>${fmtData(ultimaA.data||ultimaA.created_at)}</b>`:""}</div></div>`}
function atividadesRecentes(manut,analises){const itens=[...manut.map(x=>({...x,_cat:"Manutenção",_data:x.data||x.created_at})),...analises.map(x=>({...x,_cat:"Análise",_data:x.data||x.created_at}))].sort((a,b)=>new Date(b._data)-new Date(a._data)).slice(0,8);if(!itens.length)return '<p class="muted">Nenhuma atividade registrada para os equipamentos deste cliente.</p>';return `<div class="profile-activity">${itens.map(x=>`<div><b>${escHtml(x._cat)}</b><span>${escHtml(x.codigo||"")}</span><small>${fmtData(x._data)}${x.tecnico?" • "+escHtml(x.tecnico):x.responsavel?" • "+escHtml(x.responsavel):""}</small></div>`).join("")}</div>`}
