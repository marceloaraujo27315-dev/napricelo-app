(()=>{
  async function agendaServico(id){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  async function agendaInstalacaoPorOrcamento(orcamentoId){
    if(!orcamentoId)return null;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_instalacao?select=*&orcamento_id=eq.${Number(orcamentoId)}&status=neq.Cancelada&order=id.desc&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  async function rotaInstalacaoSeExistir(id){
    const a=await agendaServico(id);
    if(!a?.orcamento_id)return false;
    const inst=await agendaInstalacaoPorOrcamento(a.orcamento_id);
    if(!inst)return false;
    if(Array.isArray(window.agendamentosInstalacaoCache)&&!window.agendamentosInstalacaoCache.some(x=>Number(x.id)===Number(inst.id)))window.agendamentosInstalacaoCache.push(inst);
    if(typeof window.executarAgendamentoInstalacao==='function'){window.executarAgendamentoInstalacao(Number(inst.id));return true;}
    if(typeof window.iniciarPOPInstVenda==='function'){window.iniciarPOPInstVenda(Number(inst.id));return true;}
    return false;
  }
  function instalar(){
    const atual=window.iniciarServicoDaOS;
    if(typeof atual!=='function'||atual.__instRouteHotfix)return;
    const base=atual;
    const f=async function(id){
      try{if(await rotaInstalacaoSeExistir(id))return;}catch(e){console.warn('Rota de instalação não aplicada',e);}
      return base.apply(this,arguments);
    };
    f.__instRouteHotfix=true;
    window.iniciarServicoDaOS=f;
  }
  function ajustarTela(){
    document.querySelectorAll('button[onclick*="iniciarServicoDaOS("]').forEach(btn=>{
      if(btn.dataset.instRouteBound==='1')return;
      if(/Iniciar execução \/ POP/i.test(btn.textContent||''))btn.textContent='Iniciar POP / execução';
      btn.dataset.instRouteBound='1';
    });
  }
  function aplicar(){instalar();ajustarTela();}
  window.addEventListener('load',()=>setTimeout(aplicar,700));
  setTimeout(aplicar,900);
  setTimeout(aplicar,2200);
})();