(()=>{
'use strict';
let equipamentos=[];
let selecionado=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function headers(extra={}){return typeof photoAuthHeaders==='function'?photoAuthHeaders(extra):{...SUPABASE_HEADERS,...extra};}
function texto(v){return String(v||'').trim().toLowerCase();}
async function carregarEquipamentos(){
 try{const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos?select=*&order=id.asc`,{headers:headers()});if(!r.ok)throw new Error(await r.text());equipamentos=await r.json();window.__laudoEquipamentos=equipamentos;return equipamentos;}catch(e){console.error('Falha ao carregar equipamentos para laudo',e);equipamentos=Array.isArray(window.equipCache)?window.equipCache:[];return equipamentos;}
}
function clienteAtual(){const f=document.getElementById('laudoBioForm');return f?.elements.proprietario?.value||'';}
function unidadeAtual(){const f=document.getElementById('laudoBioForm');return f?.elements.empreendimento?.value||'';}
function labelEq(e){return `${e.codigo||'Sem código'} — ${e.cliente||''}${e.unidade?' / '+e.unidade:''}${e.capacidade?' • '+e.capacidade:''}`;}
function candidatos(){const cl=texto(clienteAtual()),un=texto(unidadeAtual());let a=equipamentos.slice();if(cl)a=a.filter(e=>texto(e.cliente)===cl||texto(e.cliente).includes(cl)||cl.includes(texto(e.cliente)));if(un)a=a.filter(e=>!e.unidade||texto(e.unidade)===un||texto(e.unidade).includes(un)||un.includes(texto(e.unidade)));return a;}
function renderSelect(){const sel=document.getElementById('lbEquipamento');if(!sel)return;const lista=candidatos();const atual=selecionado?.id?String(selecionado.id):sel.value;sel.innerHTML='<option value="">Selecionar / criar automaticamente</option>'+lista.map(e=>`<option value="${esc(e.id)}">${esc(labelEq(e))}</option>`).join('');if(atual&&lista.some(e=>String(e.id)===String(atual)))sel.value=atual;selecionado=lista.find(e=>String(e.id)===String(sel.value))||null;const msg=document.getElementById('lbEquipMsg');if(msg)msg.textContent=lista.length?`${lista.length} equipamento(s) compatível(is) encontrado(s).`:'Nenhum equipamento compatível encontrado. Ao salvar, o sistema poderá criar um registro técnico automaticamente para este laudo.';}
async function garantirUI(){const f=document.getElementById('laudoBioForm');if(!f||document.getElementById('lbEquipamentoBox'))return false;const alvo=[...f.querySelectorAll('h3')].find(h=>h.textContent.includes('Sistema avaliado'));if(!alvo)return false;const box=document.createElement('div');box.id='lbEquipamentoBox';box.className='autobox';box.style.margin='12px 0';box.innerHTML=`<h3 style="margin-top:0">Equipamento vinculado ao laudo</h3><label>Equipamento cadastrado<select id="lbEquipamento"><option value="">Carregando...</option></select></label><div id="lbEquipMsg" style="font-size:12px;color:#587064;margin-top:6px"></div><small>Se não existir equipamento compatível, o aplicativo criará um registro técnico mínimo com os dados deste laudo para permitir o salvamento e manter o vínculo com futuras manutenções.</small>`;alvo.insertAdjacentElement('beforebegin',box);document.getElementById('lbEquipamento').onchange=e=>{selecionado=equipamentos.find(x=>String(x.id)===String(e.target.value))||null;};document.getElementById('lbCliente')?.addEventListener('change',()=>setTimeout(renderSelect,250));document.getElementById('lbUnidade')?.addEventListener('change',()=>setTimeout(renderSelect,250));f.elements.proprietario?.addEventListener('input',()=>setTimeout(renderSelect,250));f.elements.empreendimento?.addEventListener('input',()=>setTimeout(renderSelect,250));await carregarEquipamentos();renderSelect();return true;}
function codigoAuto(p){const c=p.campos||{},tipo=c.sistema_tipo==='ecobio'?'ER':'BD',base=(c.empreendimento||p.unidade||p.cliente||'LAUDO').replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase()||'LAUDO';return `${tipo}-${base}-${String(Date.now()).slice(-4)}`;}
async function criarEquipamentoParaLaudo(p){const c=p.campos||{};const tipo=c.sistema_tipo==='ecobio'?'Ecobio Reator':'Biodigestor';const payload={codigo:codigoAuto(p),cliente:p.cliente||c.proprietario||null,unidade:p.unidade||c.empreendimento||null,municipio:p.municipio||null,tipo,modelo:c.marca||null,capacidade:c.capacidade||null,localizacao:p.localizacao||c.referencia_local||null,observacoes:'Cadastro técnico criado automaticamente a partir de Laudo Técnico para permitir vínculo com histórico, TRT e futuras manutenções.'};const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos`,{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());const eq=(await r.json())[0];equipamentos.push(eq);window.__laudoEquipamentos=equipamentos;try{if(Array.isArray(window.equipCache)){window.equipCache.push(eq);localStorage.setItem('equip',JSON.stringify(window.equipCache));}}catch(_){ }selecionado=eq;renderSelect();return eq;}
const originalFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
 try{
  if(init?.method==='POST'&&String(input).includes('/rest/v1/manutencoes')&&init.body){
   const p=JSON.parse(init.body);
   if(p?.tipo==='laudo_tecnico_biodigestor'){
    let eq=selecionado;
    if(!eq&&p.equipamento_id)eq=equipamentos.find(x=>String(x.id)===String(p.equipamento_id));
    if(!eq){const cand=candidatos();if(cand.length===1)eq=cand[0];}
    if(!eq)eq=await criarEquipamentoParaLaudo(p);
    p.equipamento_id=eq.id;
    p.codigo=p.codigo||eq.codigo||null;
    p.cliente=p.cliente||eq.cliente||null;
    p.unidade=p.unidade||eq.unidade||null;
    p.municipio=p.municipio||eq.municipio||null;
    p.localizacao=p.localizacao||eq.localizacao||null;
    p.campos=p.campos||{};
    p.campos.equipamento_id_vinculado=eq.id;
    p.campos.equipamento_codigo_vinculado=eq.codigo||null;
    init={...init,body:JSON.stringify(p)};
   }
  }
 }catch(e){console.error('Falha ao preparar equipamento do laudo',e);throw e;}
 return originalFetch(input,init);
};
function ativar(){garantirUI();const o=new MutationObserver(()=>garantirUI());o.observe(document.body,{childList:true,subtree:true});}
ativar();
})();