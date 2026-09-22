(()=>{
'use strict';
const KEY='napricelo_laudo_drafts_v1';
const DB='napricelo_laudo_draft_photos_v1', STORE='photos';
let dbp=null, carregando=null, editando=null, salvarTimer=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=> 'LBD-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const ler=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const gravar=a=>localStorage.setItem(KEY,JSON.stringify(a));
const getDraft=id=>ler().find(x=>x.id===id)||null;
function upsertDraft(d){const a=ler(),i=a.findIndex(x=>x.id===d.id);if(i>=0)a[i]=d;else a.unshift(d);gravar(a);renderBadge();return d}
function delDraftLocal(id){if(!id)return;gravar(ler().filter(x=>x.id!==id));limparFotos(id).catch(()=>{});renderBadge();}

function openDB(){if(dbp)return dbp;dbp=new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});return dbp}
async function putFoto(v){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(v);tx.oncomplete=()=>res(v);tx.onerror=()=>rej(tx.error)})}
async function getFoto(key){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function allFotos(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function limparFotos(id){const db=await openDB(),rs=(await allFotos()).filter(x=>x.draftId===id);return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);rs.forEach(x=>st.delete(x.key));tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}

function fotoStatus(inp,txt){let s=inp.parentElement?.querySelector('.lb-draft-photo-status');if(!s){s=document.createElement('small');s.className='lb-draft-photo-status';s.style.cssText='display:block;margin-top:5px;color:#355b49;font-weight:700';inp.insertAdjacentElement('afterend',s)}s.textContent=txt||''}
async function salvarFotoInput(inp,draftId){const file=inp.files?.[0];if(!file||!draftId)return;await putFoto({key:`${draftId}:${inp.name}`,draftId,name:inp.name,blob:file,fileName:file.name,type:file.type,updated:Date.now()});fotoStatus(inp,'✓ Foto protegida neste aparelho')}
async function restaurarFotos(form,draftId){if(!draftId)return;for(const inp of form.querySelectorAll('input[type=file]')){const r=await getFoto(`${draftId}:${inp.name}`);if(!r?.blob)continue;fotoStatus(inp,'✓ Foto recuperada do rascunho');try{const dt=new DataTransfer();dt.items.add(new File([r.blob],r.fileName||inp.name+'.jpg',{type:r.type||r.blob.type||'image/jpeg'}));inp.files=dt.files;}catch(e){console.warn('Arquivo restaurado em armazenamento local, mas não foi possível recolocar no seletor.',e)}}}

function dadosForm(form){
 const o={}; for(const el of form.elements){if(!el.name||el.type==='file'||el.type==='button'||el.type==='submit')continue;if(el.type==='checkbox')o[el.name]=!!el.checked;else o[el.name]=el.value;}
 o._cliente_id=document.getElementById('lbCliente')?.value||'';
 o._unidade_id=document.getElementById('lbUnidade')?.value||'';
 return o;
}
function aplicarDados(form,o){
 if(!o)return;
 const cli=document.getElementById('lbCliente'), uni=document.getElementById('lbUnidade');
 if(cli&&o._cliente_id){cli.value=String(o._cliente_id);cli.dispatchEvent(new Event('change',{bubbles:true}));}
 setTimeout(()=>{
   if(uni&&o._unidade_id){uni.value=String(o._unidade_id);uni.dispatchEvent(new Event('change',{bubbles:true}));}
   for(const [k,v] of Object.entries(o)){if(k.startsWith('_'))continue;const el=form.elements[k];if(!el)continue;if(el.type==='checkbox')el.checked=!!v;else el.value=v??'';}
 },120);
}
function montarDraft(form){
 const id=form.dataset.laudoDraftId||uid();form.dataset.laudoDraftId=id;
 const antigo=getDraft(id)||{};
 return {...antigo,id,updated:Date.now(),created:antigo.created||Date.now(),dados:dadosForm(form),editId:form.dataset.laudoEditId||antigo.editId||null,original:editando&&String(editando.id)===String(form.dataset.laudoEditId)?editando:(antigo.original||null)};
}
function salvarDraftAgora(mensagem=false){
 const f=document.getElementById('laudoBioForm');if(!f)return null;const d=upsertDraft(montarDraft(f));const st=document.getElementById('lbDraftStatus');if(st)st.textContent='✓ Rascunho salvo neste aparelho às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});if(mensagem)alert('Rascunho salvo neste aparelho. Você pode abrir outro laudo e voltar a este depois.');return d;
}
function agendarSalvar(){clearTimeout(salvarTimer);salvarTimer=setTimeout(()=>salvarDraftAgora(false),350)}

function renderBadge(){const b=document.getElementById('lbRascunhosBtn');if(b){const n=ler().length,txt=`Rascunhos${n?' ('+n+')':''}`;if(b.textContent!==txt)b.textContent=txt}}
function instalarTopo(){
 const sec=document.getElementById('laudosBiodigestor');if(!sec)return false;
 const tabs=sec.querySelector('.tabs');if(!tabs)return false;
 if(!document.getElementById('lbRascunhosBtn')){const b=document.createElement('button');b.type='button';b.id='lbRascunhosBtn';b.onclick=mostrarRascunhos;tabs.appendChild(b)}
 renderBadge();return true;
}
function prepararForm(){
 const f=document.getElementById('laudoBioForm');if(!f||f.dataset.draftReady==='1')return false;f.dataset.draftReady='1';
 if(!f.dataset.laudoDraftId)f.dataset.laudoDraftId=carregando?.id||uid();
 const actions=document.createElement('div');actions.className='autobox';actions.style.cssText='margin:12px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center';
 actions.innerHTML='<button type="button" class="action" id="lbSalvarRascunho">Salvar rascunho</button><button type="button" class="action" id="lbSalvarNovo">Salvar rascunho e iniciar outro</button><span id="lbDraftStatus" style="font-size:12px;color:#355b49"></span>';
 f.insertBefore(actions,f.querySelector('button.primary'));
 document.getElementById('lbSalvarRascunho').onclick=()=>salvarDraftAgora(true);
 document.getElementById('lbSalvarNovo').onclick=()=>{salvarDraftAgora(false);carregando=null;editando=null;window.LaudoBio?.novo?.();setTimeout(()=>document.getElementById('laudoBioForm')?.scrollIntoView({block:'start'}),80)};
 f.addEventListener('input',agendarSalvar);f.addEventListener('change',agendarSalvar);
 f.querySelectorAll('input[type=file]').forEach(inp=>inp.addEventListener('change',()=>salvarFotoInput(inp,f.dataset.laudoDraftId).catch(console.error)));
 if(carregando){aplicarDados(f,carregando.dados);f.dataset.laudoEditId=carregando.editId||'';editando=carregando.original||null;restaurarFotos(f,carregando.id).catch(console.error);const st=document.getElementById('lbDraftStatus');if(st)st.textContent='Rascunho recuperado deste aparelho.';carregando=null;}
 f.addEventListener('submit',interceptarSubmit,true);
 return true;
}

function mostrarRascunhos(){
 const box=document.getElementById('laudoBioConteudo');if(!box)return;const a=ler().sort((x,y)=>y.updated-x.updated);
 box.innerHTML='<h3>Rascunhos salvos neste aparelho</h3><p>Estes registros ficam disponíveis mesmo sem internet. Abra um para continuar ou corrigir.</p>'+
 (a.length?a.map(d=>`<div class="record"><b>${esc(d.dados?.empreendimento||d.dados?.proprietario||'Laudo em andamento')}</b><small>${new Date(d.updated).toLocaleString('pt-BR')} ${d.editId?'• edição de laudo salvo':''}</small><div class="mini-actions"><button type="button" onclick="LaudoCampoDraft.abrir('${esc(d.id)}')">Continuar</button><button type="button" onclick="LaudoCampoDraft.excluir('${esc(d.id)}')">Excluir rascunho</button></div></div>`).join(''):'<p>Nenhum rascunho salvo neste aparelho.</p>');
}
function abrirDraft(id){const d=getDraft(id);if(!d)return alert('Rascunho não encontrado.');carregando=d;editando=d.original||null;window.LaudoBio?.novo?.()}
async function excluirDraft(id){if(!confirm('Excluir este rascunho deste aparelho?'))return;delDraftLocal(id);mostrarRascunhos()}

function acharRegistroId(recordEl){const b=[...recordEl.querySelectorAll('button')].find(x=>/LaudoBio\.gerar\(/.test(x.getAttribute('onclick')||''));return (b?.getAttribute('onclick')||'').match(/gerar\(['"]?([^'")]+)['"]?\)/)?.[1]||null}
function injetarEditar(){
 const box=document.getElementById('laudoBioConteudo');if(!box)return;
 box.querySelectorAll('.record').forEach(r=>{if(r.querySelector('.lb-editar-laudo'))return;const id=acharRegistroId(r);if(!id)return;const acts=r.querySelector('.mini-actions');if(!acts)return;const b=document.createElement('button');b.type='button';b.className='lb-editar-laudo';b.textContent='Editar';b.onclick=()=>editarSalvo(id);acts.appendChild(b)});
}
async function editarSalvo(id){
 try{
  let x=null;
  if(Array.isArray(window.__laudoHistoricoPublico))x=window.__laudoHistoricoPublico.find(v=>String(v.id)===String(id));
  if(!x){const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,{headers:typeof photoAuthHeaders==='function'?photoAuthHeaders():SUPABASE_HEADERS});if(!r.ok)throw new Error(await r.text());x=(await r.json())[0];}
  if(!x)return alert('Laudo não encontrado.');
  editando=x;
  const c=x.campos||{};
  let cli=(window.clientesCache||[]).find(v=>String(v.nome||'').trim().toLowerCase()===String(x.cliente||c.proprietario||'').trim().toLowerCase());
  let uni=(window.unidadesCache||[]).find(v=>String(v.nome||'').trim().toLowerCase()===String(x.unidade||c.empreendimento||'').trim().toLowerCase()&&(!cli||Number(v.cliente_id)===Number(cli.id)));
  carregando={id:uid(),created:Date.now(),updated:Date.now(),editId:String(x.id),original:x,dados:{
   _cliente_id:cli?.id||'',_unidade_id:uni?.id||'',proprietario:c.proprietario||x.cliente||'',documento:c.documento||'',empreendimento:c.empreendimento||x.unidade||'',endereco:c.endereco||'',cep:c.cep||'',telefone:c.telefone||'',municipio:x.municipio||'',data:String(x.data||'').slice(0,10),localizacao:c.localizacao||x.localizacao||'',referencia_local:c.referencia_local||'',sistema_tipo:c.sistema_tipo||'napricelo',marca:c.marca||'Napricelo',capacidade:c.capacidade||'',quantidade:c.quantidade||1,unidades_atendidas:c.unidades_atendidas||'',configuracao:c.configuracao||'',condicao:c.condicao||'',intervencoes:c.intervencoes||'',conclusao:c.conclusao||'',recomendacoes:c.recomendacoes||'',normas:c.normas||'',tecnico:x.tecnico||'',trt:c.trt||'',observacoes:x.observacoes||''
  }};
  upsertDraft(carregando);window.LaudoBio?.novo?.();
 }catch(e){console.error(e);alert('Não foi possível abrir o laudo para edição.')}
}

async function interceptarSubmit(ev){
 const f=ev.currentTarget;
 if(!navigator.onLine){ev.preventDefault();ev.stopImmediatePropagation();salvarDraftAgora(false);alert('Sem internet: o laudo foi salvo como rascunho neste aparelho. Quando houver sinal, abra em Rascunhos e finalize o salvamento.');return;}
 if(!f.dataset.laudoEditId)return; // laudo novo continua usando o fluxo original
 ev.preventDefault();ev.stopImmediatePropagation();
 if(!f.reportValidity())return;
 const original=editando||getDraft(f.dataset.laudoDraftId)?.original;
 if(!original)return alert('Não foi possível localizar o registro original para editar.');
 const btn=f.querySelector('button.primary');if(btn){btn.disabled=true;btn.textContent='Salvando alterações...'}
 try{
  const fd=new FormData(f),codigo=original.codigo||('LAUDO-'+Date.now().toString().slice(-6));
  async function novaFoto(nome,etapa,antiga){const file=f.elements[nome]?.files?.[0];if(!file)return antiga||null;return await uploadFotoManutencao(file,codigo,etapa)}
  const fotoAntes=await novaFoto('foto_equip','equipamento',original.foto_antes);
  const fotoDurante=await novaFoto('foto_unidade','unidade',original.foto_durante);
  const fotoRef=await novaFoto('foto_referencia','referencia',original.campos?.foto_referencia);
  const fotoMapa=await novaFoto('foto_mapa','mapa',original.campos?.foto_mapa);
  const c0=original.campos||{};
  const campos={...c0,formato:c0.formato||'laudo-biodigestor-v1',proprietario:fd.get('proprietario')||'',documento:fd.get('documento')||'',empreendimento:fd.get('empreendimento')||'',endereco:fd.get('endereco')||'',cep:fd.get('cep')||'',telefone:fd.get('telefone')||'',localizacao:fd.get('localizacao')||'',referencia_local:fd.get('referencia_local')||'',sistema_tipo:fd.get('sistema_tipo')||'',marca:fd.get('marca')||'',capacidade:fd.get('capacidade')||'',quantidade:Number(fd.get('quantidade'))||1,unidades_atendidas:fd.get('unidades_atendidas')||'',configuracao:fd.get('configuracao')||'',condicao:fd.get('condicao')||'',intervencoes:fd.get('intervencoes')||'',conclusao:fd.get('conclusao')||'',recomendacoes:fd.get('recomendacoes')||'',normas:fd.get('normas')||'',trt:fd.get('trt')||'',foto_referencia:fotoRef,foto_mapa:fotoMapa};
  const payload={equipamento_id:original.equipamento_id||c0.equipamento_id_vinculado||null,tipo:'laudo_tecnico_biodigestor',codigo:original.codigo||codigo,cliente:campos.proprietario,unidade:campos.empreendimento,municipio:fd.get('municipio')||'',localizacao:campos.localizacao,data:fd.get('data')||null,tecnico:fd.get('tecnico')||original.tecnico||null,checks:original.checks||[],campos,observacoes:fd.get('observacoes')||null,foto_antes:fotoAntes,foto_durante:fotoDurante,foto_depois:original.foto_depois||null};
  const h=typeof photoAuthHeaders==='function'?photoAuthHeaders({'Content-Type':'application/json',Prefer:'return=representation'}):{...SUPABASE_HEADERS,Prefer:'return=representation'};
  const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?id=eq.${encodeURIComponent(original.id)}`,{method:'PATCH',headers:h,body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());
  delDraftLocal(f.dataset.laudoDraftId);editando=null;alert('Alterações do laudo técnico salvas.');await window.LaudoBio.lista();
 }catch(e){console.error(e);salvarDraftAgora(false);alert('Não foi possível enviar a alteração agora. O rascunho continua salvo neste aparelho.');}
 finally{if(btn){btn.disabled=false;btn.textContent='Salvar laudo técnico'}}
}

function envolverNovo(){
 const api=window.LaudoBio;if(!api?.novo||api.novo.__campoDraft)return false;
 const base=api.novo;
 api.novo=function(){
   if(!carregando){editando=null;}
   const r=base.apply(this,arguments);
   setTimeout(()=>{prepararForm();instalarTopo()},80);
   return r;
 };
 api.novo.__campoDraft=true;
 api.rascunhos=mostrarRascunhos;api.editar=editarSalvo;
 return true;
}

// Ao concluir com sucesso um laudo novo online, remove o rascunho correspondente.
const fetchBase=window.fetch.bind(window);
window.fetch=async function(input,init={}){
 const r=await fetchBase(input,init);
 try{
  if(r.ok&&['POST','PATCH'].includes(String(init?.method||'GET').toUpperCase())&&String(input).includes('/rest/v1/manutencoes')&&init.body){
   const p=JSON.parse(init.body);if(p?.tipo==='laudo_tecnico_biodigestor'){const f=document.getElementById('laudoBioForm');if(f?.dataset.laudoDraftId&&!f.dataset.laudoEditId)delDraftLocal(f.dataset.laudoDraftId)}
  }
 }catch(_){}
 return r;
};

window.LaudoCampoDraft={abrir:abrirDraft,excluir:excluirDraft,lista:mostrarRascunhos,salvar:salvarDraftAgora};
let obsAgendado=false;
const obs=new MutationObserver(()=>{if(obsAgendado)return;obsAgendado=true;setTimeout(()=>{obsAgendado=false;instalarTopo();envolverNovo();prepararForm();injetarEditar();},80)});
obs.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{instalarTopo();envolverNovo();injetarEditar()},2500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{instalarTopo();envolverNovo();prepararForm();});else{instalarTopo();envolverNovo();prepararForm();}
})();