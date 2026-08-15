(function(){
  function prepararFinalizacaoOS(){
    const f=document.getElementById('osExecForm');
    if(!f||f.dataset.finalizacaoPronta==='1')return;
    f.dataset.finalizacaoPronta='1';
    const acoes=f.querySelector('.os-acoes');
    if(!acoes)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='primary os-concluir-btn';
    btn.textContent='Concluir e salvar serviço';
    btn.onclick=async()=>{
      const resp=f.querySelector('[name="responsavel_execucao"]');
      if(resp&&!resp.value)return alert('Selecione o responsável pela execução antes de concluir.');
      const checks=[...f.querySelectorAll('[data-check]')];
      const faltam=checks.filter(x=>!x.checked);
      if(faltam.length&&!confirm(`Ainda existem ${faltam.length} item(ns) do checklist não marcado(s). Deseja concluir mesmo assim?`))return;
      const cliente=f.querySelector('[name="assinatura_cliente"]');
      if(cliente&&!cliente.value&&!confirm('O aceite/nome do cliente está em branco. Deseja concluir mesmo assim?'))return;
      const status=f.querySelector('[name="status"]');
      if(status)status.value='Concluída';
      const m=(String(location.hash||'').match(/os-(\d+)/i)||[])[1];
      const agendaId=Number(f.closest('[data-agenda-id]')?.dataset.agendaId||m||window.__osAgendaAtual||0);
      if(agendaId&&typeof salvarOrdemServicoAvancada==='function')return salvarOrdemServicoAvancada(agendaId);
      const salvar=[...acoes.querySelectorAll('button')].find(x=>/Salvar OS/i.test(x.textContent));
      if(salvar)salvar.click();
    };
    acoes.prepend(btn);
    const aviso=document.createElement('div');
    aviso.className='os-finalizacao-aviso';
    aviso.innerHTML='<b>Finalização do atendimento</b><span>Ao concluir, a data e a hora de término são registradas automaticamente e o agendamento é marcado como concluído.</span>';
    acoes.parentNode.insertBefore(aviso,acoes);
  }
  const obs=new MutationObserver(prepararFinalizacaoOS);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(prepararFinalizacaoOS,80));
  const st=document.createElement('style');
  st.textContent='.os-finalizacao-aviso{margin:14px 0 8px;padding:10px 12px;background:#edf5f0;border-left:4px solid #176b45;border-radius:6px;display:flex;flex-direction:column;gap:3px;font-size:13px}.os-concluir-btn{background:#176b45!important;color:#fff!important;font-weight:700}';
  document.head.appendChild(st);
})();