async function dadosOrdemServicoAgenda(id){
  const a=(agendaComercialCache||[]).find(x=>Number(x.id)===Number(id));
  if(!a)throw new Error('Agendamento não encontrado.');
  const reqs=[];
  reqs.push(a.cliente_id?fetch(`${SUPABASE_URL}/rest/v1/clientes?select=*&id=eq.${Number(a.cliente_id)}&limit=1`,{headers:SUPABASE_HEADERS}):Promise.resolve(null));
  reqs.push(a.unidade_id?fetch(`${SUPABASE_URL}/rest/v1/unidades?select=*&id=eq.${Number(a.unidade_id)}&limit=1`,{headers:SUPABASE_HEADERS}):Promise.resolve(null));
  reqs.push(a.orcamento_id?fetch(`${SUPABASE_URL}/rest/v1/orcamentos?select=*&id=eq.${Number(a.orcamento_id)}&limit=1`,{headers:SUPABASE_HEADERS}):Promise.resolve(null));
  reqs.push(a.orcamento_id?fetch(`${SUPABASE_URL}/rest/v1/orcamento_itens?select=*&orcamento_id=eq.${Number(a.orcamento_id)}&order=id.asc`,{headers:SUPABASE_HEADERS}):Promise.resolve(null));
  const [rc,ru,ro,ri]=await Promise.all(reqs);
  const ler=async r=>{if(!r)return null;if(!r.ok)throw new Error(await r.text());return r.json();};
  const [clArr,unArr,orArr,itensArr]=await Promise.all([ler(rc),ler(ru),ler(ro),ler(ri)]);
  return {a,cliente:clArr?.[0]||null,unidade:unArr?.[0]||null,orcamento:orArr?.[0]||null,itens:itensArr||[]};
}
function osLinha(t,v){return `<div class="os-linha"><b>${escHtml(t)}</b><span>${escHtml(v||'—')}</span></div>`;}
function osItens(itens){if(!itens?.length)return '<p class="muted">Sem itens vinculados.</p>';return `<div class="os-itens">${itens.map(i=>`<div><b>${escHtml(i.descricao||'')}</b><span>${Number(i.quantidade||0).toLocaleString('pt-BR')} ${escHtml(i.unidade||'')} • ${moeda(i.subtotal||0)}</span></div>`).join('')}</div>`;}
async function abrirOrdemServicoAgenda(id){
  let d;try{d=await dadosOrdemServicoAgenda(id);}catch(e){console.error(e);return alert('Não foi possível montar a ordem de serviço.');}
  const {a,cliente,unidade,orcamento,itens}=d;
  const endereco=unidade?.endereco||cliente?.endereco||a.local_servico||'';
  const contato=unidade?.responsavel||cliente?.responsavel||'';
  const telefone=cliente?.telefone||'';
  const html=`<div class="detail-head"><small>ORDEM DE SERVIÇO</small><h2>OS-${String(a.id).padStart(5,'0')}</h2><p>${escHtml(a.tipo_servico||'Serviço')}</p></div>
    <div class="os-status"><b>${escHtml(statusPrazoAgenda(a).t)}</b><span>${fmtComData(a.data_agendada)}${a.horario?' • '+String(a.horario).slice(0,5):''}</span></div>
    <h3>Cliente e local</h3>${osLinha('Cliente',a.cliente||cliente?.nome)}${osLinha('Unidade / propriedade',a.unidade||unidade?.nome)}${osLinha('Município',unidade?.municipio||cliente?.municipio)}${osLinha('Endereço / local',endereco)}${osLinha('Contato',contato)}${osLinha('Telefone',telefone)}
    <h3>Origem comercial</h3>${osLinha('Orçamento',orcamento?.numero||(a.orcamento_id?`#${a.orcamento_id}`:'Sem orçamento'))}${orcamento?osLinha('Valor da venda',moeda(orcamento.total)):''}${osItens(itens)}
    <h3>Execução</h3>${osLinha('Tipo de serviço',a.tipo_servico)}${osLinha('Responsável',a.responsavel)}${osLinha('Local / setor',a.local_servico||a.unidade)}<div class="detail-note">${escHtml(a.observacoes||orcamento?.observacoes||'Sem observações adicionais.')}</div>
    <div class="os-acoes"><button class="report-btn" onclick="iniciarServicoDaOS(${Number(a.id)})">Iniciar execução / POP</button><button class="action" onclick="imprimirOrdemServico(${Number(a.id)})">Imprimir OS</button><button class="action" onclick="concluirAgendaComercial(${Number(a.id)})">Concluir serviço</button></div>`;
  abrirFicha(html);
}
async function iniciarServicoDaOS(id){
  const a=(agendaComercialCache||[]).find(x=>Number(x.id)===Number(id));if(!a)return;
  const tipo=String(a.tipo_servico||'').toLowerCase();
  if(tipo.includes('instala')){
    if(typeof fecharFicha==='function')fecharFicha();
    showPage('instalacao');if(typeof mostrarRegistroInstalacao==='function')mostrarRegistroInstalacao();
    setTimeout(async()=>{const f=document.getElementById('instalacaoForm');if(!f)return;const cs=document.getElementById('instClienteSelect');if(cs&&a.cliente_id){cs.value=String(a.cliente_id);cs.dispatchEvent(new Event('change',{bubbles:true}));}setTimeout(()=>{const us=document.getElementById('instUnidadeSelect');if(us&&a.unidade_id)us.value=String(a.unidade_id);const loc=f.querySelector('[name=local_instalacao]');if(loc&&!loc.value)loc.value=a.local_servico||a.unidade||'';const obs=f.querySelector('[name=observacoes]');if(obs&&!obs.value)obs.value=`Execução vinculada à OS-${String(a.id).padStart(5,'0')}${a.orcamento_id?' • orçamento #'+a.orcamento_id:''}.`;f.dataset.agendaComercialId=String(a.id);},180);},120);return;
  }
  const eq=(typeof eqs==='function'?eqs():[]).filter(e=>Number(e.cliente_id)===Number(a.cliente_id)&&(a.unidade_id?Number(e.unidade_id)===Number(a.unidade_id):true));
  if(tipo.includes('manuten')&&eq.length===1&&typeof abrirFichaEquipamento==='function'){if(typeof fecharFicha==='function')fecharFicha();abrirFichaEquipamento(eq[0].id);return;}
  if(tipo.includes('analis')&&eq.length===1){if(typeof fecharFicha==='function')fecharFicha();showPage('analise');setTimeout(()=>{const s=document.getElementById('analiseEquip');if(s){s.value=String(eq[0].id);s.dispatchEvent(new Event('change'));}},120);return;}
  alert('Selecione o equipamento correspondente para continuar o registro do serviço.');showPage('historico');
}
async function imprimirOrdemServico(id){
  let d;try{d=await dadosOrdemServicoAgenda(id);}catch(e){return alert('Não foi possível carregar a OS.');}
  const {a,cliente,unidade,orcamento,itens}=d,w=window.open('','_blank');if(!w)return alert('Permita pop-ups para imprimir a OS.');
  const endereco=unidade?.endereco||cliente?.endereco||a.local_servico||'';
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OS-${String(a.id).padStart(5,'0')}</title><style>@page{size:A4;margin:13mm}body{font-family:Arial,sans-serif;font-size:11px;color:#25372d}header{border-bottom:4px solid #176b45;padding-bottom:10px;display:flex;justify-content:space-between}h1,h2{color:#176b45}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}.l{border-bottom:1px solid #ddd;padding:5px}.l b{display:inline-block;min-width:115px}.it{padding:7px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between}.obs{padding:10px;background:#f3f7f5;margin-top:8px;white-space:pre-wrap}.assin{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:55px;text-align:center}.assin div{border-top:1px solid #555;padding-top:6px}.acoes{margin-top:20px}@media print{.acoes{display:none}}</style></head><body><header><div><h1>NAPRICELO</h1><b>Soluções Ambientais</b></div><div style="text-align:right"><b>ORDEM DE SERVIÇO</b><br>OS-${String(a.id).padStart(5,'0')}<br>${fmtComData(a.data_agendada)} ${a.horario?String(a.horario).slice(0,5):''}</div></header><h2>${escHtml(a.tipo_servico||'Serviço')}</h2><div class="grid"><div class="l"><b>Cliente</b>${escHtml(a.cliente||cliente?.nome||'')}</div><div class="l"><b>Unidade</b>${escHtml(a.unidade||unidade?.nome||'')}</div><div class="l"><b>Município</b>${escHtml(unidade?.municipio||cliente?.municipio||'')}</div><div class="l"><b>Contato</b>${escHtml(unidade?.responsavel||cliente?.responsavel||'')}</div><div class="l"><b>Telefone</b>${escHtml(cliente?.telefone||'')}</div><div class="l"><b>Endereço</b>${escHtml(endereco)}</div><div class="l"><b>Orçamento</b>${escHtml(orcamento?.numero||(a.orcamento_id?'#'+a.orcamento_id:'—'))}</div><div class="l"><b>Responsável</b>${escHtml(a.responsavel||'')}</div></div><h2>Produtos / serviços</h2>${itens.length?itens.map(i=>`<div class="it"><span>${escHtml(i.descricao||'')} • ${Number(i.quantidade||0).toLocaleString('pt-BR')} ${escHtml(i.unidade||'')}</span><b>${moeda(i.subtotal||0)}</b></div>`).join(''):'<p>Sem itens vinculados.</p>'}<h2>Observações</h2><div class="obs">${escHtml(a.observacoes||orcamento?.observacoes||'')}</div><div class="assin"><div>Responsável pela execução</div><div>Cliente / responsável local</div></div><div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div></body></html>`);w.document.close();
}
window.executarAgendaComercial=abrirOrdemServicoAgenda;
(function estiloOS(){const st=document.createElement('style');st.textContent='.os-status{display:flex;justify-content:space-between;background:#edf5f0;padding:10px;border-left:4px solid #176b45;border-radius:6px;margin:8px 0 14px}.os-linha{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid #e5e9e7}.os-linha b{color:#40564a}.os-itens{border:1px solid #dde5e0;border-radius:8px;overflow:hidden}.os-itens>div{display:flex;justify-content:space-between;gap:10px;padding:8px;border-bottom:1px solid #e5e9e7}.os-itens>div:last-child{border-bottom:0}.os-itens span{white-space:nowrap}.os-acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}@media(max-width:600px){.os-linha{grid-template-columns:1fr}.os-itens>div{flex-direction:column}.os-itens span{white-space:normal}}';document.head.appendChild(st);})();