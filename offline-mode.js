(()=>{
const DB='napricelo_offline_v1',STORE='queue';
const NATIVE_FETCH=window.fetch.bind(window);
// Cadastros de cliente/unidade também precisam funcionar em campo sem sinal.
const ALLOWED_TABLES=['clientes','unidades','manutencoes','analises','instalacoes','ordens_servico','agendamentos_servicos'];
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function addQueue(item){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add(item);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function allQueue(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function delQueue(id){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function headersObj(h){const out={};new Headers(h||{}).forEach((v,k)=>out[k]=v);return out}
function currentToken(){try{return JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')?.access_token||''}catch{return ''}}
function isQueueable(url,method){if(!/https:\/\/[^/]+\.supabase\.co\//.test(url))return false;if(url.includes('/storage/v1/object/manutencoes-fotos/')&&method==='POST')return true;const m=url.match(/\/rest\/v1\/([^?]+)/);return !!(m&&ALLOWED_TABLES.includes(m[1])&&['POST','PATCH','DELETE'].includes(method))}
function localResult(url,method,body){if(url.includes('/storage/v1/object/'))return {};
 let obj={};try{if(typeof body==='string')obj=JSON.parse(body)}catch{}
 if(method==='POST')return [{...obj,id:-Date.now(),offline_pending:true}];return []}
async function queueRequest(url,init){const method=(init.method||'GET').toUpperCase();await addQueue({url,method,headers:headersObj(init.headers),body:init.body||null,created_at:new Date().toISOString()});updateUI();return new Response(JSON.stringify(localResult(url,method,init.body)),{status:200,headers:{'Content-Type':'application/json','X-Napricelo-Offline':'queued'}})}
window.fetch=async function(input,init={}){const url=typeof input==='string'?input:input.url;const method=(init.method||(typeof input!=='string'&&input.method)||'GET').toUpperCase();if(isQueueable(url,method)){
  if(!navigator.onLine)return queueRequest(url,init);
  try{const r=await NATIVE_FETCH(input,init);return r}catch(e){return queueRequest(url,init)}
 }
 return NATIVE_FETCH(input,init)
};
async function sync(){if(!navigator.onLine){updateUI('Sem internet. Os dados continuam guardados neste aparelho.');return}const items=await allQueue();if(!items.length){updateUI('Tudo sincronizado.');return}updateUI(`Sincronizando ${items.length} registro(s)...`,true);for(const it of items){try{const h={...it.headers};const token=currentToken();if(token)h.authorization=`Bearer ${token}`;const r=await NATIVE_FETCH(it.url,{method:it.method,headers:h,body:it.body});if(!r.ok){if(r.status===401||r.status===403){updateUI('Entre novamente para sincronizar os registros pendentes.');return}throw new Error(await r.text())}await delQueue(it.id)}catch(e){console.error('Falha de sincronização offline',e);updateUI('Ainda há registros pendentes. Tente sincronizar novamente quando a conexão estiver estável.');return}}updateUI('Sincronização concluída.');window.dispatchEvent(new Event('napricelo-offline-synced'))}
function ensureUI(){let el=document.getElementById('offlineStatus');if(el)return el;el=document.createElement('div');el.id='offlineStatus';el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:58px;z-index:9985;display:flex;gap:8px;align-items:center;padding:7px 10px;border-radius:10px;background:#fff;border:1px solid #d7e4dd;box-shadow:0 2px 10px #0002;font:12px Arial;color:#294738;max-width:92vw';el.innerHTML='<span data-state></span><span data-count></span><button data-sync style="border:0;border-radius:7px;padding:5px 8px;background:#176b45;color:white;font-weight:700">Sincronizar</button>';el.querySelector('[data-sync]').onclick=sync;document.body.appendChild(el);return el}
async function updateUI(message,busy=false){const el=ensureUI(),q=await allQueue().catch(()=>[]),state=el.querySelector('[data-state]'),count=el.querySelector('[data-count]'),btn=el.querySelector('[data-sync]');state.textContent=message||(navigator.onLine?'ONLINE':'OFFLINE');state.style.fontWeight='700';state.style.color=navigator.onLine?'#176b45':'#a65700';count.textContent=q.length?`${q.length} pendente(s)`:'';btn.style.display=q.length?'inline-block':'none';btn.disabled=busy}
window.napriceloSyncOffline=sync;
window.napriceloOfflinePendentes=()=>allQueue();
window.addEventListener('online',()=>{updateUI('Internet voltou. Sincronizando...');setTimeout(sync,700)});window.addEventListener('offline',()=>updateUI('OFFLINE • registros serão salvos neste aparelho'));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>updateUI());else updateUI();
})();