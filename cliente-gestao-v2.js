(function(){
  let equipamentosGestao=[];
  let filtroClienteGestao='';

  function esc(v){return typeof escHtml==='function'?escHtml(v||''):String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  async function buscarEquipamentosGestao(){
    try{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos?select=id,cliente_id,unidade_id,codigo,tipo,localizacao,proxima_manutencao,proxima_analise&order=codigo.asc`,{headers:SUPABASE_HEADERS});
      if(!r.ok)throw new Error(await r.text());
      equipamentosGestao=await r.json();
    }catch(e){console.warn('Não foi possível carregar resumo de equipamentos dos clientes.',e);equipamentosGestao=[];}
  }
  function equipamentosCliente(id){return equipamentosGestao.filter(e=>Number(e.cliente_id)===Number(id))}
  function unidadesCliente(id){return (window.unidadesCache||unidadesCache||[]).filter(u=>Number(u.cliente_id)===Number(id))}

  window.buscarClienteGestao=function(v){filtroClienteGestao=norm(v);renderGestaoClientes();}
  window.limparBuscaClienteGestao=function(){filtroClienteGestao='';const i=document.getElementById('clienteGestaoBusca');if(i)i.value='';renderGestaoClientes();}
  window.novaUnidadeParaCliente=function(clienteId){
    if(typeof mostrarCadastroUnidade==='function')mostrarCadastroUnidade();
    const sel=document.getElementById('unidadeCliente');if(sel){sel.value=String(clienteId);sel.dispatchEvent(new Event('change',{bubbles:true}));}
    document.getElementById('unidadeForm')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  window.novoEquipamentoParaCliente=function(clienteId,unidadeId){
    if(typeof fecharFichaCliente==='function')fecharFichaCliente();
    if(typeof showPage==='function')showPage('cadastro');
    setTimeout(()=>{
      const c=document.getElementById('equipClienteSelect');if(c){c.value=String(clienteId);c.dispatchEvent(new Event('change',{bubbles:true}));}
      setTimeout(()=>{const u=document.getElementById('equipUnidadeSelect');if(u&&unidadeId){u.value=String(unidadeId);u.dispatchEvent(new Event('change',{bubbles:true}));}},100);
    },150);
  }

  function cabecalhoGestao(){
    const totalClientes=(window.clientesCache||clientesCache||[]).length,totalUnidades=(window.unidadesCache||unidadesCache||[]).length,totalEquip=equipamentosGestao.length;
    return `<div class="cg-painel"><div class="cg-resumo"><div><b>${totalClientes}</b><span>Clientes</span></div><div><b>${totalUnidades}</b><span>Unidades</span></div><div><b>${totalEquip}</b><span>Equipamentos</span></div></div><div class="cg-busca"><input id="clienteGestaoBusca" placeholder="Buscar cliente, município, contato ou documento" value="${esc(filtroClienteGestao)}" oninput="buscarClienteGestao(this.value)"><button type="button" onclick="limparBuscaClienteGestao()">Limpar</button></div></div>`;
  }

  window.renderGestaoClientes=function(){
    const el=document.getElementById('listaClientesUnidades');if(!el)return;
    const clientes=(window.clientesCache||clientesCache||[]).filter(c=>{
      if(!filtroClienteGestao)return true;
      return norm(`${c.nome} ${c.documento||''} ${c.municipio||''} ${c.responsavel||''} ${c.telefone||''}`).includes(filtroClienteGestao);
    });
    const html=clientes.map(c=>{
      const us=unidadesCliente(c.id),eq=equipamentosCliente(c.id);
      return `<article class="cg-cliente"><div class="cg-cliente-top"><div class="cg-ident"><small>CLIENTE / EMPREENDIMENTO</small><h3>${esc(c.nome)}</h3><span>${esc(c.documento||'Sem documento')}${c.municipio?' • '+esc(c.municipio):''}</span>${c.responsavel?`<span>Contato: ${esc(c.responsavel)}${c.telefone?' • '+esc(c.telefone):''}</span>`:''}</div><div class="cg-contadores"><div><b>${us.length}</b><span>unidades</span></div><div><b>${eq.length}</b><span>equipamentos</span></div></div></div><div class="cg-acoes"><button onclick="abrirFichaCliente(${Number(c.id)})">Abrir prontuário</button><button onclick="novaUnidadeParaCliente(${Number(c.id)})">+ Unidade</button><button onclick="novoEquipamentoParaCliente(${Number(c.id)},null)">+ Equipamento</button><button onclick="editarCliente(${Number(c.id)})">Editar</button></div>${us.length?`<div class="cg-unidades">${us.map(u=>{const eu=eq.filter(e=>Number(e.unidade_id)===Number(u.id));return `<div class="cg-unidade"><div><b>${esc(u.nome)}</b><span>${esc(u.municipio||'')}${u.endereco?' • '+esc(u.endereco):''}</span>${u.responsavel?`<small>Responsável local: ${esc(u.responsavel)}</small>`:''}</div><div class="cg-unidade-meta"><span>${eu.length} equipamento(s)</span><button onclick="abrirFichaCliente(${Number(c.id)},${Number(u.id)})">Ver unidade</button><button onclick="novoEquipamentoParaCliente(${Number(c.id)},${Number(u.id)})">+ Equip.</button></div></div>`}).join('')}</div>`:'<p class="cg-vazio">Nenhuma unidade cadastrada.</p>'}</article>`;
    }).join('');
    el.innerHTML=cabecalhoGestao()+(html||'<div class="cg-vazio-box">Nenhum cliente encontrado com essa busca.</div>');
  }

  async function atualizarGestao(){await buscarEquipamentosGestao();renderGestaoClientes();}
  const carregarBase=window.carregarClientesUnidades;
  if(typeof carregarBase==='function')window.carregarClientesUnidades=async function(){await carregarBase.apply(this,arguments);await atualizarGestao();};
  const renderBase=window.renderClientesUnidades;
  if(typeof renderBase==='function')window.renderClientesUnidades=function(){renderBase.apply(this,arguments);setTimeout(renderGestaoClientes,0);};

  const fichaBase=window.renderFichaCliente;
  if(typeof fichaBase==='function')window.renderFichaCliente=function(c,equip,manut,analises,unidadeInicial){
    fichaBase.apply(this,arguments);
    const content=document.getElementById('clientProfileContent');if(!content)return;
    const head=content.querySelector('.detail-head');if(head&&!head.querySelector('.cg-ficha-acoes')){
      const a=document.createElement('div');a.className='cg-ficha-acoes';a.innerHTML=`<button onclick="novaUnidadeParaCliente(${Number(c.id)})">+ Nova unidade</button><button onclick="novoEquipamentoParaCliente(${Number(c.id)},${unidadeInicial?Number(unidadeInicial):'null'})">+ Novo equipamento</button>`;head.appendChild(a);
    }
  };

  const st=document.createElement('style');st.textContent=`.cg-painel{margin:14px 0}.cg-resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}.cg-resumo div{background:#eef6f2;border:1px solid #d7e5de;border-radius:10px;padding:10px;text-align:center}.cg-resumo b{display:block;color:#176b45;font-size:22px}.cg-resumo span{font-size:11px}.cg-busca{display:grid;grid-template-columns:1fr auto;gap:8px}.cg-busca input,.cg-busca button{min-height:42px;border:1px solid #cfddd5;border-radius:9px;padding:8px 10px;background:#fff}.cg-busca button{color:#176b45;font-weight:700}.cg-cliente{background:#fff;border:1px solid #dce7e1;border-left:5px solid #176b45;border-radius:12px;padding:14px;margin:10px 0}.cg-cliente-top{display:flex;justify-content:space-between;gap:14px}.cg-ident small{font-size:9px;color:#728178;font-weight:800}.cg-ident h3{margin:2px 0 4px;color:#176b45}.cg-ident span{display:block;font-size:12px;color:#56685e}.cg-contadores{display:flex;gap:8px}.cg-contadores div{min-width:72px;background:#f4f8f6;border-radius:9px;text-align:center;padding:8px}.cg-contadores b{display:block;color:#176b45;font-size:18px}.cg-contadores span{font-size:10px}.cg-acoes{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.cg-acoes button,.cg-unidade-meta button,.cg-ficha-acoes button{border:0;border-radius:8px;background:#edf6f1;color:#176b45;font-weight:700;padding:8px 10px}.cg-acoes button:first-child{background:#176b45;color:#fff}.cg-unidades{margin-top:12px;border-top:1px solid #e2ebe6;padding-top:8px}.cg-unidade{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #eef2f0}.cg-unidade b,.cg-unidade span,.cg-unidade small{display:block}.cg-unidade span,.cg-unidade small{font-size:11px;color:#67776e}.cg-unidade-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.cg-unidade-meta>span{font-size:10px;background:#edf6f1;padding:4px 7px;border-radius:999px;color:#176b45}.cg-vazio{font-size:11px;color:#78867e}.cg-vazio-box{padding:18px;background:#f6f9f7;border-radius:10px;color:#66776e}.cg-ficha-acoes{display:flex;gap:8px;margin-top:10px}@media(max-width:700px){.cg-cliente-top{display:block}.cg-contadores{margin-top:10px}.cg-unidade{display:block}.cg-unidade-meta{justify-content:flex-start;margin-top:7px}.cg-acoes{display:grid;grid-template-columns:1fr 1fr}.cg-acoes button{width:100%}.cg-ficha-acoes{display:grid;grid-template-columns:1fr 1fr}}`;document.head.appendChild(st);
  setTimeout(()=>{if(document.getElementById('clientes')?.classList.contains('active'))atualizarGestao();},1000);
})();