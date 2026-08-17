(function(){
  function diasAlerta(v){
    if(!v)return null;
    const hoje=new Date(); hoje.setHours(0,0,0,0);
    const d=new Date(`${String(v).slice(0,10)}T12:00:00`);
    if(Number.isNaN(d.getTime()))return null;
    return Math.ceil((d-hoje)/86400000);
  }

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
        if(e._agendaInstalacao)return `<button class="agenda-item ${k}" onclick="abrirItemPainel(${JSON.stringify({id:e.id,_agendaInstalacao:true}).replace(/"/g,'&quot;')})"><div><b>${e._tipoAgenda} • ${e.codigo||'Instalação'}</b><span>${cliente} • ${unidade}</span></div><div class="agenda-data"><b>${data}</b><span>${e._st.rotulo}</span></div></button>`;
        return `<div class="agenda-item alerta-card ${k}"><button class="alerta-principal" onclick="abrirAlertaEquipamento(${Number(e.id)})"><div><b>${e._tipoAgenda} • ${typeof escEq==='function'?escEq(e.codigo||'Sem código'):(e.codigo||'Sem código')}</b><span>${cliente} • ${unidade}</span><small>${e.tipo||''}${e.localizacao?` • ${e.localizacao}`:''}</small></div><div class="agenda-data"><b>${data}</b><span>${e._st.rotulo}</span></div></button><button class="alerta-acao" onclick="abrirAlertaEquipamento(${Number(e.id)})">Abrir equipamento</button></div>`;
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
    .alerta-acao{border:0;border-left:1px solid #dbe5df;background:#edf7f1;color:#176b45;font-weight:700;padding:0 14px;cursor:pointer}
    @media(max-width:700px){.alerta-card{display:block!important}.alerta-principal{width:100%;display:block}.alerta-principal .agenda-data{text-align:left;margin-top:8px}.alerta-acao{width:100%;border-left:0;border-top:1px solid #dbe5df;padding:10px}}
  `;
  document.head.appendChild(css);

  setTimeout(()=>{if(typeof atualizarAlertasGerais==='function')atualizarAlertasGerais();},1400);
})();