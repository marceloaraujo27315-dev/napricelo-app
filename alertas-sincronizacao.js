(function(){
  function equipamentosLocais(){try{return typeof eqs==='function'?(eqs()||[]):[];}catch{return [];}}
  function codigoNaObservacao(obs){const m=String(obs||'').match(/Equipamento\s+([^\.]+)\./i);return m?m[1].trim():'';}

  async function corrigirAgendamentosSemEquipamento(){
    const equipamentos=equipamentosLocais();
    if(!equipamentos.length||typeof SUPABASE_URL==='undefined'||typeof SUPABASE_HEADERS==='undefined')return;
    try{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=id,equipamento_id,observacoes,status&equipamento_id=is.null&status=not.in.(Concluído,Cancelado)`,{headers:SUPABASE_HEADERS});
      if(!r.ok)return;
      const lista=await r.json();
      for(const ag of lista){
        const codigo=codigoNaObservacao(ag.observacoes);
        if(!codigo)continue;
        const e=equipamentos.find(x=>String(x.codigo||'').trim().toLowerCase()===codigo.toLowerCase());
        if(!e?.id)continue;
        await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?id=eq.${Number(ag.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=minimal'},body:JSON.stringify({equipamento_id:Number(e.id)})});
      }
    }catch(err){console.warn('Não foi possível sincronizar vínculos antigos da agenda.',err);}
  }
  window.corrigirAgendamentosSemEquipamento=corrigirAgendamentosSemEquipamento;

  const salvarAnterior=window.salvarAgendaDiretaAlerta;
  window.salvarAgendaDiretaAlerta=async function(id,tipo){
    const e=equipamentosLocais().find(x=>Number(x.id)===Number(id));
    if(!e)return salvarAnterior?salvarAnterior(id,tipo):alert('Equipamento não encontrado.');
    const data=document.getElementById('alertaAgData')?.value;
    const horario=document.getElementById('alertaAgHora')?.value||null;
    const responsavel=document.getElementById('alertaAgResp')?.value||null;
    const observacoes=(document.getElementById('alertaAgObs')?.value||'').trim()||null;
    if(!data)return alert('Informe a data do atendimento.');
    const manut=tipo==='manutencao';
    const payload={equipamento_id:Number(e.id),cliente_id:e.cliente_id||null,unidade_id:e.unidade_id||null,cliente:e.cliente||null,unidade:e.unidade||null,tipo_servico:manut?'Manutenção periódica':'Análise periódica',data_agendada:data,horario,responsavel,local_servico:e.localizacao||e.local||null,observacoes:`Equipamento ${e.codigo||''}. ${observacoes||''}`.trim(),status:'Agendado'};
    const btn=document.querySelector('#alertaAgendaModal .salvar');
    try{
      if(btn){btn.disabled=true;btn.textContent='Agendando...';}
      const r=await fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
      const ag=(await r.json())[0];
      let osOk=false;
      try{
        if(ag?.id&&typeof garantirOSPersistida==='function'){await garantirOSPersistida(ag.id,'Aberta');osOk=true;}
        else if(ag?.id&&typeof garantirOSAgenda==='function'){await garantirOSAgenda(ag.id);osOk=true;}
      }catch(err){console.warn('Agendamento criado, mas a OS não foi criada automaticamente.',err);}
      if(typeof fecharModalAgendaAlerta==='function')fecharModalAgendaAlerta();
      if(typeof carregarAgendaComercial==='function')await carregarAgendaComercial();
      if(typeof carregarAgendaGeral==='function')await carregarAgendaGeral();
      if(typeof atualizarAlertasGerais==='function')atualizarAlertasGerais();
      alert(osOk?'Atendimento agendado e OS gerada com sucesso.':'Atendimento agendado. A OS será gerada ao abrir/iniciar o serviço.');
    }catch(err){console.error(err);alert('Não foi possível criar o agendamento.');}
    finally{if(btn){btn.disabled=false;btn.textContent='Agendar e gerar OS';}}
  };

  const carregarAnterior=window.carregarAgendaGeral;
  if(typeof carregarAnterior==='function')window.carregarAgendaGeral=async function(){await corrigirAgendamentosSemEquipamento();return carregarAnterior();};
  setTimeout(corrigirAgendamentosSemEquipamento,1800);
  if(!document.querySelector('script[data-agenda-organizacao]')){const s=document.createElement('script');s.src='agenda-organizacao-v2.js?v=1';s.dataset.agendaOrganizacao='1';document.body.appendChild(s);}
  if(!document.querySelector('script[data-cliente-gestao]')){const s=document.createElement('script');s.src='cliente-gestao-v2.js?v=1';s.dataset.clienteGestao='1';document.body.appendChild(s);}
  if(!document.querySelector('script[data-relatorio-instalacao-2p]')){const s=document.createElement('script');s.src='relatorio-instalacao-2paginas.js?v=1';s.dataset.relatorioInstalacao2p='1';document.body.appendChild(s);}
})();