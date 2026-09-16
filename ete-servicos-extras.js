// Napricelo Campo - melhorias da ETE e servicos gerais da Prodoeste
(function(){
  'use strict';
  const CLIENTE='Prodoeste Veículos e Serviços Ltda.';
  const CODIGO_ETE='ETE-PRODOESTE';
  const TIPOS={melhoria:'ete_melhoria',geral:'prodoeste_servico'};
  const estado={modo:null,registros:[]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const hoje=()=>new Date().toISOString().slice(0,10);
  const dataBR=v=>{if(!v)return'—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v)};
  function headers(){if(typeof photoAuthHeaders==='function')return photoAuthHeaders({'Content-Type':'application/json',Prefer:'return=representation'});return {...SUPABASE_HEADERS,Prefer:'return=representation'};}

  function css(){if(document.getElementById('eteServExtrasCss'))return;const s=document.createElement('style');s.id='eteServExtrasCss';s.textContent=`
    .ete-extra-tabs{display:flex;gap:7px;overflow-x:auto;padding:0 0 5px}.ete-extra-tabs button{white-space:nowrap;border:1px solid #bcd7c9;background:#fff;color:#176b45;border-radius:22px;padding:10px 13px;font-weight:800}.ete-extra-tabs button.active{background:#176b45;color:#fff}.ete-extra-card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 10px #0001}.ete-extra-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ete-extra-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ete-extra-record{border:1px solid #dbe5df;border-radius:12px;padding:13px;margin:10px 0;background:#fff}.ete-extra-record h3{margin:0 0 4px;color:#176b45}.ete-extra-record small{display:block;color:#65736c}.ete-extra-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.ete-extra-actions button{border:0;border-radius:8px;padding:9px 11px;font-weight:800;background:#e5f2eb;color:#176b45}.ete-extra-status{display:inline-block;margin-top:6px;padding:4px 8px;border-radius:14px;background:#edf6f1;color:#176b45;font-size:11px;font-weight:800}.ete-extra-note{background:#f7faf8;border:1px solid #e0e9e4;border-radius:10px;padding:11px;margin:8px 0;white-space:pre-wrap}.ete-extra-photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ete-extra-photo-grid img{width:100%;height:150px;object-fit:cover;border-radius:8px;border:1px solid #dbe5df}.ete-extra-photo-grid figure{margin:0}.ete-extra-photo-grid figcaption{font-size:11px;color:#65736c;margin-top:3px}
    @media(max-width:620px){.ete-extra-grid,.ete-extra-photos,.ete-extra-photo-grid{grid-template-columns:1fr}.ete-extra-photo-grid img{height:auto;max-height:280px}}
  `;document.head.appendChild(s);}

  function painel(){return document.getElementById('eteProdoestePainel');}
  function tabs(){return document.querySelector('#eteProdoesteConteudo .ete-tabs');}
  function instalarAbas(){
    const t=tabs();if(!t)return false;
    if(!t.querySelector('[data-extra="melhoria"]')){
      const b=document.createElement('button');b.type='button';b.dataset.extra='melhoria';b.textContent='Melhorias ETE';b.onclick=()=>abrir('melhoria');t.appendChild(b);
    }
    if(!t.querySelector('[data-extra="geral"]')){
      const b=document.createElement('button');b.type='button';b.dataset.extra='geral';b.textContent='Serviços Prodoeste';b.onclick=()=>abrir('geral');t.appendChild(b);
    }
    return true;
  }
  function marcarAtiva(){document.querySelectorAll('#eteProdoesteConteudo .ete-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.extra===estado.modo));}
  function abrir(modo){estado.modo=modo;marcarAtiva();renderFormulario();}

  function formHtml(modo){
    const melhoria=modo==='melhoria';
    return `<section class="ete-extra-card"><h3>${melhoria?'Registrar melhoria / serviço adicional da ETE':'Registrar serviço na área da Prodoeste'}</h3>
      <p>${melhoria?'Use para acréscimos, correções e melhorias que não fazem parte do checklist diário/semanal/mensal da ETE.':'Use para serviços executados na Prodoeste que não estão diretamente ligados à operação da ETE.'}</p>
      <form id="eteExtraForm" data-modo="${modo}">
        <div class="ete-extra-grid"><label>Data<input type="date" name="data" value="${hoje()}" required></label><label>Responsável pelo registro<input name="tecnico" required></label></div>
        <label>Nome do serviço / melhoria<input name="titulo" placeholder="Ex.: Melhoria no sumidouro" required></label>
        <div class="ete-extra-grid"><label>Local / setor<input name="localizacao" placeholder="Ex.: Sumidouro, lavador, pátio, oficina"></label><label>Categoria<select name="categoria"><option>Melhoria</option><option>Correção</option><option>Manutenção</option><option>Instalação</option><option>Acréscimo de componente</option><option>Adequação</option><option>Outro</option></select></label></div>
        <label>Problema / necessidade identificada<textarea name="necessidade" placeholder="Descreva o que estava deficiente, o motivo da alteração ou o que precisava ser melhorado"></textarea></label>
        <label>Serviço executado<textarea name="servico" required placeholder="Descreva o que foi feito"></textarea></label>
        <label>Materiais / componentes acrescentados<textarea name="materiais" placeholder="Ex.: tubulação, conexões, brita, tampa, bomba, válvula..."></textarea></label>
        <label>Resultado obtido / condição final<textarea name="resultado" placeholder="Como ficou após o serviço e qual melhoria foi obtida"></textarea></label>
        <div class="ete-extra-grid"><label>Status<select name="status"><option>Concluído</option><option>Em andamento</option><option>Pendente complemento</option><option>Aguardando material</option><option>Aguardando cliente</option></select></label><label>OS / referência<input name="os_registro" placeholder="Opcional"></label></div>
        <label>Recomendação / próxima ação<textarea name="recomendacao"></textarea></label>
        <h3>Registro fotográfico</h3><div class="ete-extra-photos"><div class="photo">Antes<input type="file" name="foto_antes" accept="image/*" capture="environment"></div><div class="photo">Durante<input type="file" name="foto_durante" accept="image/*" capture="environment"></div><div class="photo">Depois<input type="file" name="foto_depois" accept="image/*" capture="environment"></div></div>
        <button class="primary" type="submit">Salvar registro do serviço</button>
      </form>
      <hr><h3>${melhoria?'Histórico de melhorias da ETE':'Pasta de serviços da Prodoeste'}</h3><div id="eteExtraHistorico"><p>Carregando...</p></div>
    </section>`;
  }

  function renderFormulario(){const p=painel();if(!p)return;p.innerHTML=formHtml(estado.modo);document.getElementById('eteExtraForm')?.addEventListener('submit',salvar);carregar();}

  async function upload(file,etapa,titulo){if(!file)return null;if(typeof uploadFotoManutencao!=='function')throw new Error('Módulo de fotos indisponível.');return uploadFotoManutencao(file,CODIGO_ETE,`servico-${estado.modo}-${etapa}-${(titulo||'registro').replace(/\s+/g,'-').slice(0,30)}`);}

  async function salvar(ev){
    ev.preventDefault();const f=ev.currentTarget;if(!f.reportValidity())return;const fd=new FormData(f),modo=f.dataset.modo,titulo=(fd.get('titulo')||'').trim();const btn=f.querySelector('button[type="submit"]');const txt=btn.textContent;btn.disabled=true;btn.textContent='Salvando serviço e fotos...';
    try{
      const fa=await upload(f.elements.foto_antes?.files?.[0],'antes',titulo),fdur=await upload(f.elements.foto_durante?.files?.[0],'durante',titulo),fdep=await upload(f.elements.foto_depois?.files?.[0],'depois',titulo);
      const campos={formato:'prodoeste-servico-v1',grupo:modo,titulo,categoria:fd.get('categoria')||'',necessidade:fd.get('necessidade')||'',servico_executado:fd.get('servico')||'',materiais:fd.get('materiais')||'',resultado:fd.get('resultado')||'',status:fd.get('status')||'',os_registro:fd.get('os_registro')||'',recomendacao:fd.get('recomendacao')||''};
      const payload={equipamento_id:null,tipo:TIPOS[modo],codigo:modo==='melhoria'?CODIGO_ETE:'PRODOESTE-SERVICO',cliente:CLIENTE,unidade:modo==='melhoria'?'ETE RA':'Área Prodoeste',municipio:'Araxá - MG',localizacao:fd.get('localizacao')|| (modo==='melhoria'?'ETE Prodoeste':'Prodoeste'),data:fd.get('data'),tecnico:fd.get('tecnico')||null,checks:[],campos,observacoes:fd.get('recomendacao')||null,foto_antes:fa,foto_durante:fdur,foto_depois:fdep};
      const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());
      alert('Serviço registrado com sucesso na pasta da Prodoeste.');f.reset();f.elements.data.value=hoje();await carregar();
    }catch(e){console.error(e);alert('Não foi possível salvar o registro. '+(e?.message||''));}
    finally{btn.disabled=false;btn.textContent=txt;}
  }

  async function carregar(){
    const box=document.getElementById('eteExtraHistorico');if(!box)return;box.innerHTML='<p>Carregando...</p>';
    try{const tipo=TIPOS[estado.modo];const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&tipo=eq.${encodeURIComponent(tipo)}&order=created_at.desc`,{headers:headers()});if(!r.ok)throw new Error(await r.text());estado.registros=await r.json();renderHistorico(box);}catch(e){console.error(e);box.innerHTML='<p>Não foi possível carregar o histórico.</p>';}
  }
  function renderHistorico(box){
    if(!estado.registros.length){box.innerHTML='<p class="muted">Nenhum serviço registrado nesta pasta ainda.</p>';return;}
    box.innerHTML=estado.registros.map((x,i)=>`<article class="ete-extra-record"><h3>${esc(x.campos?.titulo||'Serviço registrado')}</h3><small>${dataBR(x.data||x.created_at)} • ${esc(x.localizacao||'Local não informado')} • ${esc(x.tecnico||'Responsável não informado')}</small><span class="ete-extra-status">${esc(x.campos?.status||'Sem status')}</span><div class="ete-extra-actions"><button type="button" data-extra-ver="${i}">Ver registro completo</button></div></article>`).join('');
    box.querySelectorAll('[data-extra-ver]').forEach(b=>b.onclick=()=>ver(estado.registros[Number(b.dataset.extraVer)]));
  }
  function ver(x){
    const c=x.campos||{},fotos=[['Antes',x.foto_antes],['Durante',x.foto_durante],['Depois',x.foto_depois]].filter(a=>a[1]);
    const html=`<div class="detail-head"><small>${estado.modo==='melhoria'?'MELHORIA / SERVIÇO ADICIONAL DA ETE':'SERVIÇO PRODOESTE'}</small><h2>${esc(c.titulo||'Registro de serviço')}</h2><p>${dataBR(x.data||x.created_at)} • ${esc(c.status||'')}</p></div><h3>Identificação</h3>${linha('Local',x.localizacao)}${linha('Responsável',x.tecnico)}${linha('Categoria',c.categoria)}${linha('OS / referência',c.os_registro)}<h3>Problema / necessidade</h3><div class="ete-extra-note">${esc(c.necessidade||'Não informado')}</div><h3>Serviço executado</h3><div class="ete-extra-note">${esc(c.servico_executado||'Não informado')}</div><h3>Materiais / acréscimos</h3><div class="ete-extra-note">${esc(c.materiais||'Não informado')}</div><h3>Resultado</h3><div class="ete-extra-note">${esc(c.resultado||'Não informado')}</div><h3>Recomendação / próxima ação</h3><div class="ete-extra-note">${esc(c.recomendacao||'Sem recomendação adicional')}</div><h3>Fotos</h3>${fotos.length?`<div class="ete-extra-photo-grid">${fotos.map(([n,u])=>`<figure><img src="${esc(u)}" alt="${n}"><figcaption>${n}</figcaption></figure>`).join('')}</div>`:'<p>Sem fotos registradas.</p>'}`;
    if(typeof abrirFicha==='function')abrirFicha(html);else{const w=window.open('','_blank');if(w){w.document.write(`<html><body>${html}</body></html>`);w.document.close();}}
  }
  function linha(nome,valor){return `<div class="detail-row"><b>${esc(nome)}</b><span>${esc(valor||'—')}</span></div>`;}

  function observar(){css();const obs=new MutationObserver(()=>instalarAbas());obs.observe(document.documentElement,{childList:true,subtree:true});instalarAbas();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar);else observar();
})();
