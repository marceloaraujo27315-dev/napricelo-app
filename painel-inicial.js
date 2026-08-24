(function(){
  let ultimoAtrasados=null;
  function hoje(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
  function dias(data){if(!data)return null;const a=new Date(`${hoje()}T12:00:00`),b=new Date(`${String(data).slice(0,10)}T12:00:00`);return Math.round((b-a)/86400000)}
  function fmt(data){if(!data)return 'Sem data';const [a,m,d]=String(data).slice(0,10).split('-');return `${d}/${m}/${a}`}
  function esc(v){return typeof escHtml==='function'?escHtml(v||''):String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  async function api(path){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:SUPABASE_HEADERS});if(!r.ok)throw new Error(await r.text());return r.json()}
  async function dados(){
    const [ag,eq,os]=await Promise.all([
      api('agendamentos_servicos?select=*&status=not.in.(Concluído,Cancelado)&order=data_agendada.asc,horario.asc'),
      api('equipamentos?select=id,codigo,cliente,unidade,tipo,proxima_manutencao,proxima_analise&order=proxima_manutencao.asc'),
      api('ordens_servico?select=id,agenda_id,numero,status,data_inicio,hora_inicio,equipamento_id,responsavel_execucao&status=eq.Em%20andamento&order=id.desc')
    ]);
    return {ag,eq,os};
  }
  function abrirAgenda(){showPage('agenda-geral');if(typeof carregarAgendaGeral==='function')carregarAgendaGeral()}
  function abrirAlertas(){showPage('painel')}
  function abrirOS(id){if(typeof executarAgendaComercial==='function')executarAgendaComercial(id);else abrirAgenda()}
  window.painelInicioAbrirAgenda=abrirAgenda;
  window.painelInicioAbrirAlertas=abrirAlertas;
  window.painelInicioAbrirOS=abrirOS;

  function card(n,t,cls,onclick){return `<button class="pi-kpi ${cls||''}" onclick="${onclick}"><b>${n}</b><span>${t}</span></button>`}
  function itemAgenda(a){const d=dias(a.data_agendada),prazo=d===0?'Hoje':d<0?`Atrasado ${Math.abs(d)} dia(s)`:d===1?'Amanhã':`Em ${d} dias`;return `<button class="pi-item" onclick="painelInicioAbrirOS(${Number(a.id)})"><div><b>${esc(a.tipo_servico||'Serviço')} • ${esc(a.cliente||'')}</b><span>${esc(a.unidade||'')}${a.responsavel?' • '+esc(a.responsavel):''}</span></div><small>${fmt(a.data_agendada)}${a.horario?' • '+String(a.horario).slice(0,5):''}<br><strong>${prazo}</strong></small></button>`}
  function itemPrev(e,tipo,data){return `<button class="pi-item previsto" onclick="painelInicioAbrirAlertas()"><div><b>${tipo==='manut'?'Manutenção':'Análise'} • ${esc(e.codigo||'')}</b><span>${esc(e.cliente||'')}${e.unidade?' • '+esc(e.unidade):''}</span></div><small>${fmt(data)}</small></button>`}
  function sincronizarAlertaHome(){
    if(!Array.isArray(ultimoAtrasados))return;
    const box=document.getElementById('homeAlertaManut');if(!box)return;
    if(ultimoAtrasados.length){box.style.display='flex';box.className='home-alerta critico';box.onclick=abrirAgenda;box.innerHTML=`<span class="home-alerta-icone">!</span><span><b>${ultimoAtrasados.length} serviço(s) atrasado(s)</b><small>Mesmo critério do contador Atrasados da Agenda Geral.</small></span><strong>Ver agenda</strong>`;}
    else{box.style.display='none';box.innerHTML='';}
  }
  function reforcarSincronizacao(){[0,40,120,300,800].forEach(ms=>setTimeout(sincronizarAlertaHome,ms));}

  async function render(){
    const host=document.getElementById('painelInicioOperacional');if(!host)return;
    host.innerHTML='<div class="pi-loading">Atualizando painel...</div>';
    try{
      const {ag,eq,os}=await dados();
      const hojeAg=ag.filter(x=>dias(x.data_agendada)===0),atras=ag.filter(x=>(dias(x.data_agendada)??999)<0),prox=ag.filter(x=>{const d=dias(x.data_agendada);return d!==null&&d>0&&d<=7}),andamento=ag.filter(x=>String(x.status||'').toLowerCase().includes('execu')||String(x.status||'').toLowerCase().includes('andamento'));
      ultimoAtrasados=atras;
      const previstos=[];eq.forEach(e=>{const dm=dias(e.proxima_manutencao);if(dm!==null&&dm>=0&&dm<=30&&!ag.some(a=>Number(a.equipamento_id)===Number(e.id)&&String(a.tipo_servico||'').toLowerCase().includes('manuten')))previstos.push({e,tipo:'manut',data:e.proxima_manutencao});const da=dias(e.proxima_analise);if(da!==null&&da>=0&&da<=30&&!ag.some(a=>Number(a.equipamento_id)===Number(e.id)&&String(a.tipo_servico||'').toLowerCase().includes('analis')))previstos.push({e,tipo:'analise',data:e.proxima_analise})});
      const lista=[...hojeAg,...prox].sort((a,b)=>String(a.data_agendada).localeCompare(String(b.data_agendada))||String(a.horario||'').localeCompare(String(b.horario||''))).slice(0,4);
      host.innerHTML=`
        <div class="pi-head"><div><h2>Resumo operacional</h2><p>O que precisa de atenção agora.</p></div><button onclick="painelInicialAtualizar()">Atualizar</button></div>
        <div class="pi-kpis">${card(hojeAg.length,'Serviços hoje','hoje',"painelInicioAbrirAgenda()")}${card(atras.length,'Atrasados','atraso',"painelInicioAbrirAgenda()")}${card(andamento.length||os.length,'Em andamento','exec',"painelInicioAbrirAgenda()")}${card(prox.length,'Próximos 7 dias','prox',"painelInicioAbrirAgenda()")}</div>
        <div class="pi-grid2">
          <section class="pi-bloco"><div class="pi-titulo"><h3>Próximos atendimentos</h3><button onclick="painelInicioAbrirAgenda()">Ver agenda</button></div>${lista.length?lista.map(itemAgenda).join(''):'<p class="pi-vazio">Nenhum atendimento para hoje ou próximos 7 dias.</p>'}</section>
          <section class="pi-bloco"><div class="pi-titulo"><h3>Previsões próximas</h3><button onclick="painelInicioAbrirAlertas()">Ver alertas</button></div>${previstos.length?previstos.sort((a,b)=>String(a.data).localeCompare(String(b.data))).slice(0,4).map(x=>itemPrev(x.e,x.tipo,x.data)).join(''):'<p class="pi-vazio">Nenhuma manutenção ou análise prevista nos próximos 30 dias.</p>'}</section>
        </div>
        <div class="pi-atalhos"><button onclick="painelInicioAbrirAgenda()"><b>AG</b><span>Agenda Geral</span></button><button onclick="painelInicioAbrirAlertas()"><b>AL</b><span>Alertas</span></button><button onclick="showPage('clientes')"><b>CL</b><span>Clientes</span></button><button onclick="showPage('cadastro')"><b>＋</b><span>Novo equipamento</span></button></div>`;
      reforcarSincronizacao();
    }catch(e){console.error(e);host.innerHTML='<div class="pi-erro">Não foi possível atualizar o resumo operacional. <button onclick="painelInicialAtualizar()">Tentar novamente</button></div>'}
  }
  window.painelInicialAtualizar=render;
  function instalar(){
    const home=document.getElementById('home');if(!home)return;
    let host=document.getElementById('painelInicioOperacional');if(!host){host=document.createElement('div');host.id='painelInicioOperacional';const hero=home.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',host);else home.prepend(host)}
    render();
  }
  const alertasBase=window.atualizarAlertasGerais;
  if(typeof alertasBase==='function')window.atualizarAlertasGerais=function(){const r=alertasBase.apply(this,arguments);reforcarSincronizacao();return r;};
  const base=window.showPage;window.showPage=function(id){const r=base?base.apply(this,arguments):undefined;if(id==='home')setTimeout(render,80);return r};
  const obs=new MutationObserver(muts=>{if(!Array.isArray(ultimoAtrasados))return;if(muts.some(m=>m.target?.id==='homeAlertaManut'||m.target?.closest?.('#homeAlertaManut')||[...m.addedNodes].some(n=>n?.id==='homeAlertaManut')))setTimeout(sincronizarAlertaHome,0);});
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  const st=document.createElement('style');st.textContent=`#painelInicioOperacional{margin:14px 0 22px}.pi-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.pi-head h2{margin:0;color:#176b45}.pi-head p{margin:3px 0 0;color:#64756c}.pi-head button,.pi-titulo button{border:0;background:#edf6f1;color:#176b45;border-radius:8px;padding:8px 11px;font-weight:700}.pi-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.pi-kpi{border:1px solid #d7e4dd;background:#fff;border-radius:12px;padding:14px;text-align:left}.pi-kpi b{display:block;font-size:25px;color:#176b45}.pi-kpi span{font-size:12px}.pi-kpi.atraso{border-top:4px solid #c43d32}.pi-kpi.hoje{border-top:4px solid #176b45}.pi-kpi.exec{border-top:4px solid #d19000}.pi-kpi.prox{border-top:4px solid #75a98d}.pi-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.pi-bloco{background:#fff;border:1px solid #dce8e1;border-radius:12px;padding:12px}.pi-titulo{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.pi-titulo h3{margin:0;color:#176b45;font-size:16px}.pi-item{width:100%;border:0;border-top:1px solid #e6eee9;background:#fff;padding:10px 2px;display:flex;justify-content:space-between;gap:12px;text-align:left;color:#263b30}.pi-item:first-of-type{border-top:0}.pi-item div{min-width:0}.pi-item b,.pi-item span{display:block}.pi-item span{font-size:11px;color:#67776e;margin-top:2px}.pi-item small{text-align:right;white-space:nowrap;font-size:11px}.pi-item small strong{color:#176b45}.pi-item.previsto{background:#fbfcfb}.pi-atalhos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.pi-atalhos button{border:1px solid #d6e4dc;background:#f8fbf9;border-radius:11px;padding:11px;color:#176b45;font-weight:700}.pi-atalhos b{display:block;font-size:18px}.pi-atalhos span{font-size:11px}.pi-vazio,.pi-loading,.pi-erro{padding:14px;color:#66776e;background:#f7faf8;border-radius:10px}.pi-erro button{margin-left:6px}@media(max-width:700px){.pi-kpis{grid-template-columns:1fr 1fr}.pi-grid2{grid-template-columns:1fr}.pi-atalhos{grid-template-columns:1fr 1fr}.pi-head{align-items:flex-start}.pi-item{align-items:flex-start}}`;document.head.appendChild(st);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);else instalar();
})();