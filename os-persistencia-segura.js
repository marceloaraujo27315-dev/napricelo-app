async function osBuscarAgendaDireta(id){
  const local=(window.agendaComercialCache||[]).find(x=>Number(x.id)===Number(id));
  if(local)return local;
  const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0]||null;
}
async function osInferirResponsavel(a,os){
  if(a?.responsavel)return a.responsavel;
  const eqId=os?.equipamento_id||a?.equipamento_id;
  const data=os?.data_fim||os?.data_inicio||a?.data_agendada;
  if(eqId){
    let url=`${SUPABASE_URL}/rest/v1/manutencoes?select=tecnico,data&id=not.is.null&equipamento_id=eq.${Number(eqId)}&tecnico=not.is.null&order=id.desc&limit=10`;
    const r=await fetch(url,{headers:SUPABASE_HEADERS});
    if(r.ok){
      const lista=await r.json();
      const mesmoDia=data?lista.find(x=>String(x.data||'').slice(0,10)===String(data).slice(0,10)):null;
      const nome=mesmoDia?.tecnico||lista[0]?.tecnico;
      if(nome)return nome;
    }
  }
  return null;
}
async function osCompletarDadosRecuperados(os,a){
  if(!os)return os;
  const patch={};
  if(!os.responsavel_execucao){const resp=await osInferirResponsavel(a,os);if(resp)patch.responsavel_execucao=resp;}
  if(a?.equipamento_id&&!os.equipamento_id)patch.equipamento_id=a.equipamento_id;
  if(!Object.keys(patch).length)return os;
  const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?id=eq.${Number(os.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(patch)});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0]||{...os,...patch};
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
      const resp=await osInferirResponsavel(a,{...os,...patch});if(resp&&!os.responsavel_execucao)patch.responsavel_execucao=resp;
      const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?id=eq.${Number(os.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(patch)});
      if(!r.ok)throw new Error(await r.text());
      os=(await r.json())[0]||os;
    }
    return osCompletarDadosRecuperados(os,a);
  }
  const agora=new Date();
  const concluida=statusDesejado==='Concluída'||a.status==='Concluído';
  const payload={agenda_id:a.id,orcamento_id:a.orcamento_id||null,cliente_id:a.cliente_id||null,unidade_id:a.unidade_id||null,numero:`OS-${String(a.id).padStart(5,'0')}`,status:concluida?'Concluída':'Aberta',responsavel_execucao:null,data_inicio:agora.toISOString().slice(0,10),hora_inicio:agora.toTimeString().slice(0,5),observacoes:a.observacoes||null,checklist:{},equipamento_id:a.equipamento_id||null};
  payload.responsavel_execucao=await osInferirResponsavel(a,payload);
  if(concluida){payload.data_fim=agora.toISOString().slice(0,10);payload.hora_fim=agora.toTimeString().slice(0,5);}
  const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0]||null;
}
async function reconciliarOSConcluidasSemRegistro(){
  try{
    const [ra,ro]=await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&status=eq.Concluído&order=id.asc`,{headers:SUPABASE_HEADERS}),
      fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&order=id.asc`,{headers:SUPABASE_HEADERS})
    ]);
    if(!ra.ok||!ro.ok)return;
    const agendas=await ra.json(),listaOS=await ro.json(),porAgenda=new Map(listaOS.map(x=>[Number(x.agenda_id),x]));
    for(const a of agendas){
      try{
        let os=porAgenda.get(Number(a.id));
        if(!os){os=await garantirOSPersistida(a.id,'Concluída');porAgenda.set(Number(a.id),os);}
        else if(!os.responsavel_execucao||(!os.equipamento_id&&a.equipamento_id)){await osCompletarDadosRecuperados(os,a);}
      }catch(e){console.warn('Não foi possível reconciliar OS do agendamento',a.id,e);}
    }
  }catch(e){console.warn('Falha na reconciliação automática das OS',e);}
}
(function protegerFluxoOS(){
  const baseExecutar=window.executarAgendaComercial;
  if(typeof baseExecutar==='function')window.executarAgendaComercial=async function(id){try{await garantirOSPersistida(id,'Aberta');}catch(e){console.error(e);return alert('Não foi possível criar/salvar a OS antes da execução.');}window.__osAgendaAtual=Number(id);return baseExecutar(id);};
  const baseConcluir=window.concluirAgendaComercial;
  if(typeof baseConcluir==='function')window.concluirAgendaComercial=async function(id){try{await garantirOSPersistida(id,'Concluída');}catch(e){console.error(e);return alert('O serviço não será encerrado porque a OS não pôde ser salva. Tente novamente.');}return baseConcluir(id);};
  const baseHistorico=window.carregarHistoricoOS;
  if(typeof baseHistorico==='function')window.carregarHistoricoOS=async function(){await reconciliarOSConcluidasSemRegistro();return baseHistorico();};
  setTimeout(()=>reconciliarOSConcluidasSemRegistro(),1800);
})();