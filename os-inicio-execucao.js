(function(){
  function listaAgenda(){try{return typeof agendaComercialCache!=='undefined'?(agendaComercialCache||[]):[]}catch(_){return[]}}
  function agoraLocal(){const d=new Date();return {iso:d.toISOString(),data:d.toLocaleDateString('sv-SE'),hora:d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}}
  async function marcarInicioOS(id){
    const a=listaAgenda().find(x=>Number(x.id)===Number(id));
    if(!a||['Concluído','Cancelado'].includes(String(a.status||'')))return;
    if(String(a.status||'').toLowerCase()==='em andamento')return;
    const t=agoraLocal();
    try{
      const obs=String(a.observacoes||'');
      const marcador=`[INÍCIO DA EXECUÇÃO: ${t.data} ${t.hora}]`;
      const novaObs=obs.includes('[INÍCIO DA EXECUÇÃO:')?obs:[obs,marcador].filter(Boolean).join('\n');
      const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?id=eq.${Number(id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify({status:'Em andamento',observacoes:novaObs})});
      if(!r.ok)throw new Error(await r.text());
      const atualizado=(await r.json())[0];
      if(atualizado)Object.assign(a,atualizado);else{a.status='Em andamento';a.observacoes=novaObs;}
      try{
        const ro=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=id,status,checklist,observacoes&agenda_id=eq.${Number(id)}&order=id.desc&limit=1`,{headers:SUPABASE_HEADERS});
        if(ro.ok){const os=(await ro.json())[0];if(os?.id){const checklist={...(os.checklist&&typeof os.checklist==='object'?os.checklist:{}),execucao_iniciada:true,execucao_iniciada_em:t.iso};const osObs=String(os.observacoes||'');const obs2=osObs.includes('[INÍCIO DA EXECUÇÃO:')?osObs:[osObs,marcador].filter(Boolean).join('\n');await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?id=eq.${Number(os.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=minimal'},body:JSON.stringify({status:'Em andamento',checklist,observacoes:obs2})});}}
      }catch(e){console.warn('OS iniciada na agenda, mas não foi possível atualizar o registro persistido da OS.',e)}
    }catch(e){console.error('Falha ao registrar início da execução.',e);alert('Não foi possível registrar o início da execução. Verifique a conexão e tente novamente.');}
  }
  window.marcarInicioOS=marcarInicioOS;
  document.addEventListener('click',function(ev){
    const b=ev.target.closest('button[onclick]');if(!b)return;
    const txt=String(b.getAttribute('onclick')||'');
    const m=txt.match(/iniciarServicoDaOS\s*\(\s*(\d+)\s*\)/);if(!m)return;
    marcarInicioOS(Number(m[1]));
  },true);
})();
(function(){
  if(document.querySelector('script[data-os-resgate-execucao]'))return;
  const s=document.createElement('script');
  s.src='os-resgate-execucao.js?v=1';
  s.dataset.osResgateExecucao='1';
  document.head.appendChild(s);
})();