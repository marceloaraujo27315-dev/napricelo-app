/* Ordens de Serviço dentro do prontuário ambiental do cliente */
async function carregarOSCliente(clienteId){
  const box=document.getElementById('clienteOSLista');
  if(!box)return;
  box.innerHTML='<p class="muted">Carregando ordens de serviço...</p>';
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&cliente_id=eq.${Number(clienteId)}&order=id.desc`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    let lista=await r.json();
    /* Compatibilidade com OS antigas que possam não ter cliente_id gravado */
    if(!lista.length){
      const c=(window.clientesCache||[]).find(x=>Number(x.id)===Number(clienteId));
      const rg=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&order=id.desc`,{headers:SUPABASE_HEADERS});
      if(rg.ok){
        const todas=await rg.json();
        lista=todas.filter(o=>Number(o.cliente_id)===Number(clienteId)||(c&&String(o.cliente||'').trim().toLowerCase()===String(c.nome||'').trim().toLowerCase()));
      }
    }
    renderOSCliente(lista);
  }catch(e){
    console.error('OS do cliente:',e);
    box.innerHTML='<p class="muted">Não foi possível carregar as ordens de serviço deste cliente.</p>';
  }
}
function renderOSCliente(lista){
  const box=document.getElementById('clienteOSLista');if(!box)return;
  if(!lista.length){box.innerHTML='<p class="muted">Nenhuma ordem de serviço vinculada a este cliente.</p>';return;}
  box.innerHTML=`<div class="cliente-os-toolbar"><input id="clienteOSBusca" placeholder="Buscar OS, serviço, equipamento ou responsável" oninput="filtrarOSCliente()"><select id="clienteOSStatus" onchange="filtrarOSCliente()"><option value="">Todos os status</option><option>Aberta</option><option>Em execução</option><option>Concluída</option></select></div><div id="clienteOSCards"></div>`;
  window.clienteOSCache=lista;filtrarOSCliente();
}
function filtrarOSCliente(){
  const q=String(document.getElementById('clienteOSBusca')?.value||'').toLowerCase();
  const st=String(document.getElementById('clienteOSStatus')?.value||'');
  const arr=(window.clienteOSCache||[]).filter(o=>(!st||String(o.status||'')===st)&&(!q||[o.numero,o.tipo_servico,o.equipamento_codigo,o.responsavel_execucao,o.responsavel].some(v=>String(v||'').toLowerCase().includes(q))));
  const box=document.getElementById('clienteOSCards');if(!box)return;
  box.innerHTML=arr.length?arr.map(o=>{
    const numero=o.numero||`OS-${String(o.id||'').padStart(5,'0')}`;
    const data=o.data_conclusao||o.data_inicio||o.created_at;
    const resp=o.responsavel_execucao||o.responsavel||'A definir';
    const agenda=Number(o.agenda_id||0);
    return `<div class="cliente-os-card"><div class="cliente-os-main"><b>${escHtml(numero)}</b><span>${escHtml(o.tipo_servico||'Serviço')}</span><small>${escHtml(o.equipamento_codigo||o.equipamento||'Sem equipamento informado')} • ${escHtml(resp)}</small></div><div class="cliente-os-meta"><span class="cliente-os-status">${escHtml(o.status||'Aberta')}</span><small>${data?fmtData(data):'Sem data'}</small></div><div class="cliente-os-actions">${agenda?`<button onclick="fecharFichaCliente();executarAgendaComercial(${agenda})">Abrir OS</button><button onclick="imprimirOrdemServico(${agenda})">Imprimir / PDF</button>`:'<span class="muted">OS sem agenda vinculada</span>'}</div></div>`;
  }).join(''):'<p class="muted">Nenhuma OS encontrada com esse filtro.</p>';
}
(function integrarOSProntuario(){
  const original=window.renderFichaCliente;
  if(typeof original!=='function')return;
  window.renderFichaCliente=function(c,equipamentos,manut,analises,unidadeInicial){
    original(c,equipamentos,manut,analises,unidadeInicial);
    const content=document.getElementById('clientProfileContent');if(!content)return;
    const sec=document.createElement('section');sec.className='cliente-os-section';
    sec.innerHTML=`<div class="cliente-os-head"><div><h3>Ordens de Serviço</h3><small>Histórico operacional vinculado ao cliente</small></div></div><div id="clienteOSLista"><p class="muted">Carregando ordens de serviço...</p></div>`;
    const atividades=[...content.querySelectorAll('h3')].find(h=>h.textContent.trim()==='Atividades recentes');
    if(atividades)content.insertBefore(sec,atividades);else content.appendChild(sec);
    carregarOSCliente(c.id);
  };
  const st=document.createElement('style');st.textContent=`.cliente-os-section{margin-top:18px}.cliente-os-head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #dce8e1;padding-bottom:7px;margin-bottom:8px}.cliente-os-head h3{margin:0;color:#176b45}.cliente-os-head small{color:#6a786f}.cliente-os-toolbar{display:grid;grid-template-columns:2fr 1fr;gap:7px;margin:8px 0}.cliente-os-toolbar input,.cliente-os-toolbar select{padding:9px;border:1px solid #d5e1da;border-radius:8px;background:#fff}.cliente-os-card{display:grid;grid-template-columns:minmax(0,1.5fr) auto auto;gap:10px;align-items:center;border:1px solid #dce7e1;border-left:4px solid #176b45;border-radius:9px;padding:10px;margin:7px 0;background:#fff}.cliente-os-main b,.cliente-os-main span,.cliente-os-main small{display:block}.cliente-os-main b{color:#0d5f3b}.cliente-os-main small,.cliente-os-meta small{color:#64736b;margin-top:3px}.cliente-os-meta{text-align:right}.cliente-os-status{display:inline-block;background:#edf6f1;color:#176b45;border-radius:12px;padding:3px 7px;font-weight:700;font-size:11px}.cliente-os-actions{display:flex;gap:5px}.cliente-os-actions button{border:0;border-radius:7px;padding:8px 9px;background:#edf6f1;color:#176b45;font-weight:700;cursor:pointer}@media(max-width:700px){.cliente-os-toolbar{grid-template-columns:1fr}.cliente-os-card{grid-template-columns:1fr}.cliente-os-meta{text-align:left}.cliente-os-actions{flex-wrap:wrap}}`;document.head.appendChild(st);
})();