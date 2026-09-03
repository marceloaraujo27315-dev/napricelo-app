(function(){
'use strict';

const EQUIPAMENTO_ID=16;
const CODIGO='ETE-RA-01';
const PREFIXO_JSON='ETE_ANALISE_JSON:';
let registros=[];

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const hoje=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
const dataBR=v=>{if(!v)return'—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v};
const num=v=>v===''||v==null?null:Number(v);

function authHeaders(extra={}){
  let jwt='';
  try{jwt=JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')?.access_token||''}catch(_){ }
  return {...SUPABASE_HEADERS,...(jwt?{Authorization:`Bearer ${jwt}`}:{ }),...extra};
}

function extrasDe(r){
  const t=String(r?.outros_param||'');
  if(!t.startsWith(PREFIXO_JSON))return{};
  try{return JSON.parse(t.slice(PREFIXO_JSON.length))||{}}catch{return{}}
}

function instalarCSS(){
  if(document.getElementById('eteAnalisesCss'))return;
  const s=document.createElement('style');s.id='eteAnalisesCss';s.textContent=`
.ete-analise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ete-analise-grid label{margin:0}.ete-analise-box{border:1px solid #dbe5df;border-radius:12px;padding:12px;background:#f8fbf9;margin:12px 0}.ete-analise-box h4{margin:0 0 8px;color:#176b45}.ete-analise-table-wrap{overflow:auto;border:1px solid #dbe5df;border-radius:10px}.ete-analise-table{width:100%;border-collapse:collapse;min-width:950px;font-size:12px}.ete-analise-table th{position:sticky;top:0;background:#176b45;color:#fff;padding:8px}.ete-analise-table td{padding:7px;border-bottom:1px solid #e1e8e4;text-align:center}.ete-analise-table td:first-child,.ete-analise-table td:nth-child(2){text-align:left}.ete-comp-resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.ete-comp-resumo div{border:1px solid #dbe5df;border-radius:10px;padding:10px;background:#fff}.ete-comp-resumo b,.ete-comp-resumo span{display:block}.ete-comp-resumo span{font-size:18px;color:#176b45;margin-top:3px}.ete-comp-list{display:flex;gap:6px;align-items:flex-end;overflow-x:auto;padding:8px 0 3px;min-height:150px}.ete-comp-bar{min-width:58px;text-align:center}.ete-comp-bar i{display:block;width:28px;margin:0 auto 5px;background:#176b45;border-radius:5px 5px 0 0;min-height:4px}.ete-comp-bar small{display:block;font-size:10px}.ete-doc-help{margin-top:7px;padding:8px 10px;background:#fffbe9;border:1px solid #eadb91;border-radius:8px;color:#67550b;font-size:12px}
@media(max-width:620px){.ete-analise-grid,.ete-comp-resumo{grid-template-columns:1fr}.ete-analise-table{font-size:11px}}
`;document.head.appendChild(s);
}

function explicarDocumentos(){
  const form=document.querySelector('[data-ete-doc-upload]');
  if(!form||form.dataset.explicado)return;
  form.dataset.explicado='1';
  const b=form.querySelector('b');if(b)b.textContent='Documentos oficiais do POP — somente administrador';
  const small=form.querySelector('small');if(small)small.textContent='Use esta área apenas para enviar ou substituir a versão oficial do POP em PDF/Word. Ela não faz parte do preenchimento diário do checklist.';
  const p=document.createElement('div');p.className='ete-doc-help';p.innerHTML='<b>Função desta área:</b> manter dentro do aplicativo a versão oficial do procedimento para consulta da equipe. Só precisa ser usada quando houver nova revisão do POP.';
  form.appendChild(p);
}

function adicionarAba(){
  const tabs=document.querySelector('#eteProdoeste .ete-tabs');
  if(!tabs||tabs.querySelector('[data-ete-analises]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.eteAnalises='1';b.textContent='Análises';
  b.onclick=()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAnalises();};
  const hist=tabs.querySelector('[data-ete-aba="historico"]');tabs.insertBefore(b,hist||null);
}

function campos(){return [
 ['ph','pH',''],['temperatura','Temperatura','°C'],['dbo','DBO','mg/L'],['dqo','DQO','mg/L'],['sst','SST','mg/L'],['solidos','Sólidos sedimentáveis','mL/L'],['od','Oxigênio dissolvido','mg/L'],['ntk','NTK','mg/L'],['nh3','Nitrogênio amoniacal (NH₃)','mg/L'],['fosforo','Fósforo total','mg/L'],['nitrito','Nitrito','mg/L'],['nitrato','Nitrato','mg/L'],['coliformes','E. coli / Coliformes','NMP/100 mL'],['surfactantes','Detergentes / Surfactantes','mg/L'],['oleos','Óleos e graxas','mg/L']
]}

function renderAnalises(){
  const el=document.getElementById('eteProdoestePainel');if(!el)return;
  el.innerHTML=`<section class="ete-panel"><h3>Análises da ETE</h3><p>Registre os resultados laboratoriais e de campo para formar um histórico e comparar a evolução do tratamento. <b>Os valores não são obrigatórios</b>; preencha somente os parâmetros efetivamente medidos ou informados pelo laboratório.</p>
  <form id="eteAnaliseForm"><div class="ete-analise-grid"><label>Data da análise<input name="data" type="date" value="${hoje()}" required></label><label>Ponto de coleta<select name="ponto" required><option value="">Selecione...</option><option>Entrada / esgoto bruto</option><option>Saída UASB</option><option>Reator aeróbio</option><option>Saída do decantador</option><option>Após filtração</option><option>Efluente final</option><option>Drenagem pluvial</option><option>Outro</option></select></label><label>Laboratório / origem do resultado<input name="laboratorio" placeholder="Ex.: laboratório contratado ou medição em campo"></label><label>Responsável pelo registro<input name="responsavel"></label></div>
  <div class="ete-analise-box"><h4>Resultados</h4><div class="ete-analise-grid">${campos().map(([n,l,u])=>`<label>${esc(l)}${u?` (${esc(u)})`:''}<input name="${n}" type="number" step="0.01"></label>`).join('')}</div></div>
  <label>Observações<textarea name="observacoes" placeholder="Registre alteração, interpretação do laboratório, condição da coleta ou ação recomendada."></textarea></label>
  <button class="primary" type="submit">Salvar análise no histórico</button></form>
  <div id="eteAnaliseHistorico" class="ete-analise-box"><h4>Histórico e evolução</h4><p>Carregando análises...</p></div></section>`;
  document.getElementById('eteAnaliseForm').onsubmit=salvarAnalise;
  carregarAnalises();
}

async function salvarAnalise(ev){
  ev.preventDefault();const f=ev.currentTarget,fd=new FormData(f),btn=f.querySelector('button[type="submit"]');
  const extra={laboratorio:fd.get('laboratorio')||'',sst:num(fd.get('sst')),od:num(fd.get('od')),ntk:num(fd.get('ntk')),nh3:num(fd.get('nh3')),fosforo:num(fd.get('fosforo')),nitrito:num(fd.get('nitrito')),nitrato:num(fd.get('nitrato')),coliformes:num(fd.get('coliformes')),surfactantes:num(fd.get('surfactantes'))};
  const payload={equipamento_id:EQUIPAMENTO_ID,codigo:CODIGO,tipo:'ETE',data:fd.get('data'),horario:null,responsavel:fd.get('responsavel')||null,ponto:fd.get('ponto'),ph:num(fd.get('ph')),temperatura:num(fd.get('temperatura')),aspecto:null,odor:null,dbo:num(fd.get('dbo')),dqo:num(fd.get('dqo')),solidos:num(fd.get('solidos')),oleos:num(fd.get('oleos')),outros_param:PREFIXO_JSON+JSON.stringify(extra),observacoes:fd.get('observacoes')||null};
  try{btn.disabled=true;btn.textContent='Salvando análise...';const r=await fetch(`${SUPABASE_URL}/rest/v1/analises`,{method:'POST',headers:authHeaders({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());alert('Análise salva no histórico da ETE.');f.reset();f.data.value=hoje();await carregarAnalises();}catch(e){console.error(e);alert('Não foi possível salvar a análise. Verifique a sessão e a internet e tente novamente.');}finally{btn.disabled=false;btn.textContent='Salvar análise no histórico';}
}

async function carregarAnalises(){
  const box=document.getElementById('eteAnaliseHistorico');if(!box)return;
  try{const r=await fetch(`${SUPABASE_URL}/rest/v1/analises?select=*&equipamento_id=eq.${EQUIPAMENTO_ID}&order=data.desc,created_at.desc&limit=60`,{headers:authHeaders()});if(!r.ok)throw new Error(await r.text());registros=await r.json();renderHistorico(box);}catch(e){console.error(e);box.innerHTML='<h4>Histórico e evolução</h4><p>Não foi possível carregar o histórico agora.</p>';}
}

function valor(r,key){const x=extrasDe(r);if(Object.prototype.hasOwnProperty.call(r,key)&&r[key]!=null)return Number(r[key]);if(x[key]!=null&&x[key]!=='')return Number(x[key]);return null}
const defs={ph:['pH',''],temperatura:['Temperatura','°C'],dbo:['DBO','mg/L'],dqo:['DQO','mg/L'],sst:['SST','mg/L'],solidos:['Sólidos sedimentáveis','mL/L'],od:['Oxigênio dissolvido','mg/L'],ntk:['NTK','mg/L'],nh3:['NH₃','mg/L'],fosforo:['Fósforo total','mg/L'],nitrito:['Nitrito','mg/L'],nitrato:['Nitrato','mg/L'],coliformes:['E. coli / Coliformes','NMP/100 mL'],surfactantes:['Surfactantes','mg/L'],oleos:['Óleos e graxas','mg/L']};

function renderHistorico(box){
  if(!registros.length){box.innerHTML='<h4>Histórico e evolução</h4><p>Ainda não há análises cadastradas para esta ETE.</p>';return;}
  box.innerHTML=`<h4>Histórico e evolução</h4><label>Comparar evolução de<select id="eteParametroComparar">${Object.entries(defs).map(([k,[n]])=>`<option value="${k}">${esc(n)}</option>`).join('')}</select></label><div id="eteComparativo"></div><div class="ete-analise-table-wrap"><table class="ete-analise-table"><thead><tr><th>Data</th><th>Ponto</th><th>pH</th><th>DBO</th><th>DQO</th><th>SST</th><th>OD</th><th>NH₃</th><th>Fósforo</th><th>Coliformes</th><th>Surfactantes</th></tr></thead><tbody>${registros.map(r=>`<tr><td>${dataBR(r.data)}</td><td>${esc(r.ponto||'—')}</td><td>${fmt(valor(r,'ph'))}</td><td>${fmt(valor(r,'dbo'))}</td><td>${fmt(valor(r,'dqo'))}</td><td>${fmt(valor(r,'sst'))}</td><td>${fmt(valor(r,'od'))}</td><td>${fmt(valor(r,'nh3'))}</td><td>${fmt(valor(r,'fosforo'))}</td><td>${fmt(valor(r,'coliformes'))}</td><td>${fmt(valor(r,'surfactantes'))}</td></tr>`).join('')}</tbody></table></div>`;
  const sel=document.getElementById('eteParametroComparar');sel.onchange=()=>renderComparativo(sel.value);renderComparativo(sel.value);
}

function fmt(v){return v==null||Number.isNaN(v)?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2})}
function renderComparativo(key){
  const box=document.getElementById('eteComparativo');if(!box)return;const [nome,un]=defs[key];
  const dados=registros.map(r=>({data:r.data,ponto:r.ponto,v:valor(r,key)})).filter(x=>x.v!=null&&!Number.isNaN(x.v)).slice(0,12).reverse();
  if(!dados.length){box.innerHTML=`<p>Nenhum valor de ${esc(nome)} registrado ainda.</p>`;return;}
  const atual=dados[dados.length-1]?.v,ant=dados.length>1?dados[dados.length-2].v:null,delta=ant==null?null:atual-ant,max=Math.max(...dados.map(x=>Math.abs(x.v)),1);
  const tendencia=delta==null?'Sem comparação':delta>0?'↑ Aumentou':delta<0?'↓ Reduziu':'→ Estável';
  box.innerHTML=`<div class="ete-comp-resumo"><div><b>Último resultado</b><span>${fmt(atual)} ${esc(un)}</span></div><div><b>Resultado anterior</b><span>${ant==null?'—':fmt(ant)+' '+esc(un)}</span></div><div><b>Tendência</b><span>${esc(tendencia)}</span></div></div><div class="ete-comp-list">${dados.map(x=>`<div class="ete-comp-bar"><b>${fmt(x.v)}</b><i style="height:${Math.max(4,Math.round(Math.abs(x.v)/max*95))}px"></i><small>${dataBR(x.data)}</small></div>`).join('')}</div><small>Comparação visual dos últimos resultados cadastrados. A tendência mostra apenas a variação numérica entre os dois últimos registros, não uma conclusão de conformidade.</small>`;
}

function observar(){
  instalarCSS();adicionarAba();explicarDocumentos();
  const root=document.getElementById('eteProdoeste');if(!root)return;
  const mo=new MutationObserver(()=>{adicionarAba();explicarDocumentos();});mo.observe(root,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(observar,100));else setTimeout(observar,100);
})();
