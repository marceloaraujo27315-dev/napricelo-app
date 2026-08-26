(()=>{
const AUTH_KEY='napricelo_auth_session';
const state={perfil:null,ativo:false};
const allowed={
 administrador:['*'],
 tecnico:['Manutenções / Alertas','Clientes / Unidades','Cadastrar equipamento','POP / Agenda Instalação','POP Biodigestor','POP Caixa de Gordura','POP Água e Óleo','POP Caixa de Areia','Coleta / Análise','Histórico','Exportar registros','Agenda Geral','Alertas','Clientes','Novo equipamento'],
 operacional:['Manutenções / Alertas','POP / Agenda Instalação','POP Biodigestor','POP Caixa de Gordura','POP Água e Óleo','POP Caixa de Areia','Coleta / Análise','Histórico','Agenda Geral','Alertas'],
 comercial:['Clientes / Unidades','Histórico','Vendas / Orçamentos','Agenda Geral','Clientes','Exportar registros'],
 consulta:['Manutenções / Alertas','Clientes / Unidades','Histórico','Exportar registros','Agenda Geral','Alertas','Clientes']
};
const writeBlocked=new Set(['consulta']);
function session(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch{return null}}
async function loadRole(){const s=session();if(!s?.access_token||!s.user?.id)return null;const r=await fetch(`${SUPABASE_URL}/rest/v1/app_user_roles?select=perfil,ativo,nome,email&user_id=eq.${encodeURIComponent(s.user.id)}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${s.access_token}`}});if(!r.ok)return null;const a=await r.json();return a?.[0]||null}
function cardText(el){return (el.innerText||el.textContent||'').replace(/\s+/g,' ').trim()}
function applyCards(){const p=state.perfil;if(!p)return;document.querySelectorAll('#home .card').forEach(c=>{if(c.id==='adminUsersCard'){c.style.display=p==='administrador'?'flex':'none';return}const t=cardText(c);const ok=allowed[p]?.includes('*')||allowed[p]?.some(x=>t.includes(x));c.style.display=ok?'':'none'});document.querySelectorAll('.dash-shortcut, .quick-card, .atalho-card').forEach(c=>{const t=cardText(c);if(!t)return;const ok=allowed[p]?.includes('*')||allowed[p]?.some(x=>t.includes(x));if(!ok)c.style.display='none'});}
function applyReadOnly(){document.getElementById('permBanner')?.remove();if(!writeBlocked.has(state.perfil))return;const banner=document.createElement('div');banner.id='permBanner';banner.textContent='Perfil Consulta: acesso somente para visualização. Cadastros e alterações estão bloqueados.';banner.style.cssText='max-width:960px;margin:12px auto;padding:10px 12px;border-radius:9px;background:#fff6d8;color:#6f5712;border:1px solid #eadb9b;font-size:13px';document.querySelector('main')?.prepend(banner);document.querySelectorAll('form button[type="submit"], form button:not([type]), button.primary').forEach(b=>{b.disabled=true;b.title='Perfil somente consulta'});document.querySelectorAll('form input, form textarea, form select').forEach(el=>{el.disabled=true});}
function label(){let el=document.getElementById('profileBadge');if(!el){el=document.createElement('span');el.id='profileBadge';el.style.cssText='margin-left:8px;padding:3px 7px;border-radius:10px;background:#e7f3ed;color:#176b45;font-size:11px;font-weight:700';document.querySelector('#authUser')?.appendChild(el)}if(el)el.textContent=state.perfil?state.perfil.toUpperCase():''}
async function init(){const r=await loadRole();if(!r?.ativo){state.perfil=null;state.ativo=false;return}state.perfil=r.perfil;state.ativo=true;window.NAPRICELO_PERFIL=r.perfil;applyCards();applyReadOnly();label();setTimeout(applyCards,800);setTimeout(applyCards,1800)}
const mo=new MutationObserver(()=>{if(state.perfil)applyCards()});mo.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(init,500));window.addEventListener('napricelo-auth-changed',()=>setTimeout(init,250));
function loadExtra(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[src*="${src}"]`))return resolve();const s=document.createElement('script');s.src=`${src}?v=66`;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});}
window.addEventListener('load',()=>setTimeout(()=>{Promise.resolve().then(()=>loadExtra('comercial-edicao.js')).then(()=>loadExtra('correcao-v63.js')).then(()=>loadExtra('share-proposta-main.js')).then(()=>loadExtra('comercial-responsaveis.js')).catch(e=>console.warn('Falha ao carregar recursos comerciais adicionais',e));},900));
})();