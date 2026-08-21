(function(){
  function diasAlerta(v){
    if(!v)return null;
    const hoje=new Date(); hoje.setHours(0,0,0,0);
    const d=new Date(`${String(v).slice(0,10)}T12:00:00`);
    if(Number.isNaN(d.getTime()))return null;
    return Math.ceil((d-hoje)/86400000);
  }
  function escA(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function hojeA(){const d=new Date(),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;}

  window.classificarManutencao=function(eq){
    if(!eq?.periodicidade_meses)return {grupo:'sem-periodo',rotulo:'Sem periodicidade de manutenção',nivel:'sem'};
    if(!eq?.proxima_manutencao)return {grupo:'sem-data',rotulo:'Sem próxima data de manutenção',nivel:'sem'};
    const dias=diasAlerta(eq.proxima_manutencao);
    if(dias<0)return {grupo:'vencida',rotulo:`Vencida há ${Math.abs(dias)} dia(s)`,nivel:'vermelho'};
    if(dias===0)return {grupo:'hoje',rotulo:'Vence hoje',nivel:'vermelho'};
    if(dias<=7)return {grupo:'urgente',rotulo:`Vence em ${dias} dia(s)`,nivel:'laranja'};
    if(dias<=30)return {grupo:'proxima',rotulo:`Vence em ${dias} dia(s)`,nivel:'amarelo'};
    return {grupo:'em-dia',rotulo:`Em dia • vence em ${dias} dia(s)`,nivel:'ok'};
  };

  const passaBase=window.passaFiltroStatus;
  window.passaFiltroStatus=function(grupo){
    if(window.painelFiltroStatus==='proxima')return grupo==='proxima'||grupo==='urgente'||grupo==='hoje';
    return passaBase?passaBase(grupo):true;
  };

  window.abrirAlertaEquipamento=function(id){
    if(typeof showPage==='function')showPage('clientes');
    setTimeout(()=>{
      if(typeof abrirFichaEquipamento==='function')abrirFichaEquipamento(id);
      else alert('Ficha do equipamento indisponível.');
    },80);
  };

  window.abrirAlertaInstalacao=function(){
    if(typeof abrirAgendaInstalacao==='function')abrirAgendaInstalacao();
    else if(typeof showPage==='function')showPage('instalacao');
  };

  function fecharModalAgendaAlerta(){document.getElementById('alertaAgendaModal')?.remove();}
  window.fecharModalAgendaAlerta=fecharModalAgendaAlerta;

  window.agendarDiretoAlerta=function(id,tipoAgenda){
    const e=(typeof eqs==='function'?eqs():[]).find(x=>Number(x.id)===Number(id));
    if(!e)return alert('Equipamento não encontrado. Atualize a página e tente novamente.');
    fecharModalAgendaAlerta();
    const manut=String(tipoAgenda||'').toLowerCase().includes('manut');
    const titulo=manut?'Agendar manutenção':'Agendar análise';
    const dataSugerida=(manut?e.proxima_manutencao:e.proxima_analise)||hojeA();
    const wrap=document.createElement('div');
    wrap.id='alertaAgendaModal';wrap.className='alerta-modal-bg';
    wrap.innerHTML=`<div class="alerta-modal"><button class="alerta-modal-x" type="button" onclick="fecharModalAgendaAlerta()">×</button><h3>${titulo}</h3><div class="alerta-modal-eq"><b>${escA(e.codigo||'Sem código')}</b><span>${escA(e.cliente||'')} ${e.unidade?'• '+escA(e.unidade):''}</span></div><label>Data<input id="alertaAgData" type="date" value="${escA(dataSugerida)}"></label><label>Horário<input id="alertaAgHora" type="time"></label><label>Responsável<select id="alertaAgResp"><option value="">A definir</option><option>Marcelo de Araujo Santos</option><option>Marco Antônio de Araujo Santos</option></select></label><label>Observações<textarea id="alertaAgObs" rows="3">${manut?'Manutenção preventiva programada pelo painel de alertas.':'Análise periódica programada pelo painel de alertas.'}</textarea></label><div class="alerta-modal-acoes"><button type="button" onclick="fecharModalAgendaAlerta()">Cancelar</button><button type="button" class="salvar" onclick="salvarAgendaDiretaAlerta(${Number(e.id)},'${manut?'manutencao':'analise'}')">Agendar e gerar OS</button></div></div>`;
    document.body.appendChild(wrap);
  };

  window.salvarAgendaDiretaAlerta=async function(id,tipo){
    const e=(typeof eqs==='function'?eqs():[]).find(x=>Number(x.id)===Number(id));if(!e)return;
    const data=document.getElementById('alertaAgData')?.value;
    const horario=document.getElementById('alertaAgHora')?.value||null;
    const responsavel=document.getElementById('alertaAgResp')?.value||null;
    const observacoes=(document.getElementById('alertaAgObs')?.value||'').trim()||null;
    if(!data)return alert('Informe a data do atendimento.');
    const manut=tipo==='manutencao';
    const payload={cliente_id:e.cliente_id||null,unidade_id:e.unidade_id||null,cliente:e.cliente||null,unidade:e.unidade||null,tipo_servico:manut?'Manutenção periódica':'Análise periódica',data_agendada:data,horario,responsavel,local_servico:e.localizacao||e.local||null,observacoes:`Equipamento ${e.codigo||''}. ${observacoes||''}`.trim(),status:'Agendado'};
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
      fecharModalAgendaAlerta();
      if(typeof carregarAgendaComercial==='function')await carregarAgendaComercial();
      if(typeof carregarAgendaGeral==='function')await carregarAgendaGeral();
      if(typeof atualizarAlertasGerais==='function')atualizarAlertasGerais();
      alert(osOk?'Atendimento agendado e OS gerada com sucesso.':'Atendimento agendado. A OS será gerada ao abrir/iniciar o serviço.');
    }catch(err){console.error(err);alert('Não foi possível criar o agendamento.');}
    finally{if(btn){btn.disabled=false;btn.textContent='Agendar e gerar OS';}}
  };

  const renderBase=window.renderPainelManutencoes;
  window.renderPainelManutencoes=function(){
    if(typeof garantirFiltrosPainel==='function')garantirFiltrosPainel();
    const box=document.getElementById('painelManutencoesLista');
    if(!box||typeof montarTarefasPainel!=='function')return renderBase&&renderBase();
    const busca=(document.getElementById('painelBusca')?.value||'').trim().toLowerCase();
    const completa=montarTarefasPainel();
    const grupos=[['vencida','🔴 Vencidos'],['hoje','🔴 Vencem hoje'],['urgente','🟠 Vencem em até 7 dias'],['proxima','🟡 Vencem em 8 a 30 dias'],['em-dia','Em dia / futuros'],['sem-periodo','Sem periodicidade'],['sem-data','Sem próxima data']];
    const cont={}; grupos.forEach(([k])=>cont[k]=completa.filter(x=>x._st.grupo===k).length);
    const resumo=document.getElementById('painelResumo');
    if(resumo)resumo.innerHTML=`<div class="resumo-vencida"><b>${(cont.vencida||0)+(cont.hoje||0)}</b><span>Vencidos / hoje</span></div><div class="resumo-urgente"><b>${cont.urgente||0}</b><span>Até 7 dias</span></div><div class="resumo-proxima"><b>${cont.proxima||0}</b><span>8 a 30 dias</span></div><div class="resumo-ok"><b>${cont['em-dia']||0}</b><span>Em dia</span></div>`;
    const lista=completa.filter(e=>{
      const texto=`${e.codigo||''} ${typeof nomeClientePainel==='function'?nomeClientePainel(e):e.cliente||''} ${typeof nomeUnidadePainel==='function'?nomeUnidadePainel(e):e.unidade||''} ${e.tipo||''} ${e.localizacao||''} ${e._tipoAgenda}`.toLowerCase();
      return (!busca||texto.includes(busca))&&(typeof passaFiltroStatus==='function'?passaFiltroStatus(e._st.grupo):true);
    });
    box.innerHTML=grupos.map(([k,titulo])=>{
      const itens=lista.filter(x=>x._st.grupo===k).sort((a,b)=>String(a._dataAgenda||'9999').localeCompare(String(b._dataAgenda||'9999')));
      if(!itens.length)return '';
      return `<section class="agenda-grupo alerta-grupo-${k}"><h3>${titulo} <small>${itens.length}</small></h3>${itens.map(e=>{
        const cliente=typeof nomeClientePainel==='function'?nomeClientePainel(e):(e.cliente||'—');
        const unidade=typeof nomeUnidadePainel==='function'?nomeUnidadePainel(e):(e.unidade||'—');
        const data=e._dataAgenda?(typeof fmtPeriodoData==='function'?fmtPeriodoData(e._dataAgenda):e._dataAgenda):'—';
        if(e._agendaInstalacao)return `<div class="agenda-item alerta-card ${k}"><button class="alerta-principal" onclick="abrirAlertaInstalacao()"><div><b>${e._tipoAgenda} • ${e.codigo||'Instalação'}</b><span>${cliente} • ${unidade}</span></div><div class="agenda-data"><b>${data}</b><span>${e._st.rotulo}</span></div></button><button class="alerta-acao" onclick="abrirAlertaInstalacao()">Abrir instalação</button></div>`;
        const ehManut=String(e._tipoAgenda||'').toLowerCase().includes('manut');
        return `<div class="agenda-item alerta-card ${k}"><button class="alerta-principal" onclick="abrirAlertaEquipamento(${Number(e.id)})"><div><b>${e._tipoAgenda} • ${typeof escEq==='function'?escEq(e.codigo||'Sem código'):(e.codigo||'Sem código')}</b><span>${cliente} • ${unidade}</span><small>${e.tipo||''}${e.localizacao?` • ${e.localizacao}`:''}</small></div><div class="agenda-data"><b>${data}</b><span>${e._st.rotulo}</span></div></button><div class="alerta-acoes"><button class="alerta-acao" onclick="abrirAlertaEquipamento(${Number(e.id)})">Abrir equipamento</button><button class="alerta-acao agenda" onclick="agendarDiretoAlerta(${Number(e.id)},'${ehManut?'manutencao':'analise'}')">Agendar / Gerar OS</button></div></div>`;
      }).join('')}</section>`;
    }).join('')||'<p class="muted">Nenhum item encontrado com esses filtros.</p>';
    if(typeof atualizarAlertasGerais==='function')atualizarAlertasGerais();
  };

  const resumoBase=window.resumoAlertas;
  window.resumoAlertas=function(){
    const r=resumoBase?resumoBase():{lista:[]};
    const lista=r.lista||[];
    r.urgentes=lista.filter(x=>x._st.grupo==='urgente').length;
    r.proximas=lista.filter(x=>x._st.grupo==='proxima').length+r.urgentes;
    return r;
  };

  const css=document.createElement('style');
  css.textContent=`
    .resumo-urgente{border-color:#e67e22!important}.resumo-urgente b{color:#c65f00!important}
    .alerta-grupo-vencida .agenda-item,.alerta-grupo-hoje .agenda-item{border-left:5px solid #c62828!important}
    .alerta-grupo-urgente .agenda-item{border-left:5px solid #ef7d00!important;background:#fff8ef}
    .alerta-grupo-proxima .agenda-item{border-left:5px solid #d6a900!important;background:#fffdf0}
    .alerta-card{display:flex!important;align-items:stretch!important;padding:0!important;overflow:hidden}
    .alerta-principal{flex:1;border:0;background:transparent;display:flex;justify-content:space-between;gap:12px;text-align:left;padding:12px;cursor:pointer;color:inherit}
    .alerta-principal>div:first-child{display:flex;flex-direction:column;gap:3px}
    .alerta-acoes{display:flex;align-items:stretch}.alerta-acao{border:0;border-left:1px solid #dbe5df;background:#edf7f1;color:#176b45;font-weight:700;padding:0 12px;cursor:pointer;white-space:nowrap}.alerta-acao.agenda{background:#176b45;color:#fff}
    .alerta-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}.alerta-modal{position:relative;width:min(520px,100%);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.alerta-modal h3{margin:0 0 12px;color:#176b45}.alerta-modal-x{position:absolute;right:12px;top:10px;border:0;background:#edf6f1;color:#176b45;border-radius:50%;width:34px;height:34px;font-size:22px}.alerta-modal-eq{background:#f1f7f4;padding:10px;border-radius:8px;margin-bottom:10px}.alerta-modal-eq b,.alerta-modal-eq span{display:block}.alerta-modal label{display:block;font-weight:700;margin:9px 0;color:#31483c}.alerta-modal input,.alerta-modal select,.alerta-modal textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid #cbdad2;border-radius:9px;padding:10px;font:inherit}.alerta-modal-acoes{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.alerta-modal-acoes button{border:0;border-radius:9px;padding:10px 14px;font-weight:700}.alerta-modal-acoes .salvar{background:#176b45;color:#fff}
    @media(max-width:700px){.alerta-card{display:block!important}.alerta-principal{width:100%;display:block}.alerta-principal .agenda-data{text-align:left;margin-top:8px}.alerta-acoes{display:grid;grid-template-columns:1fr 1fr}.alerta-acao{border-left:0;border-top:1px solid #dbe5df;padding:10px}.alerta-modal-acoes{flex-direction:column-reverse}.alerta-modal-acoes button{width:100%}}
  `;
  document.head.appendChild(css);

  setTimeout(()=>{if(typeof atualizarAlertasGerais==='function')atualizarAlertasGerais();},1400);
})();