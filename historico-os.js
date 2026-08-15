async function carregarHistoricoOS(){
  const box=document.getElementById('listaHistorico');if(!box)return;
  box.innerHTML='<p>Carregando ordens de serviço...</p>';
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&order=id.desc`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    const lista=await r.json();
    if(!lista.length){box.innerHTML='<p>Nenhuma ordem de serviço registrada.</p>';return;}
    box.innerHTML=`<div class="os-hist-filtros"><input id="osHistBusca" placeholder="Buscar por OS, cliente ou responsável" oninput="filtrarHistoricoOS()"><select id="osHistStatus" onchange="filtrarHistoricoOS()"><option value="">Todos os status</option><option>Aberta</option><option>Em execução</option><option>Concluída</option></select></div><div id="osHistLista"></div>`;
    window.historicoOSCache=lista;filtrarHistoricoOS();
  }catch(e){console.error(e);box.innerHTML='<p>Não foi possível carregar as ordens de serviço.</p>';}
}
function filtrarHistoricoOS(){
  const q=(document.getElementById('osHistBusca')?.value||'').toLowerCase(),st=document.getElementById('osHistStatus')?.value||'';
  const arr=(window.historicoOSCache||[]).filter(o=>(!st||o.status===st)&&(!q||[o.numero,o.responsavel_execucao,o.status].some(v=>String(v||'').toLowerCase().includes(q))));
  const box=document.getElementById('osHistLista');if(!box)return;
  box.innerHTML=arr.length?arr.map(o=>`<div class="os-hist-card"><div><b>${escHtml(o.numero||'OS')}</b><small>${escHtml(o.status||'Aberta')} • ${o.data_inicio?fmtComData(o.data_inicio):'Sem data'}${o.responsavel_execucao?' • '+escHtml(o.responsavel_execucao):''}</small></div><div class="os-hist-acoes"><button onclick="executarAgendaComercial(${Number(o.agenda_id)})">Abrir</button><button onclick="imprimirOrdemServico(${Number(o.agenda_id)})">Imprimir / PDF</button></div></div>`).join(''):'<p>Nenhuma OS encontrada com esse filtro.</p>';
}
(function(){const st=document.createElement('style');st.textContent='.os-hist-filtros{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin:12px 0}.os-hist-filtros input,.os-hist-filtros select{padding:10px;border:1px solid #d7e2dc;border-radius:8px}.os-hist-card{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #dfe8e3;border-left:4px solid #176b45;border-radius:8px;margin:8px 0;background:#fff}.os-hist-card small{display:block;margin-top:4px;color:#617168}.os-hist-acoes{display:flex;gap:6px}.os-hist-acoes button{border:0;border-radius:7px;padding:8px 10px;color:#176b45;background:#edf6f1;font-weight:700}@media(max-width:650px){.os-hist-filtros{grid-template-columns:1fr}.os-hist-card{align-items:flex-start;flex-direction:column}}';document.head.appendChild(st);})();