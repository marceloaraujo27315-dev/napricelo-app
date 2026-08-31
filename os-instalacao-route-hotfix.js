(()=>{
  async function agendaServico(id){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  async function agendaInstalacaoPorOrcamento(orcamentoId){
    if(!orcamentoId)return null;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_instalacao?select=*&orcamento_id=eq.${Number(orcamentoId)}&order=id.desc&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  async function rotaInstalacaoSeExistir(id){
    const a=await agendaServico(id);
    if(!a?.orcamento_id)return false;
    const inst=await agendaInstalacaoPorOrcamento(a.orcamento_id);
    if(!inst)return false;
    if(typeof executarAgendamentoInstalacao==='function'){
      if(Array.isArray(window.agendamentosInstalacaoCache)&&!window.agendamentosInstalacaoCache.some(x=>Number(x.id)===Number(inst.id))){
        window.agendamentosInstalacaoCache.push(inst);
      }
      executarAgendamentoInstalacao(Number(inst.id));
      return true;
    }
    if(typeof window.iniciarPOPInstVenda==='function'){
      window.iniciarPOPInstVenda(Number(inst.id));
      return true;
    }
    return false;
  }
  function instalar(){
    if(typeof window.iniciarServicoDaOS!=='function'||window.iniciarServicoDaOS.__instRouteHotfix)return;
    const base=window.iniciarServicoDaOS;
    const f=async function(id){
      try{if(await rotaInstalacaoSeExistir(id))return;}catch(e){console.warn('Rota de instalação não aplicada',e);}
      return base.apply(this,arguments);
    };
    f.__instRouteHotfix=true;
    window.iniciarServicoDaOS=f;
  }
  function ajustarTela(){
    const btn=[...document.querySelectorAll('button')].find(b=>/Iniciar execução \/ POP/i.test(b.textContent||''));
    if(btn&&!btn.dataset.instRouteBound){
      const oc=btn.getAttribute('onclick')||'';
      const m=oc.match(/iniciarServicoDaOS\((\d+)\)/);
      if(m){btn.dataset.instRouteBound='1';btn.textContent='Iniciar POP de instalação';}
    }
  }
  new MutationObserver(()=>{instalar();ajustarTela()}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(()=>{instalar();ajustarTela()},900));
  setTimeout(()=>{instalar();ajustarTela()},1200);
})();