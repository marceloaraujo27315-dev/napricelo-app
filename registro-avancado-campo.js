(()=>{
  const BUCKET='manutencoes-fotos';
  const baseFetch=window.fetch.bind(window);

  function sessao(){try{return JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')}catch(_){return null}}
  function authHeaders(extra={}){const jwt=sessao()?.access_token;if(!jwt)throw new Error('Faça login novamente para salvar as fotos.');return {apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,...extra}}
  function ext(file){const n=(file?.name||'').split('.').pop()?.toLowerCase();if(['jpg','jpeg','png','webp'].includes(n))return n==='jpeg'?'jpg':n;if(file?.type==='image/png')return'png';if(file?.type==='image/webp')return'webp';return'jpg'}
  async function upload(file,pasta,etapa){
    if(!file||!file.size)return null;
    if(file.size>10*1024*1024)throw new Error('Cada foto deve ter no máximo 10 MB.');
    const safe=String(pasta||'registro').replace(/[^a-zA-Z0-9_-]/g,'-');
    const path=`${safe}/${Date.now()}-${crypto.randomUUID()}-${etapa}.${ext(file)}`;
    const r=await baseFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:authHeaders({'Content-Type':file.type||'image/jpeg','x-upsert':'false'}),body:file});
    if(!r.ok)throw new Error(await r.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  async function uploadVarios(files,pasta,etapa){const out=[];for(const f of [...(files||[])]){const u=await upload(f,pasta,etapa);if(u)out.push(u)}return out}
  function urls(v){if(Array.isArray(v))return v.filter(Boolean);if(typeof v==='string'&&v)return[v];return[]}
  function uniq(a){return [...new Set(a.filter(Boolean))]}
  function hojeCompacto(v){const d=String(v||new Date().toISOString().slice(0,10)).slice(0,10).replace(/-/g,'');return d||new Date().toISOString().slice(0,10).replace(/-/g,'')}
  function slug(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,28)}
  function codigo(prefix,data,complemento,fallback){return `${prefix}-${hojeCompacto(data)}-${slug(complemento||fallback||Date.now().toString().slice(-4))}`}

  function etapaInput(inp,i,tipo){if(inp.dataset.etapa)return inp.dataset.etapa;if(tipo==='manut')return ['antes','durante','depois'][i]||'evidencia';return ['antes','durante','depois'][i]||'evidencia'}
  function prepararFotosExistentes(){
    document.querySelectorAll('.manutForm').forEach(form=>{
      const ins=[...form.querySelectorAll('input[type="file"]')];
      ins.forEach((inp,i)=>{inp.multiple=true;inp.dataset.multiFotos='1';inp.dataset.etapa=etapaInput(inp,i,'manut');});
      const photos=[...form.querySelectorAll('.photo')];
      if(photos[0]&&!photos[0].dataset.multiLabel){photos[0].dataset.multiLabel='1';photos[0].insertAdjacentHTML('beforeend','<small style="display:block;color:#64736c">Pode registrar várias fotos: acesso/área externa, tampa aberta, interior e condição encontrada.</small>')}
      if(photos[1]&&!photos[1].dataset.multiLabel){photos[1].dataset.multiLabel='1';photos[1].insertAdjacentHTML('beforeend','<small style="display:block;color:#64736c">Durante é opcional na manutenção. Use quando houver algo importante a documentar.</small>')}
      if(photos[2]&&!photos[2].dataset.multiLabel){photos[2].dataset.multiLabel='1';photos[2].insertAdjacentHTML('beforeend','<small style="display:block;color:#64736c">Pode registrar várias fotos da condição final do equipamento e da área.</small>')}
      inserirCodigoAtendimento(form,'MAN','manut');
    });
    const inst=document.getElementById('instalacaoForm');if(inst){[...inst.querySelectorAll('input[type="file"]')].forEach((inp,i)=>{inp.multiple=true;inp.dataset.multiFotos='1';inp.dataset.etapa=['antes','durante','depois'][i]||'evidencia'});inserirCodigoAtendimento(inst,'INS','inst')}
    const ana=document.getElementById('analiseForm');if(ana){[...ana.querySelectorAll('input[type="file"]')].forEach(inp=>{inp.multiple=true;inp.dataset.multiFotos='1';inp.dataset.etapa='analise'});inserirCodigoAtendimento(ana,'ANA','ana')}
  }

  function inserirCodigoAtendimento(form,prefix,tipo){
    if(form.dataset.codigoAtendimentoPreparado==='1')return;form.dataset.codigoAtendimentoPreparado='1';
    const alvo=form.querySelector('input[name="data"],input[name="data_agendada"]');if(!alvo)return;
    const box=document.createElement('label');box.className='codigo-atendimento-box';box.innerHTML=`Identificação do atendimento / relatório<div class="codigo-linha"><span data-prefixo>${prefix}-${hojeCompacto(alvo.value)}-</span><input data-codigo-complemento placeholder="Ex.: NICOLAS, CASA-7, SEDE"></div><small>Use o mesmo complemento nos equipamentos atendidos juntos para gerar um único relatório consolidado.</small>`;
    const label=alvo.closest('label');(label?.parentElement?.classList.contains('two')?label.parentElement:label)?.insertAdjacentElement('afterend',box);
    const atualiza=()=>{box.querySelector('[data-prefixo]').textContent=`${prefix}-${hojeCompacto(alvo.value)}-`};alvo.addEventListener('change',atualiza);atualiza();
    box.dataset.tipoRegistro=tipo;
  }
  function codDoForm(form,prefix,fallback){const comp=form?.querySelector('[data-codigo-complemento]')?.value||'';const data=form?.querySelector('input[name="data"],input[name="data_agendada"]')?.value;return codigo(prefix,data,comp,fallback)}

  function prepararEquipamento(){
    const f=document.getElementById('equipForm');if(!f||f.dataset.avancado==='1')return;f.dataset.avancado='1';
    const cod=f.querySelector('[name="codigo"]'),tipo=f.querySelector('[name="tipo"]');
    const pref=()=>{const t=String(tipo?.value||'').toLowerCase();if(t.includes('ecobio'))return'EC-';if(t.includes('gordura'))return'CG-';if(t.includes('óleo')||t==='sao')return'SAO-';if(t.includes('areia'))return'CA-';return'BD-'};
    const aplicar=()=>{if(!cod)return;const p=pref();if(!cod.value||/^(BD|EC|CG|SAO|CA)-?$/.test(cod.value))cod.value=p;cod.placeholder=`${p}CASA-7`};tipo?.addEventListener('change',aplicar);aplicar();
    const sec=document.createElement('div');sec.className='registro-fotos-extra';sec.innerHTML='<h3>Registro fotográfico do equipamento</h3><p class="muted">Adicione quantas fotos forem necessárias: área externa, acesso, tampa, interior, tubulações e identificação.</p><div class="photo">Fotos do equipamento / condição encontrada<input type="file" accept="image/*" capture="environment" multiple data-extra-fotos="equipamento"></div>';
    f.querySelector('button.primary')?.insertAdjacentElement('beforebegin',sec);
  }
  function prepararOrcamento(){
    const f=document.getElementById('orcamentoForm');if(!f||f.dataset.avancado==='1')return;f.dataset.avancado='1';
    const sec=document.createElement('div');sec.className='registro-fotos-extra';sec.innerHTML='<h3>Registro fotográfico da vistoria / levantamento</h3><p class="muted">Registre todas as evidências necessárias para elaborar o orçamento: acesso, área, equipamento aberto, interior, tubulações e não conformidades.</p><div class="photo">Fotos do levantamento<input type="file" accept="image/*" capture="environment" multiple data-extra-fotos="orcamento"></div><label>Identificação do levantamento<div class="codigo-linha"><span>LEV-</span><input data-levantamento-complemento placeholder="Ex.: NICOLAS, FAZENDA-X"></div></label>';
    f.querySelector('button.primary')?.insertAdjacentElement('beforebegin',sec);
  }

  // Mantém compatibilidade com o fluxo antigo da manutenção e acrescenta todas as fotos nas novas colunas.
  const salvarManBase=window.salvarManutencaoComFotos;
  if(typeof salvarManBase==='function')window.salvarManutencaoComFotos=async function(o,eq,fotos){
    const salvo=await salvarManBase.apply(this,arguments);const form=document.querySelector('.manutForm:has(button.primary:disabled)')||[...document.querySelectorAll('.manutForm')].find(f=>f.contains(document.activeElement))||document.querySelector('.manutForm');
    try{
      const ins=[...(form?.querySelectorAll('input[type="file"]')||[])],ad={};
      for(let i=0;i<ins.length;i++){const etapa=etapaInput(ins[i],i,'manut'),mais=[...ins[i].files].slice(1);ad[etapa]=mais.length?await uploadVarios(mais,eq?.codigo||`MAN-${salvo.id}`,etapa):[]}
      const ant=uniq([...urls(salvo.fotos_antes),...urls(salvo.foto_antes),...(ad.antes||[])]),dur=uniq([...urls(salvo.fotos_durante),...urls(salvo.foto_durante),...(ad.durante||[])]),dep=uniq([...urls(salvo.fotos_depois),...urls(salvo.foto_depois),...(ad.depois||[])]);
      const atendimento=codDoForm(form,'MAN',eq?.codigo||salvo.codigo);
      const r=await baseFetch(`${SUPABASE_URL}/rest/v1/manutencoes?id=eq.${Number(salvo.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify({fotos_antes:ant,fotos_durante:dur,fotos_depois:dep,atendimento_codigo:atendimento})});if(r.ok)Object.assign(salvo,(await r.json())[0]||{});
    }catch(e){console.warn('Fotos múltiplas da manutenção não puderam ser complementadas.',e)}
    return salvo;
  };

  window.fetch=async function(input,init={}){
    let url=typeof input==='string'?input:input?.url||'';let method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
    if(method==='POST'&&/\/rest\/v1\/instalacoes(?:\?|$)/.test(url)&&init?.body){
      try{const body=JSON.parse(init.body),form=document.getElementById('instalacaoForm'),ins=[...(form?.querySelectorAll('input[type="file"]')||[])];
        const grupos={antes:urls(body.foto_antes),durante:urls(body.foto_durante),depois:urls(body.foto_depois)};
        for(let i=0;i<ins.length;i++){const etapa=['antes','durante','depois'][i]||'evidencia',mais=[...ins[i].files].slice(1);if(mais.length)grupos[etapa].push(...await uploadVarios(mais,`INST-${Date.now()}`,etapa))}
        body.fotos_antes=uniq(grupos.antes);body.fotos_durante=uniq(grupos.durante);body.fotos_depois=uniq(grupos.depois);body.atendimento_codigo=codDoForm(form,'INS',body.produto);init={...init,body:JSON.stringify(body)};
      }catch(e){console.warn('Falha ao preparar fotos múltiplas da instalação.',e)}
    }
    if(method==='POST'&&/\/rest\/v1\/equipamentos(?:\?|$)/.test(url)&&init?.body){
      try{const body=JSON.parse(init.body),f=document.getElementById('equipForm'),inp=f?.querySelector('[data-extra-fotos="equipamento"]');if(inp?.files?.length)body.fotos=await uploadVarios(inp.files,body.codigo||'EQUIPAMENTO','cadastro');init={...init,body:JSON.stringify(body)}}catch(e){console.warn('Falha ao preparar fotos do equipamento.',e)}
    }
    if((method==='POST'||method==='PATCH')&&/\/rest\/v1\/orcamentos(?:\?|$)/.test(url)&&init?.body){
      try{const body=JSON.parse(init.body),f=document.getElementById('orcamentoForm'),inp=f?.querySelector('[data-extra-fotos="orcamento"]');if(inp?.files?.length)body.fotos_vistoria=uniq([...urls(body.fotos_vistoria),...await uploadVarios(inp.files,`ORC-${Date.now()}`,'vistoria')]);const comp=f?.querySelector('[data-levantamento-complemento]')?.value;body.levantamento_codigo=body.levantamento_codigo||codigo('LEV',body.data,comp,body.cliente);init={...init,body:JSON.stringify(body)}}catch(e){console.warn('Falha ao preparar fotos do orçamento.',e)}
    }
    if(method==='POST'&&/\/rest\/v1\/analises(?:\?|$)/.test(url)&&init?.body){
      try{const body=JSON.parse(init.body),f=document.getElementById('analiseForm'),inp=f?.querySelector('input[type="file"]');if(inp?.files?.length)body.fotos=await uploadVarios(inp.files,body.codigo||`ANA-${Date.now()}`,'analise');body.atendimento_codigo=codDoForm(f,'ANA',body.codigo||body.cliente);init={...init,body:JSON.stringify(body)}}catch(e){console.warn('Falha ao preparar registro avançado da análise.',e)}
    }
    return baseFetch(input,init);
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function gerarConsolidado(){
    const cod=prompt('Informe o código do atendimento que deseja consolidar (ex.: MAN-20260903-NICOLAS):','');if(!cod)return;
    const r=await baseFetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&atendimento_codigo=eq.${encodeURIComponent(cod)}&order=id.asc`,{headers:SUPABASE_HEADERS});if(!r.ok)return alert('Não foi possível buscar o atendimento.');const regs=await r.json();if(!regs.length)return alert('Nenhuma manutenção encontrada com esse código.');
    const w=window.open('','_blank');if(!w)return alert('Permita pop-ups para abrir o relatório.');
    const blocos=regs.map((x,i)=>{const fs=[...urls(x.fotos_antes),...urls(x.foto_antes),...urls(x.fotos_durante),...urls(x.foto_durante),...urls(x.fotos_depois),...urls(x.foto_depois)];return `<section class="equip"><h2>${i+1}. ${esc(x.codigo||x.tipo||'Equipamento')}</h2><div class="dados"><b>Tipo:</b> ${esc(x.tipo||'—')} &nbsp; <b>Local:</b> ${esc(x.localizacao||'—')} &nbsp; <b>Técnico:</b> ${esc(x.tecnico||'—')}</div><p>${esc(x.observacoes||'Sem observações adicionais.')}</p>${fs.length?`<div class="fotos">${uniq(fs).map((u,j)=>`<figure><img src="${esc(u)}"><figcaption>Evidência ${j+1}</figcaption></figure>`).join('')}</div>`:'<p>Sem fotos vinculadas.</p>'}</section>`}).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(cod)}</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#24352d;margin:0}header{border-bottom:3px solid #176b45;padding-bottom:10px;margin-bottom:14px}h1,h2{color:#176b45}.equip{page-break-inside:auto;border-bottom:1px solid #ccd9d2;padding:8px 0 16px}.dados{font-size:11px}.fotos{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fotos figure{margin:0;border:1px solid #ddd;padding:4px;break-inside:avoid}.fotos img{width:100%;height:72mm;object-fit:contain}.fotos figcaption{text-align:center;font-size:9px;font-weight:bold}@media print{button{display:none}}@media(max-width:700px){.fotos{grid-template-columns:1fr}.fotos img{height:auto}}</style></head><body><header><h1>NAPRICELO SOLUÇÕES AMBIENTAIS</h1><b>RELATÓRIO CONSOLIDADO DE MANUTENÇÃO</b><div>Código do atendimento: ${esc(cod)}</div><div>Cliente: ${esc(regs[0].cliente||'—')} • Unidade: ${esc(regs[0].unidade||'—')} • Município: ${esc(regs[0].municipio||'—')}</div><div>Data: ${esc(regs[0].data||'—')}</div></header>${blocos}<button onclick="window.print()">Imprimir / Salvar PDF</button></body></html>`);w.document.close();
  }
  window.gerarRelatorioConsolidadoAtendimento=gerarConsolidado;
  function prepararHistorico(){const tabs=document.querySelector('#historico .tabs');if(tabs&&!tabs.querySelector('[data-consolidado]')){const b=document.createElement('button');b.type='button';b.dataset.consolidado='1';b.textContent='Relatório consolidado';b.onclick=gerarConsolidado;tabs.appendChild(b)}}

  // Acrescenta todas as fotos ao relatório técnico individual, preservando o relatório já existente.
  const relBase=window.gerarRelatorioTecnicoExecucao;
  if(typeof relBase==='function')window.gerarRelatorioTecnicoExecucao=function(id){
    const lista=window.cloudHistorico?.manut||[];const reg=lista.find(x=>String(x.id)===String(id));const abrir=window.open;let win=null;window.open=function(){win=abrir.apply(window,arguments);return win};
    try{return relBase.apply(this,arguments)}finally{window.open=abrir;if(win&&reg)setTimeout(()=>{try{const sec=win.document.querySelector('.photos');if(!sec)return;const atuais=new Set([...sec.querySelectorAll('img')].map(i=>i.getAttribute('src')));const grupos=[['ANTES – condição encontrada',reg.fotos_antes],['DURANTE – execução do serviço',reg.fotos_durante],['DEPOIS – condição final',reg.fotos_depois]];grupos.forEach(([nome,arr])=>urls(arr).forEach((u,i)=>{if(atuais.has(u))return;const f=win.document.createElement('figure');f.innerHTML=`<div class="pic"><img src="${esc(u)}"></div><figcaption>${esc(nome)}${urls(arr).length>1?` • ${i+1}`:''}</figcaption>`;sec.insertBefore(f,sec.querySelector('footer'));atuais.add(u)}))}catch(e){console.warn(e)}},180)}
  };

  const css=document.createElement('style');css.textContent='.codigo-atendimento-box{display:block;margin:9px 0}.codigo-linha{display:flex;align-items:center;gap:6px}.codigo-linha span{font-weight:800;color:#176b45;white-space:nowrap}.codigo-linha input{flex:1}.codigo-atendimento-box small,.registro-fotos-extra .muted{display:block;color:#64736c;font-size:11px;line-height:1.35;margin-top:4px}.registro-fotos-extra{margin:14px 0;padding:12px;border:1px solid #cfe0d7;border-radius:10px;background:#f8fbf9}.registro-fotos-extra h3{margin-top:0;color:#176b45}@media(max-width:700px){.codigo-linha{align-items:stretch;flex-direction:column}.codigo-linha span{align-self:flex-start}}';document.head.appendChild(css);
  function prepararTudo(){prepararFotosExistentes();prepararEquipamento();prepararOrcamento();prepararHistorico()}
  prepararTudo();new MutationObserver(prepararTudo).observe(document.body,{childList:true,subtree:true});setTimeout(prepararTudo,500);
})();