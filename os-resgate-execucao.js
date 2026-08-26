(function(){
  function agenda(){try{return typeof agendaComercialCache!=='undefined'?(agendaComercialCache||[]):[]}catch(_){return[]}}
  function escLocal(v){return typeof escHtml==='function'?escHtml(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function carregarOS(agendaId){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&agenda_id=eq.${Number(agendaId)}&order=id.desc&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  async function carregarManutencao(id){
    if(!id)return null;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  function manutIdDaOS(os){const c=os?.checklist;return c&&typeof c==='object'?Number(c.pop_manutencao_id||0):0}
  function incluirNoHistorico(x){
    if(!x)return;
    try{
      if(typeof cloudHistorico!=='undefined'){
        cloudHistorico.manut=cloudHistorico.manut||[];
        const i=cloudHistorico.manut.findIndex(r=>Number(r.id)===Number(x.id));
        if(i>=0)cloudHistorico.manut[i]=x;else cloudHistorico.manut.unshift(x);
      }
    }catch(_){ }
  }
  async function obterExecucao(agendaId){
    const os=await carregarOS(agendaId),mid=manutIdDaOS(os);
    if(!os)return {os:null,manut:null};
    if(!mid)return {os,manut:null};
    const manut=await carregarManutencao(mid);incluirNoHistorico(manut);return {os,manut};
  }
  window.visualizarExecucaoOS=async function(agendaId){
    try{
      const {os,manut}=await obterExecucao(agendaId);
      if(!os)return alert('Ordem de serviço não encontrada.');
      if(!manut)return alert('Esta OS está concluída, mas o vínculo com o registro do POP não foi localizado.');
      const corpo=typeof conteudoManutencao==='function'?conteudoManutencao(manut,false):`<div class="detail-head"><small>EXECUÇÃO CONCLUÍDA</small><h2>${escLocal(manut.codigo||'Equipamento')}</h2></div><p>Registro #${Number(manut.id)}</p>`;
      abrirFicha(`${corpo}<div class="os-resgate-acoes"><button type="button" class="action" onclick="resgatarExecucaoOS(${Number(agendaId)})">Resgatar para alteração</button><button type="button" class="action" onclick="gerarRelatorioTecnicoOS(${Number(agendaId)})">Relatório técnico / PDF</button></div><div class="os-resgate-aviso"><b>Execução preservada</b><span>Use “Resgatar para alteração” somente quando precisar corrigir o registro já concluído. A correção atualiza esta mesma execução e não cria outra.</span></div>`);
    }catch(e){console.error(e);alert('Não foi possível abrir a execução concluída. Verifique a conexão e tente novamente.');}
  };
  window.gerarRelatorioTecnicoOS=async function(agendaId){
    try{
      const {manut}=await obterExecucao(agendaId);
      if(!manut)return alert('Registro do POP não encontrado para esta OS.');
      if(typeof gerarRelatorioTecnicoExecucao==='function')return gerarRelatorioTecnicoExecucao(manut.id);
      if(typeof gerarRelatorioManutencao==='function')return gerarRelatorioManutencao(manut.id);
      alert('Gerador de relatório técnico não está disponível.');
    }catch(e){console.error(e);alert('Não foi possível gerar o relatório técnico.');}
  };
  function selecionarEquipamento(form,equipamentoId){
    const sel=form.querySelector('.equipSelect');if(!sel)return;
    const lista=typeof eqs==='function'?eqs():[];
    const idx=lista.findIndex(e=>Number(e.id)===Number(equipamentoId));
    if(idx>=0){sel.value=String(idx);sel.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function preencherEdicao(manut,ed){
    const tipo=String(manut.tipo||'biodigestor').toLowerCase();
    const form=document.querySelector(`#${tipo} .manutForm`)||document.querySelector('.manutForm[data-tipo="'+tipo+'"]');
    if(!form)return false;
    selecionarEquipamento(form,manut.equipamento_id);
    const data=form.querySelector('[name="data"]');if(data)data.value=manut.data||'';
    const tec=form.querySelector('[name="tecnico"]');if(tec)tec.value=manut.tecnico||'';
    const checks=[...form.querySelectorAll('input[type="checkbox"]')];checks.forEach((x,i)=>x.checked=!!(Array.isArray(manut.checks)&&manut.checks[i]));
    if(manut.campos&&typeof manut.campos==='object')Object.entries(manut.campos).forEach(([k,v])=>{const el=form.querySelector(`[name="${k}"]`);if(el)el.value=v??''});
    const obs=form.querySelector('[name="observacoes"]');if(obs)obs.value=manut.observacoes||'';
    let aviso=form.querySelector('.os-edicao-vinculo');
    if(!aviso){aviso=document.createElement('div');aviso.className='os-edicao-vinculo';form.prepend(aviso)}
    aviso.innerHTML=`<b>ALTERAÇÃO DE EXECUÇÃO CONCLUÍDA</b><span>Registro #${Number(manut.id)} vinculado à OS-${String(ed.agenda_id).padStart(5,'0')}. Ao salvar, esta mesma execução será atualizada — não será criada uma nova.</span>`;
    const btn=form.querySelector('button.primary');if(btn)btn.textContent='Salvar alterações da execução';
    return true;
  }
  window.resgatarExecucaoOS=async function(agendaId){
    if(!confirm('Resgatar esta execução para alteração?\n\nAs informações existentes serão carregadas para correção e o salvamento atualizará o mesmo registro, sem criar uma nova execução.'))return;
    try{
      const {os,manut}=await obterExecucao(agendaId);
      if(!os||!manut)return alert('Não foi possível localizar o registro original da execução.');
      const ed={agenda_id:Number(agendaId),os_id:Number(os.id),manutencao_id:Number(manut.id),equipamento_id:Number(manut.equipamento_id),foto_antes:manut.foto_antes||null,foto_durante:manut.foto_durante||null,foto_depois:manut.foto_depois||null};
      sessionStorage.removeItem('napricelo_os_pop');
      sessionStorage.setItem('napricelo_pop_edicao',JSON.stringify(ed));
      if(typeof fecharFicha==='function')fecharFicha();
      if(typeof iniciarManutencaoEquip==='function')iniciarManutencaoEquip(manut.equipamento_id);else if(typeof showPage==='function')showPage(String(manut.tipo||'biodigestor').toLowerCase());
      let tent=0;const timer=setInterval(()=>{tent++;if(preencherEdicao(manut,ed)||tent>15)clearInterval(timer)},120);
    }catch(e){console.error(e);sessionStorage.removeItem('napricelo_pop_edicao');alert('Não foi possível resgatar a execução para alteração.');}
  };
  async function ajustarBotao(btn){
    if(!btn||btn.dataset.resgateVerificado==='1')return;
    const onclick=String(btn.getAttribute('onclick')||''),m=onclick.match(/iniciarServicoDaOS\s*\(\s*(\d+)\s*\)/);if(!m)return;
    btn.dataset.resgateVerificado='1';const id=Number(m[1]);
    try{
      const a=agenda().find(x=>Number(x.id)===id),os=await carregarOS(id);
      const concluida=String(os?.status||'').toLowerCase().startsWith('conclu')||String(a?.status||'').toLowerCase().startsWith('conclu');
      if(!concluida){btn.dataset.resgateVerificado='0';return;}
      btn.textContent='Visualizar execução / POP';btn.setAttribute('onclick',`visualizarExecucaoOS(${id})`);
      const pai=btn.parentElement;
      if(pai&&!pai.querySelector(`[data-relatorio-tecnico-os="${id}"]`)){
        const rel=document.createElement('button');rel.type='button';rel.className='action';rel.dataset.relatorioTecnicoOs=String(id);rel.textContent='Relatório técnico / PDF';rel.setAttribute('onclick',`gerarRelatorioTecnicoOS(${id})`);pai.insertBefore(rel,btn.nextSibling);
      }
    }catch(e){console.warn('Falha ao ajustar ações da OS concluída.',e);btn.dataset.resgateVerificado='0';}
  }
  function varrer(){document.querySelectorAll('button[onclick*="iniciarServicoDaOS"]').forEach(ajustarBotao)}
  const st=document.createElement('style');st.textContent='.os-resgate-acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.os-resgate-aviso,.os-edicao-vinculo{margin-top:12px;padding:11px 12px;border:1px solid #cfe0d7;border-left:4px solid #176b45;border-radius:8px;background:#f1f7f4;display:flex;flex-direction:column;gap:3px}.os-resgate-aviso b,.os-edicao-vinculo b{color:#176b45;font-size:12px}.os-resgate-aviso span,.os-edicao-vinculo span{font-size:11px;color:#52645b;line-height:1.4}';document.head.appendChild(st);
  new MutationObserver(varrer).observe(document.body,{childList:true,subtree:true});setInterval(varrer,1200);setTimeout(varrer,300);
})();