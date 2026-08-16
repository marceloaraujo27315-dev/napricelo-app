async function osBuscarAgendaDireta(id){
  const local=(window.agendaComercialCache||[]).find(x=>Number(x.id)===Number(id));
  if(local)return local;
  const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0]||null;
}
async function garantirOSPersistida(agendaId,statusDesejado){
  let os=await carregarOSPorAgenda(agendaId);
  const a=await osBuscarAgendaDireta(agendaId);
  if(!a)throw new Error('Agendamento não encontrado para gerar a OS.');
  if(os){
    if(statusDesejado==='Concluída'&&os.status!=='Concluída'){
      const agora=new Date();
      const patch={status:'Concluída',data_fim:agora.toISOString().slice(0,10),hora_fim:agora.toTimeString().slice(0,5)};
      if(a.equipamento_id&&!os.equipamento_id)patch.equipamento_id=a.equipamento_id;
      const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?id=eq.${Number(os.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(patch)});
      if(!r.ok)throw new Error(await r.text());
      os=(await r.json())[0]||os;
    }
    return os;
  }
  const agora=new Date();
  const concluida=statusDesejado==='Concluída'||a.status==='Concluído';
  const payload={
    agenda_id:a.id,orcamento_id:a.orcamento_id||null,cliente_id:a.cliente_id||null,unidade_id:a.unidade_id||null,
    numero:`OS-${String(a.id).padStart(5,'0')}`,status:concluida?'Concluída':'Aberta',
    responsavel_execucao:a.responsavel||null,data_inicio:agora.toISOString().slice(0,10),hora_inicio:agora.toTimeString().slice(0,5),
    observacoes:a.observacoes||null,checklist:{},equipamento_id:a.equipamento_id||null
  };
  if(concluida){payload.data_fim=agora.toISOString().slice(0,10);payload.hora_fim=agora.toTimeString().slice(0,5);}
  const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0]||null;
}
async function reconciliarOSConcluidasSemRegistro(){
  try{
    const [ra,ro]=await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&status=eq.Concluído&order=id.asc`,{headers:SUPABASE_HEADERS}),
      fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=agenda_id`,{headers:SUPABASE_HEADERS})
    ]);
    if(!ra.ok||!ro.ok)return;
    const agendas=await ra.json(),existentes=new Set((await ro.json()).map(x=>Number(x.agenda_id)));
    for(const a of agendas){
      if(!existentes.has(Number(a.id))){
        try{await garantirOSPersistida(a.id,'Concluída');existentes.add(Number(a.id));}catch(e){console.warn('Não foi possível recuperar OS do agendamento',a.id,e);}
      }
    }
  }catch(e){console.warn('Falha na reconciliação automática das OS',e);}
}
(function protegerFluxoOS(){
  const baseExecutar=window.executarAgendaComercial;
  if(typeof baseExecutar==='function')window.executarAgendaComercial=async function(id){
    try{await garantirOSPersistida(id,'Aberta');}catch(e){console.error(e);return alert('Não foi possível criar/salvar a OS antes da execução.');}
    window.__osAgendaAtual=Number(id);
    return baseExecutar(id);
  };
  const baseConcluir=window.concluirAgendaComercial;
  if(typeof baseConcluir==='function')window.concluirAgendaComercial=async function(id){
    try{await garantirOSPersistida(id,'Concluída');}catch(e){console.error(e);return alert('O serviço não será encerrado porque a OS não pôde ser salva. Tente novamente.');}
    return baseConcluir(id);
  };
  const baseHistorico=window.carregarHistoricoOS;
  if(typeof baseHistorico==='function')window.carregarHistoricoOS=async function(){
    await reconciliarOSConcluidasSemRegistro();
    return baseHistorico();
  };
  setTimeout(()=>reconciliarOSConcluidasSemRegistro(),1800);
})();